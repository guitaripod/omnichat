export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

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
  webSearch?: boolean;
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
  ollamaBaseUrl?: string;
  braveApiKey?: string;
  defaultProvider?: AIProvider;
  defaultModel?: string;
}

export interface StreamChunk {
  type: 'content' | 'error' | 'done';
  content?: string;
  error?: Error;
}

export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'Latest model - excels at coding & instruction following',
    },
    {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'Smaller, faster GPT-4.1 - available for free users',
    },
    {
      id: 'gpt-4.1-nano',
      name: 'GPT-4.1 Nano',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Smallest GPT-4.1 - ultra-fast responses',
    },
    {
      id: 'o3',
      name: 'O3',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 65536,
      supportsVision: true,
      supportsTools: true,
      description: 'Advanced reasoning - 20% fewer errors than O1',
    },
    {
      id: 'o3-mini',
      name: 'O3 Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 65536,
      supportsVision: true,
      supportsTools: true,
      description: 'Cost-effective reasoning model with web search',
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'Previous generation - still capable',
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutput: 16384,
      supportsVision: true,
      supportsTools: true,
      description: 'Smaller GPT-4o - balanced performance',
    },
  ],
  anthropic: [
    {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Most capable - Level 3 safety rating',
    },
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'High performance with exceptional reasoning',
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Hybrid reasoning - standard & deep thinking modes',
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (New)',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Upgraded version with computer use capability',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Fast - surpasses Claude 3 Opus on benchmarks',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 4096,
      supportsVision: true,
      supportsTools: true,
      description: 'Previous flagship - still powerful',
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutput: 4096,
      supportsVision: true,
      supportsTools: true,
      description: 'Balanced performance and cost',
    },
  ],
  google: [
    {
      id: 'gemini-2.5-pro-preview-06-05',
      name: 'Gemini 2.5 Pro Preview',
      provider: 'google',
      contextWindow: 2097152,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Latest preview - multimodal with audio/video',
    },
    {
      id: 'gemini-2.5-flash-preview-05-20',
      name: 'Gemini 2.5 Flash Preview',
      provider: 'google',
      contextWindow: 1048576,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Fast preview model with multimodal support',
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      contextWindow: 1048576,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Latest stable - fast multimodal generation',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      contextWindow: 2097152,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Advanced reasoning and long context',
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      contextWindow: 1048576,
      maxOutput: 8192,
      supportsVision: true,
      supportsTools: true,
      description: 'Fast and efficient for most tasks',
    },
  ],
  ollama: [], // Ollama models are dynamically loaded from the local server
};
