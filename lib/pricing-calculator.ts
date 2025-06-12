export interface ModelPricing {
  inputCost: number; // per million tokens
  outputCost: number; // per million tokens
  cachedInputCost?: number; // per million tokens
  imageCost?: number; // per image
  minImageCost?: number;
  maxImageCost?: number;
}

export interface SubscriptionTier {
  name: string;
  price: number; // monthly price in USD
  credits: number; // monthly API credits in USD
  features: string[];
  modelAccess: string[];
  limits: {
    fileUploadMB: number;
    imageGeneration: number | 'unlimited';
    conversationHistory: number | 'unlimited';
    teamSeats?: number;
  };
}

// Model pricing data (per million tokens)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4.1': { inputCost: 2.0, outputCost: 8.0, cachedInputCost: 0.5 },
  'gpt-4.1-mini': { inputCost: 0.4, outputCost: 1.6, cachedInputCost: 0.1 },
  'gpt-4.1-nano': { inputCost: 0.1, outputCost: 0.4, cachedInputCost: 0.025 },
  o3: { inputCost: 2.0, outputCost: 8.0, cachedInputCost: 0.5 },
  'o4-mini': { inputCost: 1.1, outputCost: 4.4, cachedInputCost: 0.275 },
  'gpt-image-1': {
    inputCost: 5.0,
    outputCost: 0,
    cachedInputCost: 1.25,
    minImageCost: 0.01,
    maxImageCost: 0.17,
  },

  // Anthropic
  'claude-opus-4': { inputCost: 15.0, outputCost: 75.0 },
  'claude-sonnet-4': { inputCost: 3.0, outputCost: 15.0 },
  'claude-haiku-3.5': { inputCost: 0.8, outputCost: 4.0 },

  // Google
  'gemini-2.5-flash': { inputCost: 0.15, outputCost: 0.6 },
  'gemini-2.0-flash': { inputCost: 0.1, outputCost: 0.4, imageCost: 0.039 },
  'gemini-1.5-pro': { inputCost: 1.25, outputCost: 5.0 }, // base price
  'gemini-1.5-flash': { inputCost: 0.075, outputCost: 0.3 }, // base price

  // xAI
  'grok-3': { inputCost: 3.0, outputCost: 15.0, cachedInputCost: 0.75 },
  'grok-3-fast': { inputCost: 5.0, outputCost: 25.0, cachedInputCost: 1.25 },
  'grok-3-mini': { inputCost: 0.3, outputCost: 0.5, cachedInputCost: 0.075 },
  'grok-3-mini-fast': { inputCost: 0.6, outputCost: 4.0, cachedInputCost: 0.15 },

  // DeepSeek
  'deepseek-chat': { inputCost: 0.27, outputCost: 1.1, cachedInputCost: 0.07 },
  'deepseek-reasoner': { inputCost: 0.55, outputCost: 2.19, cachedInputCost: 0.14 },

  // Local models (Ollama) - no cost
  'llama3.3:latest': { inputCost: 0, outputCost: 0 },
  'qwen2.5:latest': { inputCost: 0, outputCost: 0 },
  'gemma2:latest': { inputCost: 0, outputCost: 0 },
  'phi3:latest': { inputCost: 0, outputCost: 0 },
  'mistral:latest': { inputCost: 0, outputCost: 0 },
};

// Subscription tiers
export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free',
    price: 0,
    credits: 2,
    features: [
      'Access to budget AI models',
      '7-day conversation history',
      'Basic chat features',
      'Community support',
    ],
    modelAccess: ['gpt-4.1-nano', 'gemini-1.5-flash', 'grok-3-mini', 'deepseek-chat', 'all-ollama'],
    limits: {
      fileUploadMB: 0,
      imageGeneration: 0,
      conversationHistory: 7, // days
    },
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    credits: 15,
    features: [
      'Access to all AI models',
      'Unlimited conversation history',
      'File attachments (10MB)',
      '50 images per month',
      'Priority support',
      'Custom prompts',
      'Export conversations',
    ],
    modelAccess: ['all'],
    limits: {
      fileUploadMB: 10,
      imageGeneration: 50,
      conversationHistory: 'unlimited',
    },
  },
  ultimate: {
    name: 'Ultimate',
    price: 49.99,
    credits: 100,
    features: [
      'Everything in Pro',
      'File attachments (100MB)',
      'Unlimited image generation',
      'API access',
      'Team collaboration (3 seats)',
      'Advanced analytics',
      'Custom templates',
      'Priority queue',
      'Dedicated support',
    ],
    modelAccess: ['all'],
    limits: {
      fileUploadMB: 100,
      imageGeneration: 'unlimited',
      conversationHistory: 'unlimited',
      teamSeats: 3,
    },
  },
};

// Calculate token cost
export function calculateTokenCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  useCache: boolean = false
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost =
    useCache && pricing.cachedInputCost ? pricing.cachedInputCost : pricing.inputCost;

  const totalCost =
    (inputTokens / 1_000_000) * inputCost + (outputTokens / 1_000_000) * pricing.outputCost;

  return Number(totalCost.toFixed(6));
}

// Check if user has enough credits
export function hasEnoughCredits(
  userCredits: number,
  estimatedCost: number,
  buffer: number = 0.1 // 10% buffer
): boolean {
  return userCredits >= estimatedCost * (1 + buffer);
}

// Get models available for a tier
export function getAvailableModels(tier: string): string[] {
  const subscription = SUBSCRIPTION_TIERS[tier];
  if (!subscription) return [];

  if (subscription.modelAccess.includes('all')) {
    return Object.keys(MODEL_PRICING);
  }

  const models: string[] = [];
  subscription.modelAccess.forEach((access) => {
    if (access === 'all-ollama') {
      models.push(...Object.keys(MODEL_PRICING).filter((m) => MODEL_PRICING[m].inputCost === 0));
    } else {
      models.push(access);
    }
  });

  return models;
}

// Estimate monthly cost based on usage
export function estimateMonthlyCost(
  monthlyTokens: { input: number; output: number },
  primaryModel: string = 'gpt-4.1-mini',
  cacheHitRate: number = 0.3
): number {
  const pricing = MODEL_PRICING[primaryModel];
  if (!pricing) return 0;

  const inputCost = pricing.cachedInputCost
    ? pricing.inputCost * (1 - cacheHitRate) + pricing.cachedInputCost * cacheHitRate
    : pricing.inputCost;

  const totalCost =
    (monthlyTokens.input / 1_000_000) * inputCost +
    (monthlyTokens.output / 1_000_000) * pricing.outputCost;

  return Number(totalCost.toFixed(2));
}

// Calculate overage charges
export function calculateOverageCharge(
  usedCredits: number,
  tierCredits: number,
  overageRate: number = 0.5 // 50% markup
): number {
  if (usedCredits <= tierCredits) return 0;

  const overage = usedCredits - tierCredits;
  return Number((overage * (1 + overageRate)).toFixed(2));
}

// Get recommended tier based on usage
export function getRecommendedTier(estimatedMonthlyCost: number): string {
  if (estimatedMonthlyCost <= SUBSCRIPTION_TIERS.free.credits) {
    return 'free';
  } else if (estimatedMonthlyCost <= SUBSCRIPTION_TIERS.pro.credits) {
    return 'pro';
  } else if (estimatedMonthlyCost <= SUBSCRIPTION_TIERS.ultimate.credits) {
    return 'ultimate';
  }
  return 'enterprise';
}
