import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userSubscriptions, userBattery, subscriptionPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';

export const runtime = 'edge';

// GET /api/v1/user/profile - Get user profile
export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const database = db();
      const userId = req.user!.id;

      // Get user info
      const user = await database.select().from(users).where(eq(users.id, userId)).get();

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get subscription info
      const subscription = await database
        .select({
          id: userSubscriptions.id,
          planId: userSubscriptions.planId,
          status: userSubscriptions.status,
          currentPeriodEnd: userSubscriptions.currentPeriodEnd,
          billingInterval: userSubscriptions.billingInterval,
          planName: subscriptionPlans.name,
          features: subscriptionPlans.features,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, userId))
        .get();

      // Get battery balance
      const battery = await database
        .select()
        .from(userBattery)
        .where(eq(userBattery.userId, userId))
        .get();

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        tier: user.tier,
        createdAt: user.createdAt,
        subscription: subscription
          ? {
              id: subscription.id,
              planId: subscription.planId,
              planName: subscription.planName,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              billingInterval: subscription.billingInterval,
              features: subscription.features ? JSON.parse(subscription.features) : [],
            }
          : null,
        battery: battery
          ? {
              totalBalance: battery.totalBalance,
              dailyAllowance: battery.dailyAllowance,
              lastDailyReset: battery.lastDailyReset,
            }
          : null,
      });
    });
  });
}

interface UpdateProfileRequest {
  name?: string;
  imageUrl?: string;
}

// PATCH /api/v1/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const body = await request.json() as UpdateProfileRequest;
      const { name, imageUrl } = body;

      if (!name && !imageUrl) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      const database = db();
      const userId = req.user!.id;

      // Update user
      const updates: { updatedAt: Date; name?: string; imageUrl?: string } = { updatedAt: new Date() };
      if (name !== undefined) updates.name = name;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;

      await database.update(users).set(updates).where(eq(users.id, userId));

      return NextResponse.json({
        id: userId,
        ...updates,
      });
    });
  });
}