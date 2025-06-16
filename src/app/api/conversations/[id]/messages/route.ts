import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import { getConversationMessages, createMessage } from '@/lib/db/queries';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

// GET /api/conversations/[id]/messages - Get messages for a conversation
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isDevMode()) {
      const devUser = await getDevUser();
      if (!devUser) {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const { id: conversationId } = await params;
    const db = getDb(process.env.DB as unknown as D1Database);

    // Verify user owns this conversation by checking if messages exist
    // (In production, you'd want to join with conversations table to verify ownership)
    const messages = await getConversationMessages(db, conversationId);

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages - Create a new message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isDevMode()) {
      const devUser = await getDevUser();
      if (!devUser) {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const { id: conversationId } = await params;
    const body = (await req.json()) as {
      role: string;
      content: string;
      model?: string;
      parentId?: string;
    };
    const { role, content, model, parentId } = body;

    if (!role || !content) {
      return new Response('Missing required fields', { status: 400 });
    }

    const db = getDb(process.env.DB as unknown as D1Database);

    // Create message
    const message = await createMessage(db, {
      conversationId,
      role: role as 'user' | 'assistant' | 'system',
      content,
      model,
      parentId,
    });

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
