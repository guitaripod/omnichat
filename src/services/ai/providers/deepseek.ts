import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
  ChatMessage,
} from '../types';
import { createSSEStream } from '../utils/sse-parser';

export class DeepSeekProvider implements ChatProvider {
  name: AIProvider = 'deepseek';
  models = AI_MODELS.deepseek;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('DeepSeek API key is required');
    }
    this.apiKey = apiKey;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const {
      model,
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      topP,
      stream = true,
      webSearch = false,
    } = options;

    console.log(`[DeepSeek] Starting chat completion with model: ${model}`);
    console.log(
      `[DeepSeek] Options: temperature=${temperature}, maxTokens=${maxTokens}, stream=${stream}`
    );
    console.log(`[DeepSeek] Messages count: ${messages.length}`);

    const controller = new AbortController();
    const body: any = {
      model,
      messages: this.mapMessages(messages),
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream,
    };

    // DeepSeek doesn't support web search through their API yet
    if (webSearch) {
      console.log('[DeepSeek] Web search requested but not supported');
    }

    console.log('[DeepSeek] Request body:', JSON.stringify(body, null, 2));

    try {
      console.log('[DeepSeek] Sending request to DeepSeek API...');
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      console.log(`[DeepSeek] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[DeepSeek] API error response: ${error}`);
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }

      if (stream) {
        console.log('[DeepSeek] Creating SSE stream...');
        const sseStream = createSSEStream(response, (data) => {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              console.log(`[DeepSeek] Streaming chunk: ${content.substring(0, 50)}...`);
            }
            return content || null;
          } catch (e) {
            console.error('[DeepSeek] Error parsing SSE data:', data, e);
            return null;
          }
        });

        console.log('[DeepSeek] Stream created successfully');
        return {
          stream: sseStream,
          controller,
        };
      } else {
        const data = await response.json();
        console.log('[DeepSeek] Non-streaming response received:', JSON.stringify(data, null, 2));
        return (data as any).choices[0].message.content;
      }
    } catch (error) {
      console.error('[DeepSeek] Error in chatCompletion:', error);
      console.error('[DeepSeek] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw new Error(
        `DeepSeek API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('DeepSeek API key validation failed:', error);
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
              type: 'image_url',
              image_url: {
                url: image,
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
