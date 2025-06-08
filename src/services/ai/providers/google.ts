import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
} from '../types';

export class GoogleProvider implements ChatProvider {
  name: AIProvider = 'google';
  models = AI_MODELS.google;
  private google: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google API key is required');
    }
    this.google = createGoogleGenerativeAI({ apiKey });
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
          model: this.google(model, modelOptions),
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
      console.error('Google Gemini API Error:', error);
      throw new Error(`Google Gemini API Error: ${error.message || 'Unknown error'}`);
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
}
