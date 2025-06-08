import { NextRequest } from 'next/server';
import { AIProviderFactory } from '@/services/ai';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  // Initialize AI providers from Cloudflare secrets
  // In Next.js edge runtime on Cloudflare, env vars are available on process.env
  AIProviderFactory.initialize({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    googleApiKey: process.env.GOOGLE_API_KEY!,
  });
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { messages, model, temperature, maxTokens, stream = true } = body;

    if (!messages || !model) {
      return new Response('Missing required fields: messages and model', { status: 400 });
    }

    // Get model info to determine provider
    const modelInfo = AIProviderFactory.getModelById(model);
    if (!modelInfo) {
      return new Response(`Invalid model: ${model}`, { status: 400 });
    }

    // Get the provider instance
    const provider = AIProviderFactory.getProvider(modelInfo.provider);

    // Generate response
    const response = await provider.chatCompletion({
      model,
      messages,
      temperature,
      maxTokens,
      stream,
      userId,
    });

    if (stream && typeof response === 'object' && 'stream' in response) {
      // Return streaming response
      return new Response(response.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Return non-streaming response
      return new Response(JSON.stringify({ message: response }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Chat API Error:', error);

    // Handle specific error types
    if (error.message.includes('not initialized')) {
      return new Response(error.message, { status: 503 });
    }

    return new Response(JSON.stringify({ error: error.message || 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
