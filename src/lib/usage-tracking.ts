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
  console.log('[Usage Tracking] ==================== START ====================');
  console.log('[Usage Tracking] trackApiUsage called with:', {
    userId,
    conversationId,
    messageId,
    model,
    inputTokens,
    outputTokens,
    cached,
    timestamp: new Date().toISOString(),
  });

  try {
    // Use the imported db instance

    // Calculate battery usage
    console.log('[Usage Tracking] Calculating battery usage...');
    const batteryUsed = calculateBatteryUsage(model, inputTokens, outputTokens, cached);
    console.log('[Usage Tracking] Battery calculation result:', {
      model,
      inputTokens,
      outputTokens,
      cached,
      batteryUsed,
      calculation: `(${inputTokens} + ${outputTokens}) tokens = ${batteryUsed} BU`,
    });

    // Get current battery balance
    console.log('[Usage Tracking] Getting database instance...');
    const database = db();
    console.log('[Usage Tracking] Database instance obtained:', !!database);

    console.log('[Usage Tracking] Fetching user battery record for userId:', userId);
    let userBatteryRecord = await database
      .select()
      .from(userBattery)
      .where(eq(userBattery.userId, userId))
      .get();

    console.log(
      '[Usage Tracking] User battery record:',
      userBatteryRecord
        ? {
            userId: userBatteryRecord.userId,
            totalBalance: userBatteryRecord.totalBalance,
            dailyAllowance: userBatteryRecord.dailyAllowance,
            lastDailyReset: userBatteryRecord.lastDailyReset,
          }
        : 'NOT FOUND'
    );

    if (!userBatteryRecord) {
      console.log('[Usage Tracking] No battery record found, creating new one...');
      // Create default battery record if it doesn't exist
      await database
        .insert(userBattery)
        .values({
          userId,
          totalBalance: 0,
          dailyAllowance: 0,
          lastDailyReset: new Date().toISOString().split('T')[0],
        })
        .onConflictDoNothing();

      console.log('[Usage Tracking] Battery record created, fetching it...');
      // Fetch the created record
      userBatteryRecord = await database
        .select()
        .from(userBattery)
        .where(eq(userBattery.userId, userId))
        .get();

      if (!userBatteryRecord) {
        console.error('[Usage Tracking] ERROR: Failed to create user battery record');
        throw new Error('Failed to create user battery record');
      }
      console.log('[Usage Tracking] New battery record created successfully');
    }

    // Check if user has enough battery
    const currentBalance = userBatteryRecord.totalBalance;
    console.log('[Usage Tracking] Battery balance check:', {
      currentBalance,
      batteryNeeded: batteryUsed,
      sufficient: currentBalance >= batteryUsed,
    });

    if (currentBalance < batteryUsed) {
      console.error('[Usage Tracking] ERROR: Insufficient battery balance');
      throw new Error('Insufficient battery balance');
    }

    // Sequential operations for D1 compatibility (no transactions)
    const newBalance = currentBalance - batteryUsed;
    console.log('[Usage Tracking] New balance will be:', {
      oldBalance: currentBalance,
      batteryUsed,
      newBalance,
    });

    // 1. Record API usage
    console.log('[Usage Tracking] Step 1/4: Recording API usage...');
    await database.insert(apiUsageTracking).values({
      userId,
      conversationId,
      messageId,
      model,
      inputTokens,
      outputTokens,
      batteryUsed,
      cached,
    });
    console.log('[Usage Tracking] ✓ API usage recorded');

    // 2. Update battery balance
    console.log('[Usage Tracking] Step 2/4: Updating battery balance...');
    await database
      .update(userBattery)
      .set({
        totalBalance: newBalance,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userBattery.userId, userId));
    console.log('[Usage Tracking] ✓ Battery balance updated');

    // 3. Record battery transaction
    console.log('[Usage Tracking] Step 3/4: Recording battery transaction...');
    await database.insert(batteryTransactions).values({
      userId,
      type: 'usage',
      amount: -batteryUsed, // negative for usage
      balanceAfter: newBalance,
      description: `Used ${model} - ${inputTokens + outputTokens} tokens`,
      metadata: JSON.stringify({ conversationId, messageId, model }),
    });
    console.log('[Usage Tracking] ✓ Battery transaction recorded');

    // 4. Update daily usage summary
    const today = new Date().toISOString().split('T')[0];
    const existingSummary = await database
      .select()
      .from(dailyUsageSummary)
      .where(and(eq(dailyUsageSummary.userId, userId), eq(dailyUsageSummary.date, today)))
      .get();

    if (existingSummary) {
      // Update existing summary
      const modelsUsed = JSON.parse(existingSummary.modelsUsed);
      modelsUsed[model] = (modelsUsed[model] || 0) + 1;

      await database
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
      await database.insert(dailyUsageSummary).values({
        userId,
        date: today,
        totalBatteryUsed: batteryUsed,
        totalMessages: 1,
        modelsUsed: JSON.stringify({ [model]: 1 }),
      });
    }

    console.log('[Usage Tracking] ✓ All operations completed successfully');
    console.log('[Usage Tracking] Final result:', {
      success: true,
      batteryUsed,
      oldBalance: currentBalance,
      newBalance: currentBalance - batteryUsed,
    });
    console.log('[Usage Tracking] ==================== END ====================');

    return { success: true, batteryUsed, newBalance: currentBalance - batteryUsed };
  } catch (error) {
    console.error('[Usage Tracking] ==================== ERROR ====================');
    console.error('[Usage Tracking] Error details:', error);
    console.error(
      '[Usage Tracking] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    console.error('[Usage Tracking] ==================== END ERROR ====================');
    throw error;
  }
}

// Check if user has enough battery for a model
export async function checkBatteryBalance(
  userId: string,
  model: string,
  estimatedTokens: number = 500
) {
  console.log('[Battery Check] ==================== START ====================');
  console.log('[Battery Check] Checking battery balance:', {
    userId,
    model,
    estimatedTokens,
    timestamp: new Date().toISOString(),
  });

  try {
    const database = db();
    console.log('[Battery Check] Database instance obtained:', !!database);

    console.log('[Battery Check] Fetching user battery record...');
    const userBatteryRecord = await database
      .select()
      .from(userBattery)
      .where(eq(userBattery.userId, userId))
      .get();

    console.log(
      '[Battery Check] User battery record:',
      userBatteryRecord
        ? {
            totalBalance: userBatteryRecord.totalBalance,
            dailyAllowance: userBatteryRecord.dailyAllowance,
            lastDailyReset: userBatteryRecord.lastDailyReset,
          }
        : 'NOT FOUND'
    );

    if (!userBatteryRecord) {
      console.log('[Battery Check] No battery record found, creating default...');
      // Create default battery record if it doesn't exist
      await database
        .insert(userBattery)
        .values({
          userId,
          totalBalance: 0,
          dailyAllowance: 0,
          lastDailyReset: new Date().toISOString().split('T')[0],
        })
        .onConflictDoNothing();

      // Return default values for new users
      console.log('[Battery Check] Returning default values for new user');
      console.log('[Battery Check] ==================== END ====================');
      return { hasBalance: false, currentBalance: 0, estimatedCost: 0, dailyAllowance: 0 };
    }

    // Estimate battery cost (assume 50/50 input/output split)
    console.log('[Battery Check] Calculating estimated cost...');
    const estimatedCost = calculateBatteryUsage(
      model,
      Math.floor(estimatedTokens / 2),
      Math.floor(estimatedTokens / 2),
      false
    );

    const result = {
      hasBalance: userBatteryRecord.totalBalance >= estimatedCost,
      currentBalance: userBatteryRecord.totalBalance,
      estimatedCost,
      dailyAllowance: userBatteryRecord.dailyAllowance,
    };

    console.log('[Battery Check] Result:', {
      ...result,
      sufficient: result.hasBalance ? '✓ YES' : '✗ NO',
    });
    console.log('[Battery Check] ==================== END ====================');

    return result;
  } catch (error) {
    console.error('[Battery Check] ==================== ERROR ====================');
    console.error('[Battery Check] Error:', error);
    console.error('[Battery Check] ==================== END ERROR ====================');
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
