import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/client';
import {
  getUserByClerkId,
  createUser,
  getUserConversations,
  createConversation,
} from '@/lib/db/queries';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

// GET /api/conversations - Get user's conversations
export async function GET(_req: NextRequest) {
  try {
    let userId: string;
    let userEmail: string = '';
    let userName: string = '';
    let userImageUrl: string | null = null;

    if (isDevMode()) {
      const devUser = await getDevUser();
      if (devUser) {
        userId = devUser.id;
        userEmail = devUser.primaryEmailAddress?.emailAddress || '';
        userName = devUser.fullName || devUser.username || '';
        userImageUrl = devUser.imageUrl;
      } else {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      const clerkUser = await currentUser();
      if (clerkUser) {
        userId = clerkUser.id;
        userEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
        userName = clerkUser.fullName || clerkUser.username || '';
        userImageUrl = clerkUser.imageUrl;
      } else {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Get database from context (in production)
    // For local development, we'll need to mock this
    const db = getDb(process.env.DB as unknown as D1Database);

    // Get or create user
    let dbUser = await getUserByClerkId(db, userId);
    if (!dbUser) {
      dbUser = await createUser(db, {
        clerkId: userId,
        email: userEmail,
        name: userName,
        imageUrl: userImageUrl,
      });
    }

    // Get conversations
    const conversations = await getUserConversations(db, dbUser.id);

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      const devUser = await getDevUser();
      if (devUser) {
        userId = devUser.id;
      } else {
        return new Response('Unauthorized', { status: 401 });
      }
    } else {
      const clerkUser = await currentUser();
      if (clerkUser) {
        userId = clerkUser.id;
      } else {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const body = (await req.json()) as { title: string; model: string };
    const { title, model } = body;

    if (!title || !model) {
      return new Response('Missing required fields', { status: 400 });
    }

    const db = getDb(process.env.DB as unknown as D1Database);

    // Get user
    let dbUser = await getUserByClerkId(db, userId);
    if (!dbUser) {
      // Create user if not exists - for dev mode
      const devUser = await getDevUser();
      dbUser = await createUser(db, {
        clerkId: userId,
        email: devUser?.primaryEmailAddress?.emailAddress || '',
        name: devUser?.fullName || devUser?.username || '',
        imageUrl: devUser?.imageUrl || undefined,
      });
    }

    // Create conversation
    const conversation = await createConversation(db, {
      userId: dbUser.id,
      title,
      model,
    });

    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
