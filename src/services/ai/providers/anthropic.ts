import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';
import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
} from '../types';

export class AnthropicProvider implements ChatProvider {
  name: AIProvider = 'anthropic';
  models = AI_MODELS.anthropic;
  private anthropic: ReturnType<typeof createAnthropic>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.anthropic = createAnthropic({ apiKey });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens = 4096, topP, stream = true } = options;

    try {
      if (stream) {
        const response = await streamText({
          model: this.anthropic(model),
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            ...(msg.images && { images: msg.images }),
          })),
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
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            ...(msg.images && { images: msg.images }),
          })),
          temperature,
          maxTokens,
          topP,
        });

        return response.text;
      }
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic API Error: ${error.message || 'Unknown error'}`);
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
}
