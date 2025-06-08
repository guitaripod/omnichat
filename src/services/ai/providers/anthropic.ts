import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
  ChatMessage,
} from '../types';
import { createSSEStream } from '../utils/sse-parser';

export class AnthropicProvider implements ChatProvider {
  name: AIProvider = 'anthropic';
  models = AI_MODELS.anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.apiKey = apiKey;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens = 4096, topP, stream = true } = options;

    const controller = new AbortController();

    // Extract system message if present
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

    const body: any = {
      model,
      messages: this.mapMessages(nonSystemMessages),
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream,
    };

    // Add system message to body if present
    if (systemMessage) {
      body.system = systemMessage.content;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      if (stream) {
        const sseStream = createSSEStream(response, (data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              return parsed.delta.text;
            }
            return null;
          } catch {
            return null;
          }
        });

        return {
          stream: sseStream,
          controller,
        };
      } else {
        const data = await response.json();
        return data.content[0].text;
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Anthropic API key validation failed:', error);
      return false;
    }
  }

  private mapMessages(messages: ChatMessage[]): any[] {
    return messages.map((msg) => {
      if (msg.role === 'tool') {
        // Tool messages are not supported in basic chat, skip them
        return {
          role: 'assistant',
          content: msg.content,
        };
      }

      // Handle images if present
      if (msg.images && msg.images.length > 0 && msg.role === 'user') {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            ...msg.images.map((image) => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg', // Assuming JPEG, may need to detect
                data: image.startsWith('data:') ? image.split(',')[1] : image,
              },
            })),
          ],
        };
      }

      // Simple text message
      return {
        role: msg.role,
        content: msg.content,
      };
    });
  }
}
