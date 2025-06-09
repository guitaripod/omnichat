import {
  ChatProvider,
  ChatMessage,
  StreamChunk,
  ChatCompletionOptions,
  StreamResponse,
  AI_MODELS,
} from '../types';

export class OllamaProvider implements ChatProvider {
  name = 'ollama' as const;
  models = AI_MODELS.ollama;
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse> {
    const stream = this.createStream(options);
    return { stream };
  }

  async validateApiKey(): Promise<boolean> {
    // Ollama doesn't use API keys, just test connection
    return this.testConnection();
  }

  private createStream(options: ChatCompletionOptions): ReadableStream {
    const { messages, model } = options;
    const encoder = new TextEncoder();

    return new ReadableStream({
      start: async (controller) => {
        try {
          const generator = this.streamChat(messages, model);

          for await (const chunk of generator) {
            if (chunk.type === 'content' && chunk.content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: chunk.content } }] })}\n\n`
                )
              );
            } else if (chunk.type === 'error') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: chunk.error?.message })}\n\n`)
              );
              controller.close();
              return;
            } else if (chunk.type === 'done') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });
  }

  private async *streamChat(messages: ChatMessage[], model: string): AsyncGenerator<StreamChunk> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);

              if (data.message?.content) {
                yield {
                  type: 'content',
                  content: data.message.content,
                };
              }

              if (data.done) {
                yield { type: 'done' };
              }
            } catch (e) {
              console.error('Failed to parse Ollama response:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        yield { type: 'done' };
      } else {
        yield {
          type: 'error',
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
      }
    }
  }

  abort(): void {
    this.abortController?.abort();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }
}
