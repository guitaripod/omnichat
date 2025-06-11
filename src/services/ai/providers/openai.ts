import {
  ChatProvider,
  ChatCompletionOptions,
  StreamResponse,
  AIProvider,
  AI_MODELS,
  ChatMessage,
} from '../types';
import { createSSEStream } from '../utils/sse-parser';

export class OpenAIProvider implements ChatProvider {
  name: AIProvider = 'openai';
  models = AI_MODELS.openai;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<StreamResponse | string> {
    const {
      model,
      messages,
      temperature = 0.7,
      maxTokens,
      topP,
      stream = true,
      webSearch = false,
      imageGeneration = false,
      imageGenerationOptions,
    } = options;

    console.log(`[OpenAI] Starting chat completion with model: ${model}`);
    console.log(
      `[OpenAI] Options: temperature=${temperature}, maxTokens=${maxTokens}, stream=${stream}`
    );
    console.log(`[OpenAI] Messages count: ${messages.length}`);

    // Check if this is an image generation model
    const isImageGenerationModel = ['gpt-image-1', 'dall-e-3', 'dall-e-2'].includes(model);

    if (isImageGenerationModel || imageGeneration) {
      return this.imageGeneration(model, messages, imageGenerationOptions);
    }

    const controller = new AbortController();
    const body: Record<string, unknown> = {
      model,
      messages: this.mapMessages(messages),
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream,
    };

    // OpenAI web search is not yet supported through their standard API
    // The web_search_preview tool type is only available in specific endpoints
    if (webSearch) {
      console.log('[OpenAI] Web search requested but not supported through standard API');
    }

    console.log('[OpenAI] Request body:', JSON.stringify(body, null, 2));

    try {
      console.log('[OpenAI] Sending request to OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      console.log(`[OpenAI] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[OpenAI] API error response: ${error}`);
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      if (stream) {
        console.log('[OpenAI] Creating SSE stream...');
        const sseStream = createSSEStream(response, (data) => {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              console.log(`[OpenAI] Streaming chunk: ${content.substring(0, 50)}...`);
            }
            return content || null;
          } catch (e) {
            console.error('[OpenAI] Error parsing SSE data:', data, e);
            return null;
          }
        });

        console.log('[OpenAI] Stream created successfully');
        return {
          stream: sseStream,
          controller,
        };
      } else {
        const data = await response.json();
        console.log('[OpenAI] Non-streaming response received:', JSON.stringify(data, null, 2));
        return (data as any).choices[0].message.content;
      }
    } catch (error) {
      console.error('[OpenAI] Error in chatCompletion:', error);
      console.error('[OpenAI] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw new Error(
        `OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('OpenAI API key validation failed:', error);
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

  private async imageGeneration(
    model: string,
    messages: ChatMessage[],
    options?: {
      size?: string;
      quality?: string;
      style?: string;
      n?: number;
      background?: string;
      outputFormat?: string;
      outputCompression?: number;
    }
  ): Promise<StreamResponse | string> {
    console.log(`[OpenAI] Starting image generation with model: ${model}`);

    // Extract the prompt from the last user message
    const lastUserMessage = messages.findLast((msg) => msg.role === 'user');
    if (!lastUserMessage) {
      throw new Error('No user message found for image generation');
    }

    const prompt = lastUserMessage.content;
    console.log(`[OpenAI] Image generation prompt: ${prompt}`);

    // Build request body based on model
    const body: Record<string, unknown> = {
      model: model === 'gpt-image-1' ? 'gpt-image-1' : model,
      prompt,
      n: options?.n || 1,
    };

    // Model-specific configurations
    if (model === 'gpt-image-1') {
      body.size = options?.size || 'auto';
      body.quality = options?.quality || 'auto';
      if (options?.background) body.background = options.background;
      if (options?.outputFormat) body.output_format = options.outputFormat;
      if (options?.outputCompression !== undefined)
        body.output_compression = options.outputCompression;
    } else if (model === 'dall-e-3') {
      body.size = options?.size || '1024x1024';
      body.quality = options?.quality || 'standard';
      body.style = options?.style || 'vivid';
      body.response_format = 'url'; // Always use URL to avoid base64 size issues
    } else if (model === 'dall-e-2') {
      body.size = options?.size || '1024x1024';
      body.response_format = 'url';
    }

    // Force URL format for all models to avoid base64 streaming issues
    if (model === 'gpt-image-1') {
      // GPT Image doesn't support response_format, but returns URLs by default
      delete body.output_format; // Remove base64 output format
      delete body.output_compression;
    }

    console.log('[OpenAI] Image generation request body:', JSON.stringify(body, null, 2));

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[OpenAI] Image generation error: ${error}`);
        throw new Error(`OpenAI Image API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as { data: Array<{ b64_json?: string; url?: string }> };
      console.log('[OpenAI] Image generation response received');

      // Create a response in assistant format with the image
      const imageData = data.data[0];
      let imageContent = '';

      if (imageData.url) {
        // Use the URL directly
        imageContent = `![Generated Image](${imageData.url})`;
      } else if (imageData.b64_json) {
        // If we still get base64, use it but chunk it properly
        imageContent = `![Generated Image](data:image/png;base64,${imageData.b64_json})`;
      }

      // For streaming, we need to create a stream that sends the image
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            console.log('[OpenAI] Starting image stream, content length:', imageContent.length);
            console.log('[OpenAI] Image URL preview:', imageContent.substring(0, 100));

            // For large content (base64 images), chunk it to avoid JSON parsing issues
            const CHUNK_SIZE = 1000; // Send in 1KB chunks to avoid SSE parsing issues

            if (imageContent.length > CHUNK_SIZE) {
              // Send image content in chunks
              for (let i = 0; i < imageContent.length; i += CHUNK_SIZE) {
                const chunk = imageContent.slice(i, i + CHUNK_SIZE);
                const chunkData = encoder.encode(
                  `data: ${JSON.stringify({
                    choices: [
                      {
                        delta: { content: chunk },
                        index: 0,
                      },
                    ],
                  })}\n\n`
                );
                controller.enqueue(chunkData);

                // Small delay to avoid overwhelming the stream
                await new Promise((resolve) => setTimeout(resolve, 10));
              }
            } else {
              // For small content (URLs), send in one chunk
              const imageChunk = encoder.encode(
                `data: ${JSON.stringify({
                  choices: [
                    {
                      delta: { content: imageContent },
                      index: 0,
                    },
                  ],
                })}\n\n`
              );
              controller.enqueue(imageChunk);
            }

            // Send the done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[OpenAI] Error in image stream:', error);
            controller.error(error);
          }
        },
      });

      return {
        stream,
        controller: new AbortController(),
      };
    } catch (error) {
      console.error('[OpenAI] Error in imageGeneration:', error);

      // Create an error stream response
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errorChunk = encoder.encode(
            `data: ${JSON.stringify({
              choices: [
                {
                  delta: {
                    content: `⚠️ Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  },
                  index: 0,
                },
              ],
            })}\n\n`
          );
          controller.enqueue(errorChunk);
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return {
        stream: errorStream,
        controller: new AbortController(),
      };
    }
  }
}
