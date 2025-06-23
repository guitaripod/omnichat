import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  apiUsageTracking,
  batteryTransactions,
  dailyUsageSummary,
  conversations,
  messages,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';

export const runtime = 'edge';

// GET /api/v1/user/usage - Get usage statistics
export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const database = db();
      const userId = req.user!.id;

      // Parse query params for date range
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');

      // Calculate date range
      let startDate: Date;
      let endDate = new Date();

      if (startDateParam && endDateParam) {
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
      } else {
        switch (period) {
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'all':
            startDate = new Date('2020-01-01'); // Arbitrary old date
            break;
          default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      // Get daily usage summary
      const dailyUsage = await database
        .select({
          date: dailyUsageSummary.date,
          totalBatteryUsed: dailyUsageSummary.totalBatteryUsed,
          totalMessages: dailyUsageSummary.totalMessages,
          modelsUsed: dailyUsageSummary.modelsUsed,
        })
        .from(dailyUsageSummary)
        .where(
          and(
            eq(dailyUsageSummary.userId, userId),
            gte(dailyUsageSummary.date, startDate.toISOString().split('T')[0]),
            lte(dailyUsageSummary.date, endDate.toISOString().split('T')[0])
          )
        )
        .orderBy(desc(dailyUsageSummary.date))
        .all();

      // Get battery transactions
      const transactions = await database
        .select({
          id: batteryTransactions.id,
          type: batteryTransactions.type,
          amount: batteryTransactions.amount,
          balanceAfter: batteryTransactions.balanceAfter,
          description: batteryTransactions.description,
          createdAt: batteryTransactions.createdAt,
        })
        .from(batteryTransactions)
        .where(
          and(
            eq(batteryTransactions.userId, userId),
            gte(batteryTransactions.createdAt, startDate.toISOString()),
            lte(batteryTransactions.createdAt, endDate.toISOString())
          )
        )
        .orderBy(desc(batteryTransactions.createdAt))
        .all();

      // Get conversation count
      const conversationCount = await database
        .select({ count: sql`count(*)` })
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            gte(conversations.createdAt, startDate.getTime()),
            lte(conversations.createdAt, endDate.getTime())
          )
        )
        .get();

      // Get message count
      const messageCount = await database
        .select({ count: sql`count(*)` })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            gte(messages.createdAt, startDate.getTime()),
            lte(messages.createdAt, endDate.getTime())
          )
        )
        .get();

      // Calculate totals
      const totalBatteryUsed = (dailyUsage.results || []).reduce(
        (sum, day) => sum + day.totalBatteryUsed,
        0
      );
      const totalMessages = (dailyUsage.results || []).reduce(
        (sum, day) => sum + day.totalMessages,
        0
      );

      // Get model usage breakdown
      const modelUsage: Record<string, number> = {};
      (dailyUsage.results || []).forEach((day) => {
        try {
          const models = JSON.parse(day.modelsUsed || '{}');
          Object.entries(models).forEach(([model, count]) => {
            modelUsage[model] = (modelUsage[model] || 0) + (count as number);
          });
        } catch (e) {
          // Ignore parse errors
        }
      });

      return NextResponse.json({
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalBatteryUsed,
          totalMessages,
          totalConversations: conversationCount?.count || 0,
          totalUserMessages: messageCount?.count || 0,
          averageDailyUsage: totalBatteryUsed / Math.max(1, dailyUsage.results?.length || 1),
        },
        dailyUsage: (dailyUsage.results || []).map((day) => ({
          date: day.date,
          batteryUsed: day.totalBatteryUsed,
          messages: day.totalMessages,
          models: JSON.parse(day.modelsUsed || '{}'),
        })),
        modelBreakdown: Object.entries(modelUsage).map(([model, count]) => ({
          model,
          messageCount: count,
          percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
        })),
        recentTransactions: (transactions.results || []).slice(0, 10),
      });
    });
  });
}