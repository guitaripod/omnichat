import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
} from '../types';

export class OpenAIProvider implements ChatProvider {
  name: AIProvider = 'openai';
  models = AI_MODELS.openai;
  private openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.openai = createOpenAI({ apiKey });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens, topP, stream = true } = options;

    try {
      if (stream) {
        const response = await streamText({
          model: this.openai(model),
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
          model: this.openai(model),
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
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = createOpenAI({ apiKey });
      const response = await generateText({
        model: testClient('gpt-3.5-turbo'),
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 5,
      });
      return !!response.text;
    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
      return false;
    }
  }
}
