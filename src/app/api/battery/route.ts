import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/index';
import { userBattery, dailyUsageSummary } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { isDevMode, getDevUser } from '@/lib/auth/dev-auth';
import { getUserUsageHistory } from '@/lib/usage-tracking';

export const runtime = 'edge';

export async function GET(_req: NextRequest) {
  try {
    // Authenticate user
    let userId: string;

    if (isDevMode()) {
      const devUser = await getDevUser();
      if (devUser) {
        userId = devUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const clerkUser = await currentUser();
      if (clerkUser) {
        userId = clerkUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get user battery balance
    const database = db();
    const battery = await database
      .select()
      .from(userBattery)
      .where(eq(userBattery.userId, userId))
      .get();

    if (!battery) {
      // Create default battery record
      await database
        .insert(userBattery)
        .values({
          userId,
          totalBalance: 0,
          dailyAllowance: 0,
        })
        .onConflictDoNothing();

      return NextResponse.json({
        totalBalance: 0,
        dailyAllowance: 0,
        lastDailyReset: new Date().toISOString().split('T')[0],
      });
    }

    // Get usage history for the last 7 days
    const usageHistory = await getUserUsageHistory(userId, 7);

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = await database
      .select()
      .from(dailyUsageSummary)
      .where(and(eq(dailyUsageSummary.userId, userId), eq(dailyUsageSummary.date, today)))
      .get();

    return NextResponse.json({
      totalBalance: battery.totalBalance,
      dailyAllowance: battery.dailyAllowance,
      lastDailyReset: battery.lastDailyReset,
      todayUsage: todayUsage?.totalBatteryUsed || 0,
      usageHistory,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to get battery status' }, { status: 500 });
  }
}
