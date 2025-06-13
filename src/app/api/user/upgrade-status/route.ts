import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/index';
import { users, userBattery } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

// Temporary endpoint to manually upgrade user status after payment
// This simulates what the webhook would do
export async function POST(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user tier to 'paid'
    const updatedUser = await db()
      .update(users)
      .set({
        tier: 'paid',
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning()
      .get();

    if (updatedUser) {
      // Also initialize battery with some balance for testing
      const existingBattery = await db()
        .select()
        .from(userBattery)
        .where(eq(userBattery.userId, updatedUser.id))
        .get();

      if (!existingBattery) {
        await db()
          .insert(userBattery)
          .values({
            userId: updatedUser.id,
            totalBalance: 100000, // Give 100k battery for testing
            dailyAllowance: 10000, // 10k daily
            lastDailyReset: new Date().toISOString().split('T')[0],
          });
      } else {
        await db()
          .update(userBattery)
          .set({
            totalBalance: 100000,
            dailyAllowance: 10000,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userBattery.userId, updatedUser.id));
      }
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User upgraded to paid tier',
      user: {
        email: updatedUser.email,
        tier: updatedUser.tier,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Upgrade status error:', error);
    return NextResponse.json({ error: 'Failed to upgrade status' }, { status: 500 });
  }
}

// GET endpoint to check current status
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db().select().from(users).where(eq(users.clerkId, userId)).get();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId,
      hasPaidAccess: user.tier === 'paid',
    });
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
