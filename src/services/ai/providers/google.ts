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

    console.log(`[Google] Starting chat completion with model: ${model}`);
    console.log(
      `[Google] Options: temperature=${temperature}, maxTokens=${maxTokens}, stream=${stream}`
    );
    console.log(`[Google] Messages count: ${messages.length}`);

    const controller = new AbortController();
    const generationConfig: any = {
      temperature,
      topP,
      maxOutputTokens: maxTokens,
    };

    const contents = this.mapMessages(messages);
    console.log('[Google] Mapped contents:', JSON.stringify(contents, null, 2));

    const body = {
      contents,
      generationConfig,
    };

    console.log('[Google] Request body:', JSON.stringify(body, null, 2));

    try {
      const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
      const altParam = stream ? '&alt=sse' : '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${this.apiKey}${altParam}`;
      console.log(`[Google] Request URL: ${url.replace(this.apiKey, 'REDACTED')}`);

      console.log('[Google] Sending request to Google AI API...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      console.log(`[Google] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Google] API error response: ${error}`);
        throw new Error(`Google API error: ${response.status} - ${error}`);
      }

      if (stream) {
        const reader = response.body?.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        console.log('[Google] Starting to read streaming response...');

        const streamResponse = new ReadableStream({
          async start(controller) {
            try {
              let buffer = '';
              let chunkCount = 0;

              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  console.log('[Google] Stream reading complete');
                  controller.close();
                  break;
                }

                chunkCount++;
                buffer += decoder.decode(value, { stream: true });
                console.log(`[Google] Chunk ${chunkCount}, buffer size: ${buffer.length}`);
                console.log('[Google] Raw buffer chunk:', buffer.substring(0, 200));

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) continue;

                  // Handle SSE format
                  if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);

                    // Skip SSE control messages
                    if (data === '[DONE]') {
                      console.log('[Google] Received end of stream marker');
                      continue;
                    }

                    try {
                      const parsed = JSON.parse(data);
                      console.log(
                        '[Google] Parsed SSE data:',
                        JSON.stringify(parsed, null, 2).substring(0, 500)
                      );

                      // Extract text from Gemini streaming response
                      let text = '';

                      // Standard Gemini response structure
                      if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                        text = parsed.candidates[0].content.parts[0].text;
                      }

                      if (text) {
                        console.log(`[Google] Found text: "${text.substring(0, 50)}..."`);
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
                        );
                      } else {
                        console.log('[Google] No text found in SSE data');
                        if (parsed.candidates?.[0]) {
                          console.log(
                            '[Google] Candidate structure:',
                            JSON.stringify(parsed.candidates[0])
                          );
                        }
                      }
                    } catch (e) {
                      console.error(
                        '[Google] Error parsing SSE data:',
                        data,
                        'Error:',
                        e instanceof Error ? e.message : String(e)
                      );
                    }
                  } else {
                    // Log non-SSE lines for debugging
                    console.log('[Google] Non-SSE line:', trimmedLine);
                  }
                }
              }
            } catch (error) {
              controller.error(error);
            }
          },
        });

        console.log('[Google] Stream created successfully');
        return {
          stream: streamResponse,
          controller,
        };
      } else {
        const data = await response.json();
        console.log('[Google] Non-streaming response received:', JSON.stringify(data, null, 2));
        return data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error('[Google] Error in chatCompletion:', error);
      console.error('[Google] Error stack:', error instanceof Error ? error.stack : 'No stack');
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
