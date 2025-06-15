import { ModelType } from '@/types';

export const APP_NAME = 'OmniChat';
export const APP_DESCRIPTION = 'Multi-LLM Chat Application with Local Model Support';

export const MODELS: Record<
  ModelType,
  {
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'ollama';
    description: string;
    maxTokens: number;
    supportsVision: boolean;
    supportsStreaming: boolean;
  }
> = {
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable OpenAI model',
    maxTokens: 128000,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Smaller, faster GPT-4o variant',
    maxTokens: 128000,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Previous generation GPT-4',
    maxTokens: 128000,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most capable Claude model',
    maxTokens: 200000,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-5-haiku': {
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fast and efficient Claude model',
    maxTokens: 200000,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Previous generation Claude',
    maxTokens: 200000,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Fast Google AI model',
    maxTokens: 1048576,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Advanced Google AI model',
    maxTokens: 2097152,
    supportsVision: true,
    supportsStreaming: true,
  },
  'ollama-llama3': {
    name: 'Llama 3 (Local)',
    provider: 'ollama',
    description: 'Local Llama 3 model',
    maxTokens: 8192,
    supportsVision: false,
    supportsStreaming: true,
  },
  'ollama-mistral': {
    name: 'Mistral (Local)',
    provider: 'ollama',
    description: 'Local Mistral model',
    maxTokens: 8192,
    supportsVision: false,
    supportsStreaming: true,
  },
  'ollama-custom': {
    name: 'Custom Ollama Model',
    provider: 'ollama',
    description: 'User-specified local model',
    maxTokens: 8192,
    supportsVision: false,
    supportsStreaming: true,
  },
};

// Note: Subscription tiers have been moved to battery-based pricing
// See src/lib/battery-pricing-v2.ts and src/lib/subscription-plans.ts
