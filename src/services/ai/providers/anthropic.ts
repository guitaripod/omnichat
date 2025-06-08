import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateText, type CoreMessage } from 'ai';
import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
  ChatMessage,
} from '../types';

export class AnthropicProvider implements ChatProvider {
  name: AIProvider = 'anthropic';
  models = AI_MODELS.anthropic;
  private anthropic: ReturnType<typeof createAnthropic>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.anthropic = createAnthropic({
      apiKey,
      fetch: globalThis.fetch?.bind(globalThis),
    });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens = 4096, topP, stream = true } = options;

    try {
      if (stream) {
        const response = await streamText({
          model: this.anthropic(model),
          messages: this.mapMessages(messages),
          temperature,
          maxTokens,
          topP,
          abortSignal: new AbortController().signal,
        });

        return {
          stream: response.toDataStreamResponse().body!,
          controller: new AbortController(),
        };
      } else {
        const response = await generateText({
          model: this.anthropic(model),
          messages: this.mapMessages(messages),
          temperature,
          maxTokens,
          topP,
        });

        return response.text;
      }
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(
        `Anthropic API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = createAnthropic({ apiKey });
      const response = await generateText({
        model: testClient('claude-3-5-haiku-20241022'),
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 5,
      });
      return !!response.text;
    } catch (error) {
      console.error('Anthropic API key validation failed:', error);
      return false;
    }
  }

  private mapMessages(messages: ChatMessage[]): CoreMessage[] {
    return messages.map((msg) => {
      if (msg.role === 'tool') {
        // Tool messages are not supported in basic chat, skip them
        return {
          role: 'assistant' as const,
          content: msg.content,
        };
      }

      // Handle images if present
      if (msg.images && msg.images.length > 0 && msg.role === 'user') {
        return {
          role: msg.role,
          content: [
            { type: 'text' as const, text: msg.content },
            ...msg.images.map((image) => ({
              type: 'image' as const,
              image: image,
            })),
          ],
        };
      }

      // Simple text message
      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      };
    });
  }
}
