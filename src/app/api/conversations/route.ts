import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import {
  getUserByClerkId,
  createUser,
  getUserConversations,
  createConversation,
  updateConversation,
} from '@/lib/db/queries';

export const runtime = 'edge';

// GET /api/conversations - Get user's conversations
export async function GET(_req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get database from context (in production)
    // For local development, we'll need to mock this
    const db = getDb(process.env.DB as unknown as D1Database);

    // Get or create user
    let dbUser = await getUserByClerkId(db, user.id);
    if (!dbUser) {
      dbUser = await createUser(db, {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || user.username || '',
        imageUrl: user.imageUrl,
      });
    }

    // Get conversations
    const conversations = await getUserConversations(db, dbUser.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { title, model } = body;

    if (!title || !model) {
      return new Response('Missing required fields', { status: 400 });
    }

    const db = getDb(process.env.DB as unknown as D1Database);

    // Get user
    let dbUser = await getUserByClerkId(db, user.id);
    if (!dbUser) {
      dbUser = await createUser(db, {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || user.username || '',
        imageUrl: user.imageUrl,
      });
    }

    // Create conversation
    const conversation = await createConversation(db, {
      userId: dbUser.id,
      title,
      model,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] - Update conversation
export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return new Response('Missing conversation ID', { status: 400 });
    }

    const body = await req.json();
    const { title, isArchived } = body;

    const db = getDb(process.env.DB as unknown as D1Database);

    // Update conversation
    const conversation = await updateConversation(db, id, {
      ...(title !== undefined && { title }),
      ...(isArchived !== undefined && { isArchived }),
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
