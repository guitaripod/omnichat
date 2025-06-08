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

    console.log(`[Anthropic] Starting chat completion with model: ${model}`);
    console.log(
      `[Anthropic] Options: temperature=${temperature}, maxTokens=${maxTokens}, stream=${stream}`
    );
    console.log(`[Anthropic] Messages count: ${messages.length}`);

    const controller = new AbortController();

    // Extract system message if present
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

    if (systemMessage) {
      console.log('[Anthropic] System message found, will be added to request body');
    }

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

    console.log('[Anthropic] Request body:', JSON.stringify(body, null, 2));

    try {
      console.log('[Anthropic] Sending request to Anthropic API...');
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

      console.log(`[Anthropic] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Anthropic] API error response: ${error}`);
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      if (stream) {
        console.log('[Anthropic] Creating SSE stream...');
        const sseStream = createSSEStream(response, (data) => {
          try {
            const parsed = JSON.parse(data);
            console.log(`[Anthropic] SSE event type: ${parsed.type}`);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              console.log(`[Anthropic] Streaming chunk: ${parsed.delta.text.substring(0, 50)}...`);
              return parsed.delta.text;
            }
            return null;
          } catch (e) {
            console.error('[Anthropic] Error parsing SSE data:', data, e);
            return null;
          }
        });

        console.log('[Anthropic] Stream created successfully');
        return {
          stream: sseStream,
          controller,
        };
      } else {
        const data = await response.json();
        console.log('[Anthropic] Non-streaming response received:', JSON.stringify(data, null, 2));
        return data.content[0].text;
      }
    } catch (error) {
      console.error('[Anthropic] Error in chatCompletion:', error);
      console.error('[Anthropic] Error stack:', error instanceof Error ? error.stack : 'No stack');
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
