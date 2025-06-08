import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, type CoreMessage } from 'ai';
import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
  ChatMessage,
} from '../types';

export class GoogleProvider implements ChatProvider {
  name: AIProvider = 'google';
  models = AI_MODELS.google;
  private google: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google API key is required');
    }
    this.google = createGoogleGenerativeAI({
      apiKey,
      fetch: globalThis.fetch?.bind(globalThis),
    });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens, topP, stream = true } = options;

    try {
      const modelOptions: Record<string, unknown> = {};

      // Enable image generation for Gemini 2.0 Flash
      if (model === 'gemini-2.0-flash-exp') {
        modelOptions.responseModalities = ['text', 'image'];
      }

      if (stream) {
        const response = await streamText({
          model: this.google(model, modelOptions),
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
          model: this.google(model, modelOptions),
          messages: this.mapMessages(messages),
          temperature,
          maxTokens,
          topP,
        });

        return response.text;
      }
    } catch (error) {
      console.error('Google Gemini API Error:', error);
      throw new Error(
        `Google Gemini API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = createGoogleGenerativeAI({ apiKey });
      const response = await generateText({
        model: testClient('gemini-1.5-flash'),
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 5,
      });
      return !!response.text;
    } catch (error) {
      console.error('Google API key validation failed:', error);
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
