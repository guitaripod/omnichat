#!/usr/bin/env node

// Test database operations

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function testDatabase() {
  console.log('🔍 Testing database operations...\n');

  // Test user creation
  const userId = '4iru5ddYeB91ATLXUWOW0';

  // Check if user exists
  console.log('Checking user existence...');
  const checkUserResponse = await fetch('http://localhost:3000/api/v1/test/user/' + userId);
  const userData = await checkUserResponse.json();
  console.log('User data:', userData);
}

// Create a test endpoint first
async function createTestEndpoint() {
  const testRoute = `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, authProviders, refreshTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const database = db();
    
    // Get user
    const user = await database
      .select()
      .from(users)
      .where(eq(users.id, params.id))
      .get();
    
    // Get auth providers
    const providers = await database
      .select()
      .from(authProviders)
      .where(eq(authProviders.userId, params.id))
      .all();
    
    // Get refresh tokens
    const tokens = await database
      .select({
        id: refreshTokens.id,
        expiresAt: refreshTokens.expiresAt,
        lastUsedAt: refreshTokens.lastUsedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, params.id))
      .all();
    
    return NextResponse.json({
      user,
      authProviders: providers.results || [],
      refreshTokens: tokens.results || [],
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}`;

  console.log('Creating test endpoint...');
  console.log('Please create this file manually:');
  console.log('Path: src/app/api/v1/test/user/[id]/route.ts');
  console.log('Content:');
  console.log(testRoute);
}

// Run test
createTestEndpoint();
