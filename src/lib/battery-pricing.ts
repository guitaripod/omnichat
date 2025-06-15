// Battery-based pricing system for sustainable profitability

/**
 * Normalizes model IDs to match battery pricing keys
 * Maps actual API model IDs (like claude-3-5-haiku-20241022) to pricing keys (like claude-haiku-3.5)
 */
export function normalizeModelIdForPricing(modelId: string): string {
  console.log('[Battery Pricing] Normalizing model ID:', modelId);

  // Claude model mappings
  if (modelId.startsWith('claude-')) {
    // Claude 3.5 Haiku
    if (modelId.includes('haiku') && modelId.includes('3-5')) {
      console.log('[Battery Pricing] Normalized claude-3-5-haiku -> claude-haiku-3.5');
      return 'claude-haiku-3.5';
    }
    // Claude Opus 4
    if (modelId.includes('opus-4')) {
      console.log('[Battery Pricing] Normalized claude-opus-4 -> claude-opus-4');
      return 'claude-opus-4';
    }
    // Claude Sonnet 4
    if (modelId.includes('sonnet-4')) {
      console.log('[Battery Pricing] Normalized claude-sonnet-4 -> claude-sonnet-4');
      return 'claude-sonnet-4';
    }
    // Claude 3.7 Sonnet (treat as Sonnet 4 for pricing)
    if (modelId.includes('3-7-sonnet')) {
      console.log('[Battery Pricing] Normalized claude-3-7-sonnet -> claude-sonnet-4');
      return 'claude-sonnet-4';
    }
    // Claude 3.5 Sonnet (treat as mid-tier)
    if (modelId.includes('3-5-sonnet')) {
      console.log('[Battery Pricing] Normalized claude-3-5-sonnet -> claude-sonnet-3.5');
      return 'claude-sonnet-3.5';
    }
    // Claude 3 Opus (treat as premium)
    if (modelId.includes('3-opus')) {
      console.log('[Battery Pricing] Normalized claude-3-opus -> claude-opus-3');
      return 'claude-opus-3';
    }
    // Claude 3 Sonnet (treat as mid-tier)
    if (modelId.includes('3-sonnet')) {
      console.log('[Battery Pricing] Normalized claude-3-sonnet -> claude-sonnet-3');
      return 'claude-sonnet-3';
    }
  }

  // GPT models
  if (modelId.startsWith('gpt-')) {
    // GPT-4.1 variants
    if (modelId === 'gpt-4.1') return 'gpt-4.1';
    if (modelId === 'gpt-4.1-mini') return 'gpt-4.1-mini';
    if (modelId === 'gpt-4.1-nano') return 'gpt-4.1-nano';
    // GPT-4o variants (treat as previous gen)
    if (modelId === 'gpt-4o') return 'gpt-4o';
    if (modelId === 'gpt-4o-mini') return 'gpt-4o-mini';
  }

  // O3 models
  if (modelId === 'o3') return 'o3';
  if (modelId === 'o3-mini') return 'o3-mini';

  // Gemini models
  if (modelId.includes('gemini-1-5-flash') || modelId.includes('gemini-1.5-flash')) {
    return 'gemini-1.5-flash';
  }
  if (modelId.includes('gemini-1-5-pro') || modelId.includes('gemini-1.5-pro')) {
    return 'gemini-1.5-pro';
  }
  if (modelId.includes('gemini-2-0-flash') || modelId.includes('gemini-2.0-flash')) {
    return 'gemini-2.0-flash';
  }
  if (modelId.includes('gemini-2-5-flash') || modelId.includes('gemini-2.5-flash')) {
    return 'gemini-2.5-flash';
  }
  if (modelId.includes('gemini-2-5-pro') || modelId.includes('gemini-2.5-pro')) {
    return 'gemini-2.5-pro';
  }

  // Grok models
  if (modelId === 'grok-3') return 'grok-3';
  if (modelId === 'grok-3-mini') return 'grok-3-mini';

  // DeepSeek models
  if (modelId.includes('deepseek-chat')) {
    return 'deepseek-chat';
  }

  // Local/Ollama models - free
  if (modelId.includes('llama') || modelId.includes('qwen') || modelId.startsWith('ollama/')) {
    return modelId; // Keep as-is for local models
  }

  // Default: return as-is
  console.log('[Battery Pricing] No normalization needed, returning:', modelId);
  return modelId;
}

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
// All rates include 150% markup + 30% safety buffer for profitability
export const MODEL_BATTERY_USAGE: Record<string, ModelBatteryUsage> = {
  // Budget Tier - Very cheap to run
  'deepseek-chat': {
    batteryPerKToken: 2.23, // Uncached rate with markup
    estimatedPerMessage: 0.56,
    tier: 'budget',
    displayName: 'DeepSeek Chat',
    emoji: '⚡',
  },
  'deepseek-chat-cached': {
    batteryPerKToken: 1.91,
    estimatedPerMessage: 0.48,
    tier: 'budget',
    displayName: 'DeepSeek Chat (Cached)',
    emoji: '⚡',
  },
  'gpt-4.1-nano': {
    batteryPerKToken: 0.82,
    estimatedPerMessage: 0.21,
    tier: 'budget',
    displayName: 'GPT-4.1 Nano',
    emoji: '🔵',
  },
  'gemini-1.5-flash': {
    batteryPerKToken: 0.61,
    estimatedPerMessage: 0.16,
    tier: 'budget',
    displayName: 'Gemini Flash',
    emoji: '✨',
  },
  'gemini-2.0-flash': {
    batteryPerKToken: 0.82,
    estimatedPerMessage: 0.21,
    tier: 'budget',
    displayName: 'Gemini 2.0 Flash',
    emoji: '⚡',
  },

  // Mid Tier - Good balance
  'gpt-4.1-mini': {
    batteryPerKToken: 3.25,
    estimatedPerMessage: 0.82,
    tier: 'mid',
    displayName: 'GPT-4.1 Mini',
    emoji: '🟢',
  },
  'grok-3-mini': {
    batteryPerKToken: 1.3,
    estimatedPerMessage: 0.33,
    tier: 'mid',
    displayName: 'Grok 3 Mini',
    emoji: '🤖',
  },
  'claude-haiku-3.5': {
    batteryPerKToken: 7.8,
    estimatedPerMessage: 1.95,
    tier: 'mid',
    displayName: 'Claude Haiku 3.5',
    emoji: '🎋',
  },
  'claude-sonnet-3.5': {
    batteryPerKToken: 29.25,
    estimatedPerMessage: 7.32,
    tier: 'mid',
    displayName: 'Claude Sonnet 3.5',
    emoji: '🎼',
  },
  'claude-sonnet-3': {
    batteryPerKToken: 29.25,
    estimatedPerMessage: 7.32,
    tier: 'mid',
    displayName: 'Claude Sonnet 3',
    emoji: '🎵',
  },
  'claude-opus-3': {
    batteryPerKToken: 146.25,
    estimatedPerMessage: 36.57,
    tier: 'premium',
    displayName: 'Claude Opus 3',
    emoji: '🎨',
  },

  // Premium Tier - Higher quality
  'gpt-4.1': {
    batteryPerKToken: 16.25,
    estimatedPerMessage: 4.07,
    tier: 'premium',
    displayName: 'GPT-4.1',
    emoji: '🟣',
  },
  'gemini-1.5-pro': {
    batteryPerKToken: 10.16,
    estimatedPerMessage: 2.54,
    tier: 'premium',
    displayName: 'Gemini Pro',
    emoji: '💎',
  },
  'grok-3': {
    batteryPerKToken: 29.25,
    estimatedPerMessage: 7.32,
    tier: 'premium',
    displayName: 'Grok 3',
    emoji: '🚀',
  },

  // Ultra Premium - Top tier
  'claude-sonnet-4': {
    batteryPerKToken: 29.25,
    estimatedPerMessage: 7.32,
    tier: 'ultra',
    displayName: 'Claude Sonnet',
    emoji: '🎭',
  },
  'claude-opus-4': {
    batteryPerKToken: 146.25,
    estimatedPerMessage: 36.57,
    tier: 'ultra',
    displayName: 'Claude Opus',
    emoji: '🎨',
  },
  o3: {
    batteryPerKToken: 16.25,
    estimatedPerMessage: 4.07,
    tier: 'ultra',
    displayName: 'OpenAI o3',
    emoji: '🧠',
  },
  'o3-mini': {
    batteryPerKToken: 8.94,
    estimatedPerMessage: 2.24,
    tier: 'premium',
    displayName: 'OpenAI o3 Mini',
    emoji: '🤔',
  },

  // Previous generation GPT models
  'gpt-4o': {
    batteryPerKToken: 20.32,
    estimatedPerMessage: 5.08,
    tier: 'mid',
    displayName: 'GPT-4o',
    emoji: '🔵',
  },
  'gpt-4o-mini': {
    batteryPerKToken: 1.22,
    estimatedPerMessage: 0.31,
    tier: 'budget',
    displayName: 'GPT-4o Mini',
    emoji: '🟢',
  },

  // Gemini 2.5 models
  'gemini-2.5-flash': {
    batteryPerKToken: 1.22,
    estimatedPerMessage: 0.31,
    tier: 'budget',
    displayName: 'Gemini 2.5 Flash',
    emoji: '⚡',
  },
  'gemini-2.5-pro': {
    batteryPerKToken: 18.29,
    estimatedPerMessage: 4.58,
    tier: 'premium',
    displayName: 'Gemini 2.5 Pro',
    emoji: '💫',
  },

  // Local models - Minimal server cost
  'llama3.3:latest': {
    batteryPerKToken: 0.1,
    estimatedPerMessage: 0.025,
    tier: 'budget',
    displayName: 'Llama 3.3 (Local)',
    emoji: '🦙',
  },
  'qwen2.5:latest': {
    batteryPerKToken: 0.1,
    estimatedPerMessage: 0.025,
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
  console.log('[Battery Pricing] calculateBatteryUsage called with:', {
    model,
    inputTokens,
    outputTokens,
    useCache,
  });

  // Normalize the model ID for pricing lookup
  const normalizedModel = normalizeModelIdForPricing(model);
  const modelKey =
    useCache && normalizedModel === 'deepseek-chat' ? 'deepseek-chat-cached' : normalizedModel;

  console.log('[Battery Pricing] Model lookup:', {
    originalModel: model,
    normalizedModel,
    finalKey: modelKey,
    modelExists: !!MODEL_BATTERY_USAGE[modelKey],
  });

  const usage = MODEL_BATTERY_USAGE[modelKey];

  if (!usage) {
    console.error(`[Battery Pricing] ERROR: Model not found in pricing configuration`);
    console.error(`[Battery Pricing] Model: ${model}`);
    console.error(`[Battery Pricing] Normalized: ${normalizedModel}`);
    console.error(`[Battery Pricing] Final key: ${modelKey}`);
    console.error(`[Battery Pricing] Available models:`, Object.keys(MODEL_BATTERY_USAGE));

    // Return a default cost to prevent free usage
    const defaultCost = Math.ceil(((inputTokens + outputTokens) / 1000) * 10); // Default 10 BU per 1K tokens
    console.error(`[Battery Pricing] Using default cost: ${defaultCost} BU`);
    return defaultCost;
  }

  const totalTokens = inputTokens + outputTokens;
  const batteryUsed = (totalTokens / 1000) * usage.batteryPerKToken;
  const finalBatteryUsed = Math.ceil(batteryUsed); // Round up to nearest unit

  console.log('[Battery Pricing] Battery calculation:', {
    model: modelKey,
    batteryPerKToken: usage.batteryPerKToken,
    totalTokens,
    rawBatteryUsed: batteryUsed,
    finalBatteryUsed,
    calculation: `${totalTokens} tokens / 1000 * ${usage.batteryPerKToken} = ${batteryUsed} -> ${finalBatteryUsed} BU`,
  });

  return finalBatteryUsed;
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
