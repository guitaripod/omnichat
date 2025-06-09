import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AIProviderFactory, AI_MODELS } from '@/services/ai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = user.id;

    // Initialize AI providers from Cloudflare secrets
    // Check if environment variables are available
    console.log('Checking environment variables...');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;

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
    const body = await req.json();
    const { messages, model, temperature, maxTokens, stream = true, ollamaBaseUrl } = body;

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

    if (!messages || !model) {
      return new Response('Missing required fields: messages and model', { status: 400 });
    }

    // Get model info to determine provider
    // Since factory isn't initialized on client, we need to find the model directly
    console.log('Finding model info...');

    // Handle dynamic Ollama models
    let provider;
    let actualModelName = model;

    if (model.startsWith('ollama/')) {
      // This is an Ollama model
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
