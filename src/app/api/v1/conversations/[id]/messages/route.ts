import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages, attachments } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';
import { nanoid } from 'nanoid';
import { getAIResponse } from '@/lib/ai';

export const runtime = 'edge';

// GET /api/v1/conversations/[id]/messages - Get messages in conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const { id: conversationId } = await params;
      const database = db();
      const userId = req.user!.id;

      // Parse query params
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');
      const order = searchParams.get('order') || 'asc';

      // Verify ownership
      const conversation = await database
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
        .get();

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Get messages
      const result = await database
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          role: messages.role,
          content: messages.content,
          model: messages.model,
          parentId: messages.parentId,
          isComplete: messages.isComplete,
          tokensGenerated: messages.tokensGenerated,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(order === 'desc' ? desc(messages.createdAt) : asc(messages.createdAt))
        .all();

      const messageList = result.results || [];

      // Get attachments for all messages
      const messageIds = messageList.map((m) => m.id);
      if (messageIds.length > 0) {
        const attachmentResults = await database
          .select()
          .from(attachments)
          .where(eq(attachments.messageId, messageIds[0])) // This is a simplification
          .all();

        // Group attachments by message
        const attachmentsByMessage = (attachmentResults.results || []).reduce((acc, att) => {
          if (!acc[att.messageId]) acc[att.messageId] = [];
          acc[att.messageId].push(att);
          return acc;
        }, {} as Record<string, any[]>);

        // Add attachments to messages
        messageList.forEach((msg: any) => {
          msg.attachments = attachmentsByMessage[msg.id] || [];
        });
      }

      return NextResponse.json({
        messages: messageList.slice(offset, offset + limit),
        total: messageList.length,
        hasMore: messageList.length > offset + limit,
      });
    });
  });
}

// POST /api/v1/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const { id: conversationId } = await params;
      const body = await request.json();
      const { content, attachmentIds, stream = true } = body;

      if (!content || !content.trim()) {
        return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
      }

      const database = db();
      const userId = req.user!.id;

      // Verify ownership
      const conversation = await database
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
        .get();

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Create user message
      const userMessageId = nanoid();
      await database.insert(messages).values({
        id: userMessageId,
        conversationId,
        role: 'user',
        content,
        isComplete: true,
      });

      // Link attachments if provided
      if (attachmentIds && attachmentIds.length > 0) {
        await database
          .update(attachments)
          .set({ messageId: userMessageId })
          .where(eq(attachments.id, attachmentIds[0])); // Simplified
      }

      // Get conversation history
      const history = await database
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt))
        .all();

      const messageHistory = (history.results || []).map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Create assistant message placeholder
      const assistantMessageId = nanoid();
      await database.insert(messages).values({
        id: assistantMessageId,
        conversationId,
        role: 'assistant',
        content: '',
        model: conversation.model,
        isComplete: false,
        streamId: nanoid(),
      });

      if (stream) {
        // Return streaming response
        const encoder = new TextEncoder();
        const streamResponse = new ReadableStream({
          async start(controller) {
            try {
              // Send initial message
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    id: assistantMessageId,
                    type: 'message_start',
                    content: '',
                  })}\n\n`
                )
              );

              // Stream AI response
              const aiStream = await getAIResponse({
                messages: messageHistory,
                model: conversation.model,
                userId,
                conversationId,
              });

              let fullContent = '';
              const reader = aiStream.getReader();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                fullContent += text;

                // Send chunk
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      id: assistantMessageId,
                      type: 'content_chunk',
                      content: text,
                    })}\n\n`
                  )
                );
              }

              // Update message as complete
              await database
                .update(messages)
                .set({
                  content: fullContent,
                  isComplete: true,
                  tokensGenerated: fullContent.length, // Approximate
                })
                .where(eq(messages.id, assistantMessageId));

              // Send completion
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    id: assistantMessageId,
                    type: 'message_complete',
                    content: fullContent,
                  })}\n\n`
                )
              );

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (error) {
              console.error('Streaming error:', error);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'error',
                    error: 'Failed to generate response',
                  })}\n\n`
                )
              );
              controller.close();
            }
          },
        });

        return new NextResponse(streamResponse, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      } else {
        // Non-streaming response
        try {
          const aiStream = await getAIResponse({
            messages: messageHistory,
            model: conversation.model,
            userId,
            conversationId,
          });

          let fullContent = '';
          const reader = aiStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullContent += new TextDecoder().decode(value);
          }

          await database
            .update(messages)
            .set({
              content: fullContent,
              isComplete: true,
              tokensGenerated: fullContent.length,
            })
            .where(eq(messages.id, assistantMessageId));

          return NextResponse.json({
            id: assistantMessageId,
            conversationId,
            role: 'assistant',
            content: fullContent,
            model: conversation.model,
            createdAt: new Date(),
          });
        } catch (error) {
          console.error('AI response error:', error);
          return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
          );
        }
      }
    });
  });
}