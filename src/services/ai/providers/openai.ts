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

    // Model-specific configurations with size validation
    if (model === 'gpt-image-1') {
      body.size = options?.size || 'auto';
      body.quality = options?.quality || 'auto';
      if (options?.background) body.background = options.background;
      // Don't set output_format to force URL response instead of base64
      // if (options?.outputFormat) body.output_format = options.outputFormat;
      // if (options?.outputCompression !== undefined)
      //   body.output_compression = options.outputCompression;
    } else if (model === 'dall-e-3') {
      // Validate size for DALL-E 3
      const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
      const requestedSize = options?.size || '1024x1024';
      body.size = validSizes.includes(requestedSize) ? requestedSize : '1024x1024';
      body.quality = options?.quality || 'standard';
      body.style = options?.style || 'vivid';
      body.response_format = 'url'; // Always use URL to avoid base64 size issues
    } else if (model === 'dall-e-2') {
      // Validate size for DALL-E 2
      const validSizes = ['256x256', '512x512', '1024x1024'];
      const requestedSize = options?.size || '1024x1024';
      body.size = validSizes.includes(requestedSize) ? requestedSize : '1024x1024';
      body.response_format = 'url';
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
        // For gpt-image-1 with base64, we need to handle it differently
        const base64Data = imageData.b64_json;
        console.log('[OpenAI] Base64 image size:', base64Data.length, 'characters');

        // For now, use data URL directly - we'll handle upload on the client side
        imageContent = `![Generated Image](data:image/png;base64,${base64Data})`;
      }

      // For streaming, we need to create a stream that sends the image
      const encoder = new TextEncoder();

      // Create a stream that sends the image content
      const stream = new ReadableStream({
        start(controller) {
          try {
            console.log('[OpenAI] Sending image response, type:', imageData.url ? 'URL' : 'base64');

            // Send the image content as a single message
            const message = {
              choices: [
                {
                  delta: { content: imageContent },
                  index: 0,
                },
              ],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));

            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[OpenAI] Error sending image:', error);
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
