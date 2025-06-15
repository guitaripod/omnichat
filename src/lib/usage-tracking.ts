import { db } from '@/lib/db';
import {
  apiUsageTracking,
  userBattery,
  batteryTransactions,
  dailyUsageSummary,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { calculateBatteryUsage } from '@/lib/battery-pricing';

interface TrackUsageParams {
  userId: string;
  conversationId: string;
  messageId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cached?: boolean;
}

export async function trackApiUsage({
  userId,
  conversationId,
  messageId,
  model,
  inputTokens,
  outputTokens,
  cached = false,
}: TrackUsageParams) {
  try {
    // Use the imported db instance

    // Calculate battery usage
    const batteryUsed = calculateBatteryUsage(model, inputTokens, outputTokens, cached);

    // Get current battery balance
    const database = db();
    const userBatteryRecord = await database
      .select()
      .from(userBattery)
      .where(eq(userBattery.userId, userId))
      .get();

    if (!userBatteryRecord) {
      throw new Error('User battery record not found');
    }

    // Check if user has enough battery
    const currentBalance = userBatteryRecord.totalBalance;
    if (currentBalance < batteryUsed) {
      throw new Error('Insufficient battery balance');
    }

    // Start transaction
    await database.transaction(async (tx) => {
      // Record API usage
      await tx.insert(apiUsageTracking).values({
        userId,
        conversationId,
        messageId,
        model,
        inputTokens,
        outputTokens,
        batteryUsed,
        cached,
      });

      // Update battery balance
      const newBalance = currentBalance - batteryUsed;
      await tx
        .update(userBattery)
        .set({
          totalBalance: newBalance,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userBattery.userId, userId));

      // Record battery transaction
      await tx.insert(batteryTransactions).values({
        userId,
        type: 'usage',
        amount: -batteryUsed, // negative for usage
        balanceAfter: newBalance,
        description: `Used ${model} - ${inputTokens + outputTokens} tokens`,
        metadata: JSON.stringify({ conversationId, messageId, model }),
      });

      // Update daily usage summary
      const today = new Date().toISOString().split('T')[0];
      const existingSummary = await tx
        .select()
        .from(dailyUsageSummary)
        .where(and(eq(dailyUsageSummary.userId, userId), eq(dailyUsageSummary.date, today)))
        .get();

      if (existingSummary) {
        // Update existing summary
        const modelsUsed = JSON.parse(existingSummary.modelsUsed);
        modelsUsed[model] = (modelsUsed[model] || 0) + 1;

        await tx
          .update(dailyUsageSummary)
          .set({
            totalBatteryUsed: existingSummary.totalBatteryUsed + batteryUsed,
            totalMessages: existingSummary.totalMessages + 1,
            modelsUsed: JSON.stringify(modelsUsed),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(dailyUsageSummary.id, existingSummary.id));
      } else {
        // Create new summary
        await tx.insert(dailyUsageSummary).values({
          userId,
          date: today,
          totalBatteryUsed: batteryUsed,
          totalMessages: 1,
          modelsUsed: JSON.stringify({ [model]: 1 }),
        });
      }
    });

    return { success: true, batteryUsed, newBalance: currentBalance - batteryUsed };
  } catch (error) {
    console.error('Usage tracking error:', error);
    throw error;
  }
}

// Check if user has enough battery for a model
export async function checkBatteryBalance(
  userId: string,
  model: string,
  estimatedTokens: number = 500
) {
  try {
    const database = db();
    const userBatteryRecord = await database
      .select()
      .from(userBattery)
      .where(eq(userBattery.userId, userId))
      .get();

    if (!userBatteryRecord) {
      return { hasBalance: false, currentBalance: 0, estimatedCost: 0 };
    }

    // Estimate battery cost (assume 50/50 input/output split)
    const estimatedCost = calculateBatteryUsage(
      model,
      Math.floor(estimatedTokens / 2),
      Math.floor(estimatedTokens / 2),
      false
    );

    return {
      hasBalance: userBatteryRecord.totalBalance >= estimatedCost,
      currentBalance: userBatteryRecord.totalBalance,
      estimatedCost,
      dailyAllowance: userBatteryRecord.dailyAllowance,
    };
  } catch (error) {
    console.error('Battery check error:', error);
    return { hasBalance: false, currentBalance: 0, estimatedCost: 0 };
  }
}

// Get user usage history
export async function getUserUsageHistory(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  try {
    const database = db();
    const usage = await database
      .select({
        date: dailyUsageSummary.date,
        usage: dailyUsageSummary.totalBatteryUsed,
        messages: dailyUsageSummary.totalMessages,
        modelsUsed: dailyUsageSummary.modelsUsed,
      })
      .from(dailyUsageSummary)
      .where(
        and(eq(dailyUsageSummary.userId, userId), sql`${dailyUsageSummary.date} >= ${startDateStr}`)
      )
      .orderBy(dailyUsageSummary.date);

    // Transform for the UI
    return usage.map((day: any) => ({
      date: day.date,
      usage: day.usage,
      messages: day.messages,
      models: Object.entries(JSON.parse(day.modelsUsed))
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3) // Top 3 models
        .map(([model, count]) => ({ model, count: count as number })),
    }));
  } catch (error) {
    console.error('Usage history error:', error);
    return [];
  }
}

// Reset daily battery allowance (run this in a cron job)
export async function resetDailyBatteryAllowances() {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get all users with subscriptions
    const database = db();
    const usersWithAllowances = await database
      .select({
        userId: userBattery.userId,
        dailyAllowance: userBattery.dailyAllowance,
        lastReset: userBattery.lastDailyReset,
      })
      .from(userBattery)
      .where(sql`${userBattery.dailyAllowance} > 0`);

    for (const user of usersWithAllowances) {
      if (user.lastReset !== today) {
        // Add daily allowance to total balance
        await database
          .update(userBattery)
          .set({
            totalBalance: sql`total_balance + ${user.dailyAllowance}`,
            lastDailyReset: today,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userBattery.userId, user.userId));

        // Record the transaction
        const newBalance = await database
          .select()
          .from(userBattery)
          .where(eq(userBattery.userId, user.userId))
          .get();

        if (newBalance) {
          await database.insert(batteryTransactions).values({
            userId: user.userId,
            type: 'subscription',
            amount: user.dailyAllowance,
            balanceAfter: newBalance.totalBalance,
            description: 'Daily battery allowance',
          });
        }
      }
    }

    return { success: true, usersUpdated: usersWithAllowances.length };
  } catch (error) {
    console.error('Daily reset error:', error);
    return { success: false, error };
  }
}
