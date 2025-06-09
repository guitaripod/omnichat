import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import { getUserByClerkId } from '@/lib/db/queries';
import { conversations, messages } from '@/lib/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const db = getDb(process.env.DB as unknown as D1Database);

    // Get user from database
    const dbUser = await getUserByClerkId(db, user.id);
    if (!dbUser) {
      return NextResponse.json({ results: [] });
    }

    // Search pattern (case-insensitive)
    const searchPattern = `%${query}%`;

    // Search conversations by title
    const conversationResults = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, dbUser.id), like(conversations.title, searchPattern)))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);

    // Search messages by content
    const messageResults = await db
      .select({
        message: messages,
        conversation: conversations,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(conversations.userId, dbUser.id), like(messages.content, searchPattern)))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // Format results
    const results = {
      conversations: conversationResults.map((conv) => ({
        id: conv.id,
        title: conv.title,
        updatedAt: conv.updatedAt,
        type: 'conversation' as const,
      })),
      messages: messageResults.map(({ message, conversation }) => ({
        id: message.id,
        conversationId: conversation.id,
        conversationTitle: conversation.title,
        content: message.content,
        role: message.role,
        createdAt: message.createdAt,
        type: 'message' as const,
      })),
    };

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
