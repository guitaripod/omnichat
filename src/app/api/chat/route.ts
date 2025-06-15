import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AIProviderFactory, AI_MODELS } from '@/services/ai';
import type { ChatMessage } from '@/services/ai/types';
import { getD1Database } from '@/lib/db/get-db';
import { getUserByClerkId } from '@/lib/db/queries';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CloudflareEnv } from '../../../../env';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';
import { AuditLogger } from '@/services/security';
import { checkBatteryBalance, trackApiUsage } from '@/lib/usage-tracking';
import { canUseModel } from '@/lib/tier';
import { UPGRADE_MESSAGES } from '@/lib/subscription-plans';
import { generateId } from '@/utils';
import { createTokenTrackingStream } from '@/services/ai/stream-wrapper';

export const runtime = 'edge';

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  ollamaBaseUrl?: string;
  conversationId?: string;
  webSearch?: boolean;
  imageGenerationOptions?: {
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
    background?: string;
    outputFormat?: string;
    outputCompression?: number;
  };
  userApiKeys?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  let user: any = null;
  let conversationId: string | undefined;
  let dbUser = null;
  let messageId: string | undefined;

  try {
    // Authenticate user
    const clerkUser = await currentUser();

    let userId: string;

    if (clerkUser) {
      userId = clerkUser.id;
      user = clerkUser;
    } else if (isDevMode()) {
      // Use dev user in dev mode
      const devUser = await getDevUser();
      if (devUser) {
        userId = devUser.id;
        user = devUser;
      } else {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      return new Response('Unauthorized', { status: 401 });
    }

    // Initialize AI providers from Cloudflare secrets
    console.log('Accessing Cloudflare secrets...');

    let openaiApiKey: string | undefined;
    let anthropicApiKey: string | undefined;
    let googleApiKey: string | undefined;
    let xaiApiKey: string | undefined;
    let deepseekApiKey: string | undefined;

    try {
      // In Cloudflare Pages, secrets are accessed via getRequestContext
      const context = getRequestContext();
      const env = context.env as CloudflareEnv;

      openaiApiKey = env.OPENAI_API_KEY;
      anthropicApiKey = env.ANTHROPIC_API_KEY;
      googleApiKey = env.GOOGLE_API_KEY;
      xaiApiKey = env.XAI_API_KEY;
      deepseekApiKey = env.DEEPSEEK_API_KEY;

      console.log('Cloudflare env keys available:', Object.keys(env));
      console.log('Secrets found:', {
        openai: !!openaiApiKey,
        anthropic: !!anthropicApiKey,
        google: !!googleApiKey,
        xai: !!xaiApiKey,
        deepseek: !!deepseekApiKey,
      });
    } catch (error) {
      // Fallback for local development
      console.log('getRequestContext failed (local dev?), trying process.env:', error);
      openaiApiKey = process.env.OPENAI_API_KEY;
      anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      googleApiKey = process.env.GOOGLE_API_KEY;
      xaiApiKey = process.env.XAI_API_KEY;
      deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    }

    // Parse request body
    console.log('Parsing request body...');
    const body = (await req.json()) as ChatRequest;
    const {
      messages,
      model,
      temperature,
      maxTokens,
      stream = true,
      ollamaBaseUrl,
      webSearch = false,
      imageGenerationOptions,
      userApiKeys = {},
    } = body;

    conversationId = body.conversationId;

    // Generate a message ID for tracking
    messageId = generateId();

    // Get database instance and user data before access check
    let db: ReturnType<typeof getD1Database> | null = null;

    try {
      db = getD1Database();
      dbUser = await getUserByClerkId(db, userId);
      console.log('DB User fetched:', {
        userId,
        tier: dbUser?.tier,
        subscriptionStatus: dbUser?.subscriptionStatus,
      });
    } catch (error) {
      console.error('Database connection error:', error);
      // Continue without database for now
    }

    // Check if user can access the model
    const isOllamaModel = model?.startsWith('ollama/');
    const modelProvider = isOllamaModel
      ? 'ollama'
      : AI_MODELS.openai.some((m) => m.id === model)
        ? 'openai'
        : AI_MODELS.anthropic.some((m) => m.id === model)
          ? 'anthropic'
          : AI_MODELS.google.some((m) => m.id === model)
            ? 'google'
            : AI_MODELS.xai?.some((m) => m.id === model)
              ? 'xai'
              : AI_MODELS.deepseek?.some((m) => m.id === model)
                ? 'deepseek'
                : null;

    if (!modelProvider) {
      return new Response(`Invalid model: ${model}`, { status: 400 });
    }

    // Check model access
    const canAccess = canUseModel({ provider: modelProvider }, dbUser, userApiKeys);

    if (!canAccess) {
      return new Response(
        JSON.stringify({
          error: 'Model access denied',
          message: UPGRADE_MESSAGES.apiKey,
          model,
          provider: modelProvider,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // For cloud models, check if we have the necessary API keys
    // (either from user or from OmniChat for paid users)
    if (!isOllamaModel) {
      const hasOmniChatKeys =
        openaiApiKey || anthropicApiKey || googleApiKey || xaiApiKey || deepseekApiKey;
      const hasUserKey = userApiKeys[modelProvider];

      if (!hasOmniChatKeys && !hasUserKey) {
        console.error('Missing API keys for provider:', modelProvider);
        return new Response('API keys not configured', { status: 503 });
      }
    }

    console.log('Initializing AI Provider Factory...');
    // Use user's API key if available, otherwise use OmniChat's keys
    await AIProviderFactory.initialize({
      openaiApiKey: userApiKeys.openai || openaiApiKey,
      anthropicApiKey: userApiKeys.anthropic || anthropicApiKey,
      googleApiKey: userApiKeys.google || googleApiKey,
      xaiApiKey: userApiKeys.xai || xaiApiKey,
      deepseekApiKey: userApiKeys.deepseek || deepseekApiKey,
      ollamaBaseUrl,
    });
    console.log('Request details:', {
      model,
      messagesCount: messages?.length,
      stream,
      ollamaBaseUrl,
    });

    if (!messages || !model || !conversationId) {
      return new Response('Missing required fields: messages, model, and conversationId', {
        status: 400,
      });
    }

    // Check battery balance before processing (skip for Ollama models)
    if (!isOllamaModel && db) {
      console.log('Checking battery balance...');
      const batteryCheck = await checkBatteryBalance(userId, model);

      if (!batteryCheck.hasBalance) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient battery balance',
            currentBalance: batteryCheck.currentBalance,
            estimatedCost: batteryCheck.estimatedCost,
          }),
          {
            status: 402, // Payment Required
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get model info to determine provider
    // Since factory isn't initialized on client, we need to find the model directly
    console.log('Finding model info...');

    // Handle dynamic Ollama models
    let provider;
    let actualModelName = model;
    let modelSupportsWebSearch = false;
    let modelSupportsImageGeneration = false;

    if (model.startsWith('ollama/')) {
      // This is an Ollama model
      if (!ollamaBaseUrl) {
        return new Response(
          'Ollama base URL not configured. Please configure Ollama in Profile > API Settings.',
          {
            status: 503,
          }
        );
      }
      actualModelName = model.replace('ollama/', '');
      provider = AIProviderFactory.getProvider('ollama');
      modelSupportsWebSearch = false; // Ollama doesn't support web search
      modelSupportsImageGeneration = false; // Ollama doesn't support image generation
    } else {
      // This is a static model from AI_MODELS
      const allModels = Object.values(AI_MODELS).flat();
      const modelInfo = allModels.find((m) => m.id === model);
      if (!modelInfo) {
        return new Response(`Invalid model: ${model}`, { status: 400 });
      }
      console.log('Model info found:', modelInfo.provider, modelInfo.id);
      provider = AIProviderFactory.getProvider(modelInfo.provider);
      modelSupportsWebSearch = modelInfo.supportsWebSearch || false;
      modelSupportsImageGeneration = modelInfo.supportsImageGeneration || false;
    }

    // Get the provider instance
    console.log('Getting provider instance...');
    console.log('Provider retrieved successfully');
    console.log(`Provider type: ${provider.name}`);
    console.log(`Available models for provider: ${provider.models.map((m) => m.id).join(', ')}`);

    // Generate response
    console.log('Calling chatCompletion...');
    console.log('[DEPLOYMENT v2] Battery tracking enabled');
    console.log('Request parameters:', {
      model,
      messagesCount: messages.length,
      temperature,
      maxTokens,
      stream,
      userId,
    });

    // Prepare messages for token tracking
    const fullMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await provider.chatCompletion({
      model: actualModelName,
      messages,
      temperature,
      maxTokens,
      stream,
      userId,
      webSearch: webSearch && modelSupportsWebSearch,
      imageGeneration: modelSupportsImageGeneration,
      imageGenerationOptions,
    });

    // Note: Messages are already saved client-side in chat-container.tsx
    // to avoid duplication, we don't save them here

    if (stream && typeof response === 'object' && 'stream' in response) {
      // Log successful streaming chat
      AuditLogger.logApiRequest(req, user, 'api.chat.stream', 'chat', {
        model,
        conversationId,
        messageCount: messages.length,
        webSearch,
      }).catch(console.error);

      // Wrap the stream with token tracking
      const trackedStream = createTokenTrackingStream({
        originalStream: response.stream,
        userId,
        conversationId: conversationId!,
        messageId: messageId!,
        model: actualModelName,
        messages: fullMessages,
        isOllamaModel,
      });

      // Return streaming response with proper headers for Cloudflare
      return new NextResponse(trackedStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Content-Encoding': 'identity', // Critical for Cloudflare streaming
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable Nginx buffering
        },
      });
    } else {
      // Log successful non-streaming chat
      AuditLogger.logApiRequest(req, user, 'api.chat.create', 'chat', {
        model,
        conversationId,
        messageCount: messages.length,
        webSearch,
      }).catch(console.error);

      // Track usage for non-streaming response
      if (!isOllamaModel && db && messageId && typeof response === 'string') {
        console.log('[Chat API] Non-streaming response, tracking usage...');
        try {
          const { StreamingTokenTracker } = await import('@/lib/token-counting');
          const tokenTracker = new StreamingTokenTracker(fullMessages, actualModelName);
          tokenTracker.addChunk(response);
          const tokenCount = tokenTracker.getTokenCount();

          console.log('[Chat API] Token count for non-streaming:', {
            inputTokens: tokenCount.inputTokens,
            outputTokens: tokenCount.outputTokens,
            totalTokens: tokenCount.totalTokens,
            model: actualModelName,
          });

          await trackApiUsage({
            userId,
            conversationId: conversationId!,
            messageId,
            model: actualModelName,
            inputTokens: tokenCount.inputTokens,
            outputTokens: tokenCount.outputTokens,
            cached: false,
          });

          console.log('[Chat API] ✓ Usage tracked for non-streaming response');
        } catch (error) {
          console.error('[Chat API] ERROR: Failed to track usage for non-streaming');
          console.error('[Chat API] Error details:', error);
        }
      } else if (isOllamaModel) {
        console.log('[Chat API] Ollama model - skipping usage tracking for non-streaming');
      }

      // Return non-streaming response
      console.log('[Chat API] Returning non-streaming response');
      console.log('[Chat API] ==================== END CHAT REQUEST ====================');
      return NextResponse.json({ message: response });
    }
  } catch (error) {
    console.error('[Chat API] ==================== ERROR ====================');
    console.error('[Chat API] Chat API Error:', error);
    console.error('[Chat API] Error type:', error?.constructor?.name);
    console.error('[Chat API] Error details:', {
      userId: user?.id,
      conversationId,
      messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack:
        error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack trace',
    });
    console.error('[Chat API] ==================== END ERROR ====================');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

    // Log error to audit log
    AuditLogger.logApiError(req, user, 'api.chat.create', 'chat', error as Error, {
      conversationId,
    }).catch(console.error);

    // Handle specific error types
    if (errorMessage.includes('not initialized')) {
      return new Response(errorMessage, { status: 503 });
    }

    // Log more details about the error
    if (errorMessage.includes('API error')) {
      console.error('API error details:', {
        message: errorMessage,
        provider: req.headers.get('x-provider'),
        model: req.headers.get('x-model'),
      });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
