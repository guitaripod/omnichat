import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, refreshTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, generateTokenPair } from '@/lib/api/auth/jwt';
import { hashToken } from '@/lib/api/auth/hash';
import type { RefreshTokenPayload } from '@/lib/api/auth/jwt';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });
    }

    // Verify refresh token
    try {
      await verifyToken<RefreshTokenPayload>(refreshToken);
    } catch {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    const database = db();
    const tokenHash = await hashToken(refreshToken);

    // Check if refresh token exists and is valid
    const storedToken = await database
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .get();

    if (!storedToken) {
      return NextResponse.json({ error: 'Refresh token not found' }, { status: 401 });
    }

    const token = storedToken;

    // Check if token is expired
    if (new Date(token.expiresAt) < new Date()) {
      // Delete expired token
      await database.delete(refreshTokens).where(eq(refreshTokens.id, token.id));

      return NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });
    }

    // Get user info
    const user = await database.select().from(users).where(eq(users.id, token.userId)).get();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update last used timestamp
    await database
      .update(refreshTokens)
      .set({
        lastUsedAt: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      })
      .where(eq(refreshTokens.id, token.id));

    // Generate new access token (keep same refresh token)
    const { accessToken, expiresIn, tokenType } = await generateTokenPair(user.id, user.email);

    return NextResponse.json({
      accessToken,
      expiresIn,
      tokenType,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}
