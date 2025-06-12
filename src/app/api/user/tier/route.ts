import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getD1Database } from '@/lib/db/get-db';
import { getUserByClerkId } from '@/lib/db/queries';
import { getUserTier } from '@/lib/tier';

export const runtime = 'edge';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ tier: 'free' });
    }

    const db = getD1Database();
    const dbUser = await getUserByClerkId(db, user.id);

    const tier = getUserTier(dbUser);

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Failed to get user tier:', error);
    return NextResponse.json({ tier: 'free' });
  }
}
