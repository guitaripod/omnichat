// AI response generation module
import { AIProviderFactory, AI_MODELS } from '@/services/ai';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CloudflareEnv } from '@/../../env';
import type { ChatMessage } from '@/services/ai/types';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  model: string;
  userId: string;
  conversationId: string;
}

export async function getAIResponse(options: AIRequestOptions): Promise<ReadableStream> {
  const { messages, model } = options;
  const env = getRequestContext().env as CloudflareEnv;
  
  // Initialize provider factory if not already done
  if (!AIProviderFactory.getAvailableProviders().length) {
    await AIProviderFactory.initialize({
      openaiApiKey: env.OPENAI_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      googleApiKey: env.GOOGLE_API_KEY,
      xaiApiKey: env.XAI_API_KEY,
      deepseekApiKey: env.DEEPSEEK_API_KEY,
    });
  }
  
  // Convert messages to the expected format
  const chatMessages: ChatMessage[] = messages;
  
  // Determine provider from model
  let providerName: string;
  if (model.startsWith('gpt-')) {
    providerName = 'openai';
  } else if (model.startsWith('claude-')) {
    providerName = 'anthropic';
  } else if (model.startsWith('gemini-')) {
    providerName = 'google';
  } else if (model.includes('llama') || model.includes('sonar')) {
    // These are Perplexity models but using OpenAI provider
    providerName = 'openai';
  } else {
    // Find model in AI_MODELS
    const allModels = Object.values(AI_MODELS).flat();
    const modelInfo = allModels.find((m) => m.id === model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    providerName = modelInfo.provider;
  }
  
  // Get the provider instance
  const provider = AIProviderFactory.getProvider(providerName as any);
  
  // Generate streaming response
  const response = await provider.chatCompletion({
    messages: chatMessages,
    model,
    stream: true,
  });
  
  // chatCompletion returns StreamResponse when stream is true
  if (typeof response === 'string') {
    throw new Error('Expected streaming response but got string');
  }
  
  return response.stream;
}