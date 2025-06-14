import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import { getUserByClerkId, deleteConversation } from '@/lib/db/queries';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;

    const clerkUser = await currentUser();
    let userId: string;

    if (clerkUser) {
      userId = clerkUser.id;
    } else if (isDevMode()) {
      const devUser = await getDevUser();
      if (devUser) {
        userId = devUser.id;
      } else {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = getDb(process.env.DB as unknown as D1Database);

    // Get user to verify ownership
    const dbUser = await getUserByClerkId(db, userId);
    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    // Delete the conversation (this will cascade delete messages)
    const deleted = await deleteConversation(db, conversationId, dbUser.id);

    if (!deleted) {
      return new Response('Conversation not found or unauthorized', { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
