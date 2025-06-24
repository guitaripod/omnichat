import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

// GET /api/v1/conversations - List user's conversations
export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const database = db();
      const userId = req.user!.id;

      // Get conversations with last message
      const result = await database
        .select({
          id: conversations.id,
          title: conversations.title,
          model: conversations.model,
          isArchived: conversations.isArchived,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .all();

      const userConversations = result.results || [];

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        userConversations.map(async (conv: any) => {
          const lastMessage = await database
            .select({
              id: messages.id,
              role: messages.role,
              content: messages.content,
              createdAt: messages.createdAt,
            })
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(desc(messages.createdAt))
            .get();

          return {
            ...conv,
            lastMessage: lastMessage || null,
          };
        })
      );

      return NextResponse.json({
        conversations: conversationsWithLastMessage,
      });
    });
  });
}

interface CreateConversationRequest {
  title: string;
  model?: string;
}

// POST /api/v1/conversations - Create new conversation
export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const body = await request.json() as CreateConversationRequest;
      const { title, model = 'gpt-4o-mini' } = body;

      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      const database = db();
      const userId = req.user!.id;
      const conversationId = nanoid();

      await database.insert(conversations).values({
        id: conversationId,
        userId,
        title,
        model,
      });

      return NextResponse.json({
        id: conversationId,
        title,
        model,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });
}
