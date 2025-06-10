import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  ChatMessage,
  AIModel,
  AI_MODELS,
} from '../types';
import { createSSEStream } from '../utils/sse-parser';

interface XAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | XAIMessageContent[];
}

interface XAIMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface XAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

interface XAIModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export class XAIProvider implements ChatProvider {
  name = 'xai' as const;
  models: AIModel[] = [];
  private apiKey: string;
  private baseUrl = 'https://api.x.ai/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('xAI API key is required');
    }
    this.apiKey = apiKey;
    console.log('[xAI] Provider initialized with API key:', apiKey.substring(0, 10) + '...');
    // Models are now loaded from static JSON at build time
    this.models = AI_MODELS.xai || [];
  }

  getModels(): AIModel[] {
    return this.models;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    console.log('[xAI] Starting chat completion with model:', options.model);
    console.log('[xAI] Stream:', options.stream, 'Web search:', options.webSearch);

    const controller = new AbortController();
    const messages = this.mapMessages(options.messages);

    const requestBody = {
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      top_p: options.topP ?? 1,
      stream: options.stream ?? false,
    };

    // Handle web search if supported by the model
    if (options.webSearch) {
      console.log('[xAI] Web search requested - checking model support');
      const model = this.models.find((m) => m.id === options.model);
      if (model?.supportsWebSearch) {
        // xAI web search implementation would go here when documented
        console.log('[xAI] Model supports web search but implementation pending API documentation');
      } else {
        console.log('[xAI] Model does not support web search, proceeding without it');
      }
    }

    console.log('[xAI] Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      console.log('[xAI] Response status:', response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[xAI] API error response: ${error}`);
        throw new Error(`xAI API error: ${response.status} - ${error}`);
      }

      if (options.stream) {
        console.log('[xAI] Creating SSE stream');
        if (!response.body) {
          throw new Error('No response body available for streaming');
        }

        const stream = createSSEStream(response, (data: string) => {
          try {
            const chunk = JSON.parse(data) as XAIStreamChunk;
            console.log('[xAI] Stream chunk:', JSON.stringify(chunk));
            if (chunk.choices?.[0]?.delta?.content) {
              return chunk.choices[0].delta.content;
            }
          } catch (error) {
            console.error('[xAI] Error parsing stream chunk:', error);
          }
          return null;
        });

        return { stream, controller };
      } else {
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        console.log('[xAI] Non-streaming response received');
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('[xAI] Error in chat completion:', error);
      if (error instanceof Error) {
        console.error('[xAI] Error stack:', error.stack);
      }
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    console.log('[xAI] Validating API key');
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const isValid = response.ok;
      console.log('[xAI] API key validation result:', isValid);

      if (isValid) {
        // Log available models for debugging
        const models: XAIModelResponse = await response.json();
        console.log('[xAI] Available models:', models.data.map((m) => m.id).join(', '));
      }

      return isValid;
    } catch (error) {
      console.error('[xAI] Error validating API key:', error);
      return false;
    }
  }

  private mapMessages(messages: ChatMessage[]): XAIMessage[] {
    console.log('[xAI] Mapping messages, count:', messages.length);

    return messages.map((msg, index) => {
      console.log(
        `[xAI] Mapping message ${index}: role=${msg.role}, hasImages=${!!msg.images?.length}`
      );

      // Handle tool messages by converting to assistant
      if (msg.role === 'tool') {
        console.log('[xAI] Converting tool message to assistant message');
        return {
          role: 'assistant',
          content: msg.content,
        };
      }

      // Handle messages with images
      if (msg.images && msg.images.length > 0) {
        console.log(`[xAI] Processing message with ${msg.images.length} images`);
        const content: XAIMessageContent[] = [{ type: 'text', text: msg.content }];

        for (const image of msg.images) {
          content.push({
            type: 'image_url',
            image_url: { url: image },
          });
        }

        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content,
        };
      }

      // Regular text message
      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      };
    });
  }
}
