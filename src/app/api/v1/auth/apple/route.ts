import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, authProviders, refreshTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  verifyAppleIdToken,
  extractUserInfo,
  mockVerifyAppleIdToken,
} from '@/lib/api/auth/apple-edge';
import { generateTokenPair } from '@/lib/api/auth/jwt';
import { hashToken } from '@/lib/api/auth/hash';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || 'com.example.omnichat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, user: appleUserData } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verify Apple ID token
    let appleToken;
    try {
      // In development, use mock verification
      if (process.env.NODE_ENV === 'development') {
        appleToken = await mockVerifyAppleIdToken(idToken, APPLE_CLIENT_ID);
      } else {
        appleToken = await verifyAppleIdToken(idToken, APPLE_CLIENT_ID);
      }
    } catch (error) {
      console.error('Apple token verification failed:', error);
      return NextResponse.json({ error: 'Invalid Apple ID token' }, { status: 401 });
    }

    const userInfo = extractUserInfo(appleToken);
    const database = db();

    // Check if auth provider exists
    const existingProvider = await database
      .select()
      .from(authProviders)
      .where(
        and(
          eq(authProviders.provider, 'apple'),
          eq(authProviders.providerUserId, userInfo.appleUserId)
        )
      )
      .get();

    let userId: string;
    let userEmail: string;

    if (existingProvider) {
      // User exists, get their info
      userId = existingProvider.userId;
      const existingUser = await database.select().from(users).where(eq(users.id, userId)).get();

      if (!existingUser) {
        throw new Error('User not found');
      }

      userEmail = existingUser.email;
    } else {
      // New user, create account
      // For first-time sign in, Apple provides user data
      const email = userInfo.email || appleUserData?.email;

      if (!email) {
        return NextResponse.json({ error: 'Email required for new users' }, { status: 400 });
      }

      // Check if email already exists
      const existingUser = await database.select().from(users).where(eq(users.email, email)).get();

      if (existingUser) {
        // Link existing user to Apple provider
        userId = existingUser.id;
        userEmail = existingUser.email;
      } else {
        // Create new user
        userId = nanoid();
        const name = appleUserData?.name
          ? `${appleUserData.name.firstName || ''} ${appleUserData.name.lastName || ''}`.trim()
          : undefined;

        await database.insert(users).values({
          id: userId,
          email,
          name: name || email.split('@')[0],
          tier: 'free',
        });

        userEmail = email;
      }

      // Create auth provider link
      await database.insert(authProviders).values({
        userId,
        provider: 'apple',
        providerUserId: userInfo.appleUserId,
        email: userEmail,
      });
    }

    // Generate tokens
    const tokens = await generateTokenPair(userId, userEmail);

    // Store refresh token
    const tokenHash = await hashToken(tokens.refreshToken);

    await database.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Return tokens and user info
    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      user: {
        id: userId,
        email: userEmail,
      },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
