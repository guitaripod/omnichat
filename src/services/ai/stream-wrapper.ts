import { StreamingTokenTracker } from '@/lib/token-counting';
import { trackApiUsage } from '@/lib/usage-tracking';
import { getD1Database } from '@/lib/db/get-db';

interface StreamWrapperOptions {
  originalStream: ReadableStream<Uint8Array>;
  userId: string;
  conversationId: string;
  messageId: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  isOllamaModel: boolean;
}

/**
 * Wraps a streaming response to track token usage
 */
export function createTokenTrackingStream({
  originalStream,
  userId,
  conversationId,
  messageId,
  model,
  messages,
  isOllamaModel,
}: StreamWrapperOptions): ReadableStream<Uint8Array> {
  console.log('[Stream Wrapper] Creating token tracking stream for:', {
    userId,
    conversationId,
    messageId,
    model,
    isOllamaModel,
    messageCount: messages.length,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const tokenTracker = new StreamingTokenTracker(messages, model);
  let isDone = false;

  return new ReadableStream({
    async start(controller) {
      const reader = originalStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Stream is done, track usage and send final data
            if (!isDone && !isOllamaModel) {
              isDone = true;
              try {
                const tokenCount = tokenTracker.getTokenCount();
                console.log('[Stream Wrapper] Final token count:', tokenCount);

                // Get database instance
                const db = getD1Database();
                console.log('[Stream Wrapper] Database instance:', !!db);

                if (db) {
                  // Track usage in database
                  await trackApiUsage({
                    userId,
                    conversationId,
                    messageId,
                    model,
                    inputTokens: tokenCount.inputTokens,
                    outputTokens: tokenCount.outputTokens,
                    cached: false,
                  });

                  console.log('[Stream Wrapper] Usage tracked successfully');
                } else {
                  console.error('[Stream Wrapper] No database instance available');
                }

                // Send usage data to client
                const usageData = {
                  type: 'usage',
                  usage: tokenCount,
                };
                const usageChunk = `data: ${JSON.stringify(usageData)}\n\n`;
                controller.enqueue(encoder.encode(usageChunk));
                console.log('[Stream Wrapper] Sent usage data to client:', usageData);
              } catch (error) {
                console.error('[Stream Wrapper] Failed to track usage:', error);
              }
            }

            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          // Pass through the original chunk
          controller.enqueue(value);

          // Extract content for token tracking
          try {
            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.content || parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      tokenTracker.addChunk(content);
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          } catch {
            // Ignore decode errors
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
