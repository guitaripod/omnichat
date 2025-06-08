import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, type CoreMessage } from 'ai';
import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
  ChatMessage,
} from '../types';

export class OpenAIProvider implements ChatProvider {
  name: AIProvider = 'openai';
  models = AI_MODELS.openai;
  private openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.openai = createOpenAI({
      apiKey,
      fetch: globalThis.fetch?.bind(globalThis),
    });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens, topP, stream = true } = options;

    try {
      if (stream) {
        console.log('Creating streamText request...');

        const response = await streamText({
          model: this.openai(model),
          messages: this.mapMessages(messages),
          temperature,
          maxTokens,
          topP,
        });

        console.log('Got stream response, converting to text stream...');
        // Use toTextStreamResponse which is more compatible with edge runtime
        const streamResponse = response.toTextStreamResponse({
          headers: {
            'Content-Type': 'text/event-stream',
            'Content-Encoding': 'identity',
          },
        });

        return {
          stream: streamResponse.body!,
          controller: new AbortController(), // Create fresh controller if needed
        };
      } else {
        console.log('Creating generateText request...');
        const response = await generateText({
          model: this.openai(model),
          messages: this.mapMessages(messages),
          temperature,
          maxTokens,
          topP,
        });

        console.log('Got text response:', response.text);
        return response.text;
      }
    } catch (error) {
      console.error('OpenAI API Error Details:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
