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
  console.log('[Stream Wrapper] ==================== START ====================');
  console.log('[Stream Wrapper] Creating token tracking stream with:', {
    userId,
    conversationId,
    messageId,
    model,
    isOllamaModel,
    messageCount: messages.length,
    timestamp: new Date().toISOString(),
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
            console.log('[Stream Wrapper] Stream completed, processing final data...');

            // Stream is done, track usage and send final data
            if (!isDone && !isOllamaModel) {
              isDone = true;
              console.log('[Stream Wrapper] Processing battery usage tracking...');

              try {
                const tokenCount = tokenTracker.getTokenCount();
                console.log('[Stream Wrapper] Final token count:', {
                  inputTokens: tokenCount.inputTokens,
                  outputTokens: tokenCount.outputTokens,
                  totalTokens: tokenCount.totalTokens,
                  model,
                });

                // Get database instance
                console.log('[Stream Wrapper] Getting database instance...');
                const db = getD1Database();
                console.log('[Stream Wrapper] Database instance obtained:', !!db);

                let trackingResult = null;
                if (db) {
                  console.log('[Stream Wrapper] Calling trackApiUsage...');
                  // Track usage in database
                  trackingResult = await trackApiUsage({
                    userId,
                    conversationId,
                    messageId,
                    model,
                    inputTokens: tokenCount.inputTokens,
                    outputTokens: tokenCount.outputTokens,
                    cached: false,
                  });

                  console.log('[Stream Wrapper] ✓ Usage tracked successfully:', trackingResult);
                } else {
                  console.error('[Stream Wrapper] ERROR: No database instance available');
                }

                // Send usage data to client with battery information
                const usageData = {
                  type: 'usage',
                  usage: tokenCount,
                  battery: trackingResult
                    ? {
                        batteryUsed: trackingResult.batteryUsed,
                        newBalance: trackingResult.newBalance,
                      }
                    : undefined,
                };
                const usageChunk = `data: ${JSON.stringify(usageData)}\n\n`;
                controller.enqueue(encoder.encode(usageChunk));
                console.log('[Stream Wrapper] Sent usage data to client:', usageData);
              } catch (error) {
                console.error('[Stream Wrapper] ERROR: Failed to track usage');
                console.error('[Stream Wrapper] Error details:', error);
                console.error(
                  '[Stream Wrapper] Error stack:',
                  error instanceof Error ? error.stack : 'No stack trace'
                );
              }
            } else if (isOllamaModel) {
              console.log('[Stream Wrapper] Skipping battery tracking for Ollama model');
            }

            // Send done signal
            console.log('[Stream Wrapper] Sending [DONE] signal');
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            console.log('[Stream Wrapper] ==================== END ====================');
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
                      // Log every 10th chunk to avoid spam
                      if (Math.random() < 0.1) {
                        const currentUsage = tokenTracker.getCurrentUsage();
                        console.log('[Stream Wrapper] Token tracking progress:', {
                          outputTokensSoFar: currentUsage.outputTokens,
                          totalTokensSoFar: currentUsage.totalTokens,
                        });
                      }
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
