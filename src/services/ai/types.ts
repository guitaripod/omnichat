export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutput: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  description?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[];
  toolCalls?: unknown[];
  toolCallId?: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  tools?: unknown[];
  userId?: string;
}

export interface StreamResponse {
  stream: ReadableStream;
  controller?: AbortController;
}

export interface ChatProvider {
  name: AIProvider;
  models: AIModel[];
  chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

export interface AIServiceConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  defaultProvider?: AIProvider;
  defaultModel?: string;
}

export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: 'o3-mini',
      name: 'O3 Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 65536,
      supportsVision: true,
      supportsTools: true,
      description: 'Latest reasoning model (Jan 2025)',
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'Most capable GPT-4 model with vision support',
    },
    {
      id: 'gpt-4o-audio-preview',
      name: 'GPT-4o Audio',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'GPT-4o with audio capabilities',
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'Smaller, faster, cheaper GPT-4 model',
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 4096,
      supportsVision: true,
      supportsTools: true,
      description: 'Previous generation turbo model',
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      contextWindow: 16385,
      maxOutput: 4096,
      supportsTools: true,
      description: 'Fast and efficient for simple tasks',
    },
  ],
  anthropic: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Most intelligent Claude model',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Fast and efficient Claude model',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 4096,
      supportsVision: true,
      supportsTools: true,
      description: 'Powerful model for complex tasks',
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 4096,
      supportsVision: true,
      supportsTools: true,
      description: 'Fastest Claude model',
    },
  ],
  google: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      contextWindow: 1048576,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Latest Gemini model with image generation',
    },
    {
      id: 'gemini-2.0-flash-thinking-exp',
      name: 'Gemini 2.0 Flash Thinking',
      provider: 'google',
      contextWindow: 32767,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Advanced reasoning with thinking process',
    },
    {
      id: 'gemini-exp-1206',
      name: 'Gemini Experimental',
      provider: 'google',
      contextWindow: 2097152,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Latest experimental Gemini model',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      contextWindow: 2097152,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Advanced reasoning and analysis',
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      contextWindow: 1048576,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Fast and versatile',
    },
    {
      id: 'gemini-1.5-flash-8b',
      name: 'Gemini 1.5 Flash 8B',
      provider: 'google',
      contextWindow: 1048576,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Smallest and fastest Gemini model',
    },
  ],
};
