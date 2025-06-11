import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import { getUserByClerkId, updateConversation, deleteConversation } from '@/lib/db/queries';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

// PATCH /api/conversations/[id] - Update conversation
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser && !isDevMode()) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!clerkUser && isDevMode()) {
      const devUser = await getDevUser();
      if (!devUser) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const body = (await req.json()) as { title?: string; isArchived?: boolean };
    const { title, isArchived } = body;

    const db = getDb(process.env.DB as unknown as D1Database);

    // Update conversation
    const conversation = await updateConversation(db, params.id, {
      ...(title !== undefined && { title }),
      ...(isArchived !== undefined && { isArchived }),
    });

    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // Delete conversation (this will cascade delete messages)
    const deleted = await deleteConversation(db, params.id);

    if (!deleted) {
      return new Response('Conversation not found', { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
