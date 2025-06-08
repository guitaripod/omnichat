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

    console.log('Initializing AI Provider Factory...');
    AIProviderFactory.initialize({
      openaiApiKey,
      anthropicApiKey,
      googleApiKey,
    });

    // Parse request body
    console.log('Parsing request body...');
    const body = await req.json();
    const { messages, model, temperature, maxTokens, stream = true } = body;
    console.log('Request details:', { model, messagesCount: messages?.length, stream });

    if (!messages || !model) {
      return new Response('Missing required fields: messages and model', { status: 400 });
    }

    // Get model info to determine provider
    // Since factory isn't initialized on client, we need to find the model directly
    console.log('Finding model info...');
    const allModels = Object.values(AI_MODELS).flat();
    const modelInfo = allModels.find((m) => m.id === model);
    if (!modelInfo) {
      return new Response(`Invalid model: ${model}`, { status: 400 });
    }
    console.log('Model info found:', modelInfo.provider, modelInfo.id);

    // Get the provider instance
    console.log('Getting provider instance...');
    const provider = AIProviderFactory.getProvider(modelInfo.provider);
    console.log('Provider retrieved successfully');

    // Generate response
    console.log('Calling chatCompletion...');
    const response = await provider.chatCompletion({
      model,
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

    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

    // Handle specific error types
    if (errorMessage.includes('not initialized')) {
      return new Response(errorMessage, { status: 503 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
