// Battery-based pricing system for sustainable profitability

export interface ModelBatteryUsage {
  batteryPerKToken: number; // Battery units per 1K tokens
  estimatedPerMessage: number; // Average battery units per message
  tier: 'budget' | 'mid' | 'premium' | 'ultra';
  displayName: string;
  emoji: string;
}

export interface BatteryTier {
  name: string;
  price: number;
  batteryUnits: number;
  features: string[];
  highlighted?: boolean;
}

// 1 Battery Unit (BU) = $0.001
// All rates include 100% markup for profitability
export const MODEL_BATTERY_USAGE: Record<string, ModelBatteryUsage> = {
  // Budget Tier - Very cheap to run
  'deepseek-chat': {
    batteryPerKToken: 1.4, // Uncached rate
    estimatedPerMessage: 0.35,
    tier: 'budget',
    displayName: 'DeepSeek Chat',
    emoji: '⚡',
  },
  'deepseek-chat-cached': {
    batteryPerKToken: 0.4,
    estimatedPerMessage: 0.1,
    tier: 'budget',
    displayName: 'DeepSeek Chat (Cached)',
    emoji: '⚡',
  },
  'gpt-4.1-nano': {
    batteryPerKToken: 0.5,
    estimatedPerMessage: 0.125,
    tier: 'budget',
    displayName: 'GPT-4.1 Nano',
    emoji: '🔵',
  },
  'gemini-1.5-flash': {
    batteryPerKToken: 0.5,
    estimatedPerMessage: 0.125,
    tier: 'budget',
    displayName: 'Gemini Flash',
    emoji: '✨',
  },

  // Mid Tier - Good balance
  'gpt-4.1-mini': {
    batteryPerKToken: 2.0,
    estimatedPerMessage: 0.5,
    tier: 'mid',
    displayName: 'GPT-4.1 Mini',
    emoji: '🟢',
  },
  'grok-3-mini': {
    batteryPerKToken: 1.6,
    estimatedPerMessage: 0.4,
    tier: 'mid',
    displayName: 'Grok 3 Mini',
    emoji: '🤖',
  },
  'claude-haiku-3.5': {
    batteryPerKToken: 4.8,
    estimatedPerMessage: 1.2,
    tier: 'mid',
    displayName: 'Claude Haiku',
    emoji: '🎋',
  },

  // Premium Tier - Higher quality
  'gpt-4.1': {
    batteryPerKToken: 10.0,
    estimatedPerMessage: 2.5,
    tier: 'premium',
    displayName: 'GPT-4.1',
    emoji: '🟣',
  },
  'gemini-1.5-pro': {
    batteryPerKToken: 7.5,
    estimatedPerMessage: 1.875,
    tier: 'premium',
    displayName: 'Gemini Pro',
    emoji: '💎',
  },
  'grok-3': {
    batteryPerKToken: 18.0,
    estimatedPerMessage: 4.5,
    tier: 'premium',
    displayName: 'Grok 3',
    emoji: '🚀',
  },

  // Ultra Premium - Top tier
  'claude-sonnet-4': {
    batteryPerKToken: 18.0,
    estimatedPerMessage: 4.5,
    tier: 'ultra',
    displayName: 'Claude Sonnet',
    emoji: '🎭',
  },
  'claude-opus-4': {
    batteryPerKToken: 90.0,
    estimatedPerMessage: 22.5,
    tier: 'ultra',
    displayName: 'Claude Opus',
    emoji: '🎨',
  },
  o3: {
    batteryPerKToken: 10.0,
    estimatedPerMessage: 2.5,
    tier: 'ultra',
    displayName: 'OpenAI o3',
    emoji: '🧠',
  },

  // Local models - Free
  'llama3.3:latest': {
    batteryPerKToken: 0,
    estimatedPerMessage: 0,
    tier: 'budget',
    displayName: 'Llama 3.3 (Local)',
    emoji: '🦙',
  },
  'qwen2.5:latest': {
    batteryPerKToken: 0,
    estimatedPerMessage: 0,
    tier: 'budget',
    displayName: 'Qwen 2.5 (Local)',
    emoji: '🏠',
  },
};

// Subscription tiers with battery units
export const BATTERY_TIERS: BatteryTier[] = [
  {
    name: 'Starter',
    price: 4.99,
    batteryUnits: 5000,
    features: [
      '5,000 Battery Units',
      'All AI models',
      '30-day chat history',
      'Basic export features',
      '~25,000 tokens with budget models',
      '~2,500 tokens with premium models',
    ],
  },
  {
    name: 'Plus',
    price: 14.99,
    batteryUnits: 20000,
    features: [
      '20,000 Battery Units',
      'Everything in Starter',
      'Unlimited chat history',
      'File attachments (10MB)',
      '25 images/month',
      'Priority support',
      '~100,000 tokens with budget models',
    ],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 39.99,
    batteryUnits: 60000,
    features: [
      '60,000 Battery Units',
      'Everything in Plus',
      'File attachments (50MB)',
      '100 images/month',
      'API access',
      'Custom prompts',
      'Usage analytics',
      '~300,000 tokens with budget models',
    ],
  },
];

// Battery pack for pay-as-you-go
export const BATTERY_PACKS = [
  { units: 10000, price: 9.99, popular: true },
  { units: 25000, price: 22.99 },
  { units: 50000, price: 44.99 },
  { units: 100000, price: 84.99 },
];

// Calculate battery usage for a message
export function calculateBatteryUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  useCache: boolean = false
): number {
  const modelKey = useCache && model === 'deepseek-chat' ? 'deepseek-chat-cached' : model;
  const usage = MODEL_BATTERY_USAGE[modelKey];

  if (!usage) return 0;

  const totalTokens = inputTokens + outputTokens;
  const batteryUsed = (totalTokens / 1000) * usage.batteryPerKToken;

  return Math.ceil(batteryUsed); // Round up to nearest unit
}

// Get battery percentage
export function getBatteryPercentage(remainingUnits: number, totalUnits: number): number {
  return Math.round((remainingUnits / totalUnits) * 100);
}

// Get battery color based on percentage
export function getBatteryColor(percentage: number): string {
  if (percentage > 50) return 'text-green-500';
  if (percentage > 25) return 'text-yellow-500';
  if (percentage > 10) return 'text-orange-500';
  return 'text-red-500';
}

// Format battery display
export function formatBatteryDisplay(
  remainingUnits: number,
  totalUnits: number
): {
  percentage: number;
  color: string;
  icon: string;
  text: string;
} {
  const percentage = getBatteryPercentage(remainingUnits, totalUnits);
  const color = getBatteryColor(percentage);

  let icon = '🔋';
  if (percentage <= 10) icon = '🪫';

  return {
    percentage,
    color,
    icon,
    text: `${remainingUnits.toLocaleString()} BU (${percentage}%)`,
  };
}

// Estimate messages remaining for each model
export function estimateRemainingMessages(batteryUnits: number): Record<string, number> {
  const estimates: Record<string, number> = {};

  Object.entries(MODEL_BATTERY_USAGE).forEach(([model, usage]) => {
    if (usage.estimatedPerMessage > 0) {
      estimates[model] = Math.floor(batteryUnits / usage.estimatedPerMessage);
    } else {
      estimates[model] = Infinity; // Local models
    }
  });

  return estimates;
}

// Get tier color
export function getTierColor(tier: 'budget' | 'mid' | 'premium' | 'ultra'): string {
  switch (tier) {
    case 'budget':
      return 'bg-gray-100 text-gray-800';
    case 'mid':
      return 'bg-blue-100 text-blue-800';
    case 'premium':
      return 'bg-purple-100 text-purple-800';
    case 'ultra':
      return 'bg-gradient-to-r from-purple-400 to-pink-400 text-white';
  }
}

// Calculate monthly savings
export function calculateMonthlySavings(
  monthlyUsage: number, // in battery units
  subscriptionTier: BatteryTier
): number {
  const payAsYouGoCost = (monthlyUsage / 10000) * 9.99;
  const savings = payAsYouGoCost - subscriptionTier.price;
  return Math.max(0, savings);
}
