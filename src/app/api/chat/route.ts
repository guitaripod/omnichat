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
import { checkBatteryBalance } from '@/lib/usage-tracking';

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
}

export async function POST(req: NextRequest) {
  let user: any = null;
  let conversationId: string | undefined;

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
    } = body;

    conversationId = body.conversationId;

    // Only require API keys for non-Ollama models
    const isOllamaModel = model?.startsWith('ollama/');

    if (!isOllamaModel && (!openaiApiKey || !anthropicApiKey || !googleApiKey)) {
      console.error('Missing API keys:', {
        openai: !!openaiApiKey,
        anthropic: !!anthropicApiKey,
        google: !!googleApiKey,
      });
      return new Response('API keys not configured', { status: 503 });
    }

    console.log('Initializing AI Provider Factory...');
    await AIProviderFactory.initialize({
      openaiApiKey,
      anthropicApiKey,
      googleApiKey,
      xaiApiKey,
      deepseekApiKey,
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

    // Get database instance
    let db: ReturnType<typeof getD1Database> | null = null;

    try {
      db = getD1Database();
      await getUserByClerkId(db, userId);
    } catch (error) {
      console.error('Database connection error:', error);
      // Continue without database for now
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
    console.log('Request parameters:', {
      model,
      messagesCount: messages.length,
      temperature,
      maxTokens,
      stream,
      userId,
    });

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

      // Return streaming response with proper headers for Cloudflare
      return new NextResponse(response.stream, {
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

      // Return non-streaming response
      return NextResponse.json({ message: response });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    console.error('Error type:', error?.constructor?.name);
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
