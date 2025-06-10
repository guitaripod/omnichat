import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';
import { OllamaProvider } from './providers/ollama';
import { XAIProvider } from './providers/xai';
import { DeepSeekProvider } from './providers/deepseek';
import { ChatProvider, AIProvider, AIServiceConfig, AI_MODELS, AIModel } from './types';

export class AIProviderFactory {
  private static providers: Map<AIProvider, ChatProvider> = new Map();
  private static config: AIServiceConfig = {};
  private static initialized = false;

  static async initialize(config: AIServiceConfig) {
    this.config = config;

    if (config.openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(config.openaiApiKey));
    }

    if (config.anthropicApiKey) {
      this.providers.set('anthropic', new AnthropicProvider(config.anthropicApiKey));
    }

    if (config.googleApiKey) {
      this.providers.set('google', new GoogleProvider(config.googleApiKey));
    }

    if (config.ollamaBaseUrl) {
      this.providers.set('ollama', new OllamaProvider(config.ollamaBaseUrl));
    }

    if (config.xaiApiKey) {
      console.log('[AIProviderFactory] Initializing xAI provider...');
      const xaiProvider = new XAIProvider(config.xaiApiKey);
      this.providers.set('xai', xaiProvider);
      console.log(
        '[AIProviderFactory] xAI provider initialized with',
        xaiProvider.getModels().length,
        'models'
      );
    }

    if (config.deepseekApiKey) {
      console.log('[AIProviderFactory] Initializing DeepSeek provider...');
      this.providers.set('deepseek', new DeepSeekProvider(config.deepseekApiKey));
    }

    this.initialized = true;
  }

  static getProvider(provider: AIProvider): ChatProvider {
    const instance = this.providers.get(provider);
    if (!instance) {
      throw new Error(
        `Provider ${provider} not initialized. Please ${provider === 'ollama' ? 'configure base URL' : 'provide API key'}.`
      );
    }
    return instance;
  }

  static getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  static getAllModels(): AIModel[] {
    const availableProviders = this.getAvailableProviders();
    return availableProviders.flatMap((provider) => {
      // For xAI, get models from the provider instance
      if (provider === 'xai') {
        const xaiProvider = this.providers.get('xai') as XAIProvider;
        if (xaiProvider) {
          return xaiProvider.getModels();
        }
      }
      return AI_MODELS[provider];
    });
  }

  static getModelsForProvider(provider: AIProvider): AIModel[] {
    if (!this.providers.has(provider)) {
      return [];
    }

    // For xAI, get models from the provider instance
    if (provider === 'xai') {
      const xaiProvider = this.providers.get('xai') as XAIProvider;
      if (xaiProvider) {
        return xaiProvider.getModels();
      }
    }

    return AI_MODELS[provider];
  }

  static getModelById(modelId: string): AIModel | undefined {
    const allModels = this.getAllModels();
    return allModels.find((model) => model.id === modelId);
  }

  static async validateApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
    try {
      let tempProvider: ChatProvider;

      switch (provider) {
        case 'openai':
          tempProvider = new OpenAIProvider(apiKey);
          break;
        case 'anthropic':
          tempProvider = new AnthropicProvider(apiKey);
          break;
        case 'google':
          tempProvider = new GoogleProvider(apiKey);
          break;
        case 'ollama':
          // For Ollama, apiKey is actually the base URL
          tempProvider = new OllamaProvider(apiKey);
          break;
        case 'xai':
          tempProvider = new XAIProvider(apiKey);
          break;
        case 'deepseek':
          tempProvider = new DeepSeekProvider(apiKey);
          break;
        default:
          return false;
      }

      return await tempProvider.validateApiKey(apiKey);
    } catch (error) {
      console.error(`API key validation error for ${provider}:`, error);
      return false;
    }
  }

  static updateApiKey(provider: AIProvider, apiKey: string) {
    switch (provider) {
      case 'openai':
        this.config.openaiApiKey = apiKey;
        this.providers.set('openai', new OpenAIProvider(apiKey));
        break;
      case 'anthropic':
        this.config.anthropicApiKey = apiKey;
        this.providers.set('anthropic', new AnthropicProvider(apiKey));
        break;
      case 'google':
        this.config.googleApiKey = apiKey;
        this.providers.set('google', new GoogleProvider(apiKey));
        break;
      case 'ollama':
        // For Ollama, apiKey is actually the base URL
        this.config.ollamaBaseUrl = apiKey;
        this.providers.set('ollama', new OllamaProvider(apiKey));
        break;
      case 'xai':
        this.config.xaiApiKey = apiKey;
        this.providers.set('xai', new XAIProvider(apiKey));
        break;
      case 'deepseek':
        this.config.deepseekApiKey = apiKey;
        this.providers.set('deepseek', new DeepSeekProvider(apiKey));
        break;
    }
  }

  static getConfig(): AIServiceConfig {
    return { ...this.config };
  }
}
