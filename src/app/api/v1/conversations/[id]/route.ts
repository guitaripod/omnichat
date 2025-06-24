import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';

export const runtime = 'edge';

// GET /api/v1/conversations/[id] - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const { id } = await params;
      const database = db();
      const userId = req.user!.id;

      // Get conversation
      const conversation = await database
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .get();

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Get message count
      const messageCount = await database
        .select({ count: messages.id })
        .from(messages)
        .where(eq(messages.conversationId, id))
        .all();

      // Get last message
      const lastMessage = await database
        .select({
          id: messages.id,
          role: messages.role,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(desc(messages.createdAt))
        .get();

      return NextResponse.json({
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        isArchived: conversation.isArchived,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: messageCount.results?.length || 0,
        lastMessage: lastMessage || null,
      });
    });
  });
}

// DELETE /api/v1/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const { id } = await params;
      const database = db();
      const userId = req.user!.id;

      // Verify ownership
      const conversation = await database
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .get();

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Delete conversation (messages will cascade delete)
      await database.delete(conversations).where(eq(conversations.id, id));

      return NextResponse.json({ success: true });
    });
  });
}

interface UpdateConversationRequest {
  title?: string;
  isArchived?: boolean;
}

// PATCH /api/v1/conversations/[id] - Update conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const { id } = await params;
      const body = await request.json() as UpdateConversationRequest;
      const { title, isArchived } = body;

      if (!title && isArchived === undefined) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      const database = db();
      const userId = req.user!.id;

      // Verify ownership
      const conversation = await database
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .get();

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Update conversation
      const updates: { updatedAt: Date; title?: string; isArchived?: boolean } = { updatedAt: new Date() };
      if (title !== undefined) updates.title = title;
      if (isArchived !== undefined) updates.isArchived = isArchived;

      await database
        .update(conversations)
        .set(updates)
        .where(eq(conversations.id, id));

      return NextResponse.json({
        id: conversation.id,
        ...updates,
      });
    });
  });
}