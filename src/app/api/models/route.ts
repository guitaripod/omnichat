import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AIProviderFactory } from '@/services/ai';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CloudflareEnv } from '../../../../env';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';
import type { AIModel } from '@/services/ai/types';

export const runtime = 'edge';

interface ModelsResponse {
  providers: {
    [key: string]: AIModel[];
  };
}

export async function GET(_req: NextRequest) {
  console.log('[API/models] Starting model fetch request');

  try {
    // Authenticate user
    const clerkUser = await currentUser();
    console.log('[API/models] User authenticated:', !!clerkUser);

    if (!clerkUser && !isDevMode()) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!clerkUser && isDevMode()) {
      const devUser = await getDevUser();
      if (!devUser) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Initialize AI providers from Cloudflare secrets
    let openaiApiKey: string | undefined;
    let anthropicApiKey: string | undefined;
    let googleApiKey: string | undefined;
    let xaiApiKey: string | undefined;

    try {
      // In Cloudflare Pages, secrets are accessed via getRequestContext
      const context = getRequestContext();
      const env = context.env as CloudflareEnv;

      openaiApiKey = env.OPENAI_API_KEY;
      anthropicApiKey = env.ANTHROPIC_API_KEY;
      googleApiKey = env.GOOGLE_API_KEY;
      xaiApiKey = env.XAI_API_KEY;
      console.log('[/api/models] Environment variables from Cloudflare:', {
        hasOpenAI: !!openaiApiKey,
        hasAnthropic: !!anthropicApiKey,
        hasGoogle: !!googleApiKey,
        hasXAI: !!xaiApiKey,
        xaiKeyPreview: xaiApiKey ? xaiApiKey.substring(0, 10) + '...' : 'none',
      });
    } catch (error) {
      // Fallback for local development
      console.log('getRequestContext failed (local dev?), trying process.env:', error);
      openaiApiKey = process.env.OPENAI_API_KEY;
      anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      googleApiKey = process.env.GOOGLE_API_KEY;
      xaiApiKey = process.env.XAI_API_KEY;
      console.log('[/api/models] Environment variables from process.env:', {
        hasOpenAI: !!openaiApiKey,
        hasAnthropic: !!anthropicApiKey,
        hasGoogle: !!googleApiKey,
        hasXAI: !!xaiApiKey,
        xaiKeyPreview: xaiApiKey ? xaiApiKey.substring(0, 10) + '...' : 'none',
      });
    }

    // Initialize the factory with available keys
    await AIProviderFactory.initialize({
      openaiApiKey,
      anthropicApiKey,
      googleApiKey,
      xaiApiKey,
    });

    // Get all available providers and their models
    const response: ModelsResponse = {
      providers: {},
    };

    const availableProviders = AIProviderFactory.getAvailableProviders();
    console.log('[/api/models] Available providers after initialization:', availableProviders);

    // Fetch models for each provider
    for (const provider of availableProviders) {
      try {
        const providerInstance = AIProviderFactory.getProvider(provider);

        // If provider has fetchModels method, use it to get fresh models
        if (providerInstance.fetchModels) {
          const models = await providerInstance.fetchModels();
          response.providers[provider] = models;
        } else {
          // Otherwise use the static models
          const models = AIProviderFactory.getModelsForProvider(provider);
          response.providers[provider] = models;
        }
      } catch (error) {
        console.error(`Error fetching models for ${provider}:`, error);
        // Fallback to static models on error
        response.providers[provider] = AIProviderFactory.getModelsForProvider(provider);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching models:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
