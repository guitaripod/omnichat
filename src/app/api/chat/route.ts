import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AIProviderFactory, AI_MODELS } from '@/services/ai';
import type { ChatMessage } from '@/services/ai/types';
import { getD1Database } from '@/lib/db/get-db';
import { getUserByClerkId } from '@/lib/db/queries';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CloudflareEnv } from '../../../../env';

export const runtime = 'edge';

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  ollamaBaseUrl?: string;
  conversationId?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = user.id;

    // Initialize AI providers from Cloudflare secrets
    console.log('Accessing Cloudflare secrets...');

    let openaiApiKey: string | undefined;
    let anthropicApiKey: string | undefined;
    let googleApiKey: string | undefined;

    try {
      // In Cloudflare Pages, secrets are accessed via getRequestContext
      const context = getRequestContext();
      const env = context.env as CloudflareEnv;

      openaiApiKey = env.OPENAI_API_KEY;
      anthropicApiKey = env.ANTHROPIC_API_KEY;
      googleApiKey = env.GOOGLE_API_KEY;

      console.log('Cloudflare env keys available:', Object.keys(env));
      console.log('Secrets found:', {
        openai: !!openaiApiKey,
        anthropic: !!anthropicApiKey,
        google: !!googleApiKey,
      });
    } catch (error) {
      // Fallback for local development
      console.log('getRequestContext failed (local dev?), trying process.env:', error);
      openaiApiKey = process.env.OPENAI_API_KEY;
      anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      googleApiKey = process.env.GOOGLE_API_KEY;
    }

    if (!openaiApiKey || !anthropicApiKey || !googleApiKey) {
      console.error('Missing API keys:', {
        openai: !!openaiApiKey,
        anthropic: !!anthropicApiKey,
        google: !!googleApiKey,
      });
      return new Response('API keys not configured', { status: 503 });
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
      conversationId,
    } = body;

    console.log('Initializing AI Provider Factory...');
    AIProviderFactory.initialize({
      openaiApiKey,
      anthropicApiKey,
      googleApiKey,
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

    // Get model info to determine provider
    // Since factory isn't initialized on client, we need to find the model directly
    console.log('Finding model info...');

    // Handle dynamic Ollama models
    let provider;
    let actualModelName = model;

    if (model.startsWith('ollama/')) {
      // This is an Ollama model
      if (!ollamaBaseUrl) {
        return new Response('Provider ollama not initialized. Please provide API key.', {
          status: 503,
        });
      }
      actualModelName = model.replace('ollama/', '');
      provider = AIProviderFactory.getProvider('ollama');
    } else {
      // This is a static model from AI_MODELS
      const allModels = Object.values(AI_MODELS).flat();
      const modelInfo = allModels.find((m) => m.id === model);
      if (!modelInfo) {
        return new Response(`Invalid model: ${model}`, { status: 400 });
      }
      console.log('Model info found:', modelInfo.provider, modelInfo.id);
      provider = AIProviderFactory.getProvider(modelInfo.provider);
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
    });

    // Note: Messages are already saved client-side in chat-container.tsx
    // to avoid duplication, we don't save them here

    if (stream && typeof response === 'object' && 'stream' in response) {
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
      // Return non-streaming response
      return NextResponse.json({ message: response });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

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
