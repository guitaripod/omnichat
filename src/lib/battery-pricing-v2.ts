// Battery-based pricing system v2 - Daily user perspective

import { MODEL_BATTERY_USAGE } from './battery-pricing';

export interface DailyBatteryStats {
  dailyAllowance: number; // Daily battery budget
  usedToday: number; // Battery used today
  remainingToday: number; // Battery left for today
  totalRemaining: number; // Total battery in account
  daysRemaining: number; // Days left at current usage
  averageDailyUsage: number; // 7-day average
  resetTime: Date; // When daily allowance resets
}

export interface BatteryPlan {
  name: string;
  price: number;
  totalBattery: number;
  dailyBattery: number; // totalBattery / 30
  features: string[];
  popularUseCase: string;
  estimatedChats: {
    budget: number; // daily chats with budget models
    premium: number; // daily chats with premium models
  };
}

// Redesigned plans with daily perspective
export const BATTERY_PLANS: BatteryPlan[] = [
  {
    name: 'Starter',
    price: 4.99,
    totalBattery: 6000,
    dailyBattery: 200, // 200 BU per day
    features: [
      '200 battery units per day',
      'Rolls over unused daily battery',
      'All AI models',
      '30-day chat history',
      'Basic export',
    ],
    popularUseCase: 'Perfect for 5-10 daily chats',
    estimatedChats: {
      budget: 40, // with DeepSeek/Nano
      premium: 4, // with GPT-4.1
    },
  },
  {
    name: 'Daily',
    price: 12.99,
    totalBattery: 18000,
    dailyBattery: 600, // 600 BU per day
    features: [
      '600 battery units per day',
      'Rolls over unused daily battery',
      'Unlimited chat history',
      'File attachments (10MB)',
      'Image generation',
      'Priority support',
    ],
    popularUseCase: 'Great for 20-30 daily chats',
    estimatedChats: {
      budget: 120,
      premium: 12,
    },
  },
  {
    name: 'Power',
    price: 29.99,
    totalBattery: 45000,
    dailyBattery: 1500, // 1,500 BU per day
    features: [
      '1,500 battery units per day',
      'Everything in Daily plan',
      'File attachments (50MB)',
      'Unlimited images',
      'API access',
      'Usage analytics',
      'Custom prompts',
    ],
    popularUseCase: 'Ideal for professionals',
    estimatedChats: {
      budget: 300,
      premium: 30,
    },
  },
  {
    name: 'Ultimate',
    price: 79.99,
    totalBattery: 150000,
    dailyBattery: 5000, // 5,000 BU per day
    features: [
      '5,000 battery units per day',
      'Everything in Power plan',
      'Team seats (5)',
      'Advanced integrations',
      'SLA support',
      'Custom models',
    ],
    popularUseCase: 'For teams & heavy users',
    estimatedChats: {
      budget: 1000,
      premium: 100,
    },
  },
];

// Quick top-up options
export const BATTERY_TOPUPS = [
  {
    units: 1000,
    price: 1.49,
    label: 'Quick Boost',
    description: '~20 GPT-4.1 mini chats',
  },
  {
    units: 5000,
    price: 5.99,
    label: 'Week Pack',
    description: '~100 GPT-4.1 mini chats',
  },
  {
    units: 15000,
    price: 14.99,
    label: 'Month Pack',
    description: '~300 GPT-4.1 mini chats',
    popular: true,
  },
  {
    units: 50000,
    price: 44.99,
    label: 'Mega Pack',
    description: '~1000 GPT-4.1 mini chats',
  },
];

// Calculate daily battery stats
export function calculateDailyStats(
  userId: string,
  subscription: BatteryPlan | null,
  totalRemaining: number,
  usageHistory: Array<{ date: string; usage: number }>
): DailyBatteryStats {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Calculate today's usage
  const todayUsage = usageHistory
    .filter((u) => u.date === today)
    .reduce((sum, u) => sum + u.usage, 0);

  // Calculate 7-day average
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentUsage = usageHistory
    .filter((u) => new Date(u.date) >= sevenDaysAgo)
    .reduce((sum, u) => sum + u.usage, 0);
  const averageDailyUsage = recentUsage / 7;

  // Daily allowance (subscription or pay-as-you-go)
  const dailyAllowance = subscription ? subscription.dailyBattery : 0;

  // Calculate remaining for today
  const remainingToday = subscription ? Math.max(0, dailyAllowance - todayUsage) : totalRemaining; // Pay-as-you-go users use from total

  // Days remaining at current usage
  const daysRemaining =
    averageDailyUsage > 0 ? Math.floor(totalRemaining / averageDailyUsage) : Infinity;

  // Reset time (midnight local time)
  const resetTime = new Date(now);
  resetTime.setHours(24, 0, 0, 0);

  return {
    dailyAllowance,
    usedToday: todayUsage,
    remainingToday,
    totalRemaining,
    daysRemaining,
    averageDailyUsage: Math.round(averageDailyUsage),
    resetTime,
  };
}

// Format time until reset
export function formatTimeUntilReset(resetTime: Date): string {
  const now = new Date();
  const diff = resetTime.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get battery status message
export function getBatteryStatusMessage(stats: DailyBatteryStats): {
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
} {
  const percentUsed = stats.dailyAllowance > 0 ? (stats.usedToday / stats.dailyAllowance) * 100 : 0;

  if (stats.totalRemaining <= 0) {
    return {
      message: 'Battery depleted! Top up to continue.',
      type: 'danger',
    };
  }

  if (stats.remainingToday <= 0 && stats.dailyAllowance > 0) {
    return {
      message: `Daily limit reached. Resets in ${formatTimeUntilReset(stats.resetTime)}`,
      type: 'warning',
    };
  }

  if (percentUsed > 80) {
    return {
      message: `${Math.round(100 - percentUsed)}% of daily battery remaining`,
      type: 'warning',
    };
  }

  if (stats.daysRemaining < 7 && stats.daysRemaining !== Infinity) {
    return {
      message: `${stats.daysRemaining} days of battery left at current usage`,
      type: 'warning',
    };
  }

  return {
    message: 'Battery healthy',
    type: 'success',
  };
}

// Estimate daily chat capacity
export function estimateDailyChats(dailyBattery: number, model: string): number {
  const usage = MODEL_BATTERY_USAGE[model];
  if (!usage || usage.estimatedPerMessage === 0) return Infinity;

  // Assume 5 messages per chat on average
  const batteryPerChat = usage.estimatedPerMessage * 5;
  return Math.floor(dailyBattery / batteryPerChat);
}

// Get usage insights
export function getUsageInsights(
  usageHistory: Array<{ date: string; usage: number; model: string }>
): {
  favoriteModel: string;
  peakUsageDay: string;
  averageChatsPerDay: number;
  suggestion: string;
} {
  // Find favorite model
  const modelCounts = usageHistory.reduce(
    (acc, u) => {
      acc[u.model] = (acc[u.model] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const favoriteModel =
    Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'gpt-4.1-mini';

  // Find peak usage day
  const dailyUsage = usageHistory.reduce(
    (acc, u) => {
      acc[u.date] = (acc[u.date] || 0) + u.usage;
      return acc;
    },
    {} as Record<string, number>
  );

  const peakUsageDay = Object.entries(dailyUsage).sort((a, b) => b[1] - a[1])[0]?.[0] || 'today';

  // Calculate average chats
  const totalDays = Object.keys(dailyUsage).length || 1;
  const totalUsage = Object.values(dailyUsage).reduce((sum, u) => sum + u, 0);
  const avgBatteryPerChat = MODEL_BATTERY_USAGE[favoriteModel]?.estimatedPerMessage * 5 || 10;
  const averageChatsPerDay = Math.round(totalUsage / totalDays / avgBatteryPerChat);

  // Generate suggestion
  let suggestion = '';
  if (averageChatsPerDay < 5) {
    suggestion = "You're a light user. Starter plan is perfect for you!";
  } else if (averageChatsPerDay < 20) {
    suggestion = 'Daily plan would give you more flexibility.';
  } else if (averageChatsPerDay < 50) {
    suggestion = 'Power plan matches your usage patterns.';
  } else {
    suggestion = "You're a power user! Consider Ultimate.";
  }

  return {
    favoriteModel,
    peakUsageDay,
    averageChatsPerDay,
    suggestion,
  };
}
