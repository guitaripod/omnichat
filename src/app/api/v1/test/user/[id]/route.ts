import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, authProviders, refreshTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const database = db();

    // Get user
    const user = await database.select().from(users).where(eq(users.id, id)).get();

    // Get auth providers
    const providers = await database
      .select()
      .from(authProviders)
      .where(eq(authProviders.userId, id))
      .all();

    // Get refresh tokens
    const tokens = await database
      .select({
        id: refreshTokens.id,
        expiresAt: refreshTokens.expiresAt,
        lastUsedAt: refreshTokens.lastUsedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, id))
      .all();

    return NextResponse.json({
      user,
      authProviders: providers.results || [],
      refreshTokens: tokens.results || [],
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
