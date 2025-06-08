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
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google API key is required');
    }
    this.apiKey = apiKey;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const { model, messages, temperature = 0.7, maxTokens, topP, stream = true } = options;

    const controller = new AbortController();
    const generationConfig: any = {
      temperature,
      topP,
      maxOutputTokens: maxTokens,
    };

    const contents = this.mapMessages(messages);
    const body = {
      contents,
      generationConfig,
    };

    try {
      const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:${endpoint}?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${response.status} - ${error}`);
      }

      if (stream) {
        const reader = response.body?.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const streamResponse = new ReadableStream({
          async start(controller) {
            try {
              let buffer = '';
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  controller.close();
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      const parsed = JSON.parse(line);
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
                        );
                      }
                    } catch {
                      // Skip invalid JSON lines
                    }
                  }
                }
              }
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return {
          stream: streamResponse,
          controller,
        };
      } else {
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
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
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Google API key validation failed:', error);
      return false;
    }
  }

  private mapMessages(messages: ChatMessage[]): any[] {
    // Google uses a different format for messages
    const contents: any[] = [];

    // Combine system messages with the first user message
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

    let systemPrompt = '';
    if (systemMessages.length > 0) {
      systemPrompt = systemMessages.map((msg) => msg.content).join('\n') + '\n\n';
    }

    for (let i = 0; i < nonSystemMessages.length; i++) {
      const msg = nonSystemMessages[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';

      // Handle tool messages
      if (msg.role === 'tool') {
        continue; // Skip tool messages for now
      }

      let content = msg.content;

      // Add system prompt to first user message
      if (i === 0 && systemPrompt && msg.role === 'user') {
        content = systemPrompt + content;
      }

      // Handle images if present
      if (msg.images && msg.images.length > 0 && msg.role === 'user') {
        const parts: any[] = [{ text: content }];

        for (const image of msg.images) {
          if (image.startsWith('data:')) {
            const [mimeType, base64Data] = image.substring(5).split(';base64,');
            parts.push({
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            });
          } else {
            // Assume it's already base64
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: image,
              },
            });
          }
        }

        contents.push({ role, parts });
      } else {
        contents.push({
          role,
          parts: [{ text: content }],
        });
      }
    }

    return contents;
  }
}
