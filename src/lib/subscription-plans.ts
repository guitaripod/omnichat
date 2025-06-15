// Centralized subscription plan configuration
// This is the single source of truth for plan names and features

export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    displayName: 'Starter Plan',
    shortName: 'Starter',
    dailyBattery: 200,
    features: [
      'Access to all AI models',
      '200 battery units daily',
      'Standard processing speed',
      'Email support',
    ],
  },
  daily: {
    name: 'Daily',
    displayName: 'Daily Plan',
    shortName: 'Daily',
    dailyBattery: 600,
    features: [
      'Access to all AI models',
      '600 battery units daily',
      'Priority processing',
      'Priority email support',
    ],
    popular: true,
  },
  power: {
    name: 'Power',
    displayName: 'Power Plan',
    shortName: 'Power',
    dailyBattery: 1500,
    features: [
      'Access to all AI models',
      '1,500 battery units daily',
      'Priority processing',
      'Priority support',
      'Battery rollover',
    ],
  },
  ultimate: {
    name: 'Ultimate',
    displayName: 'Ultimate Plan',
    shortName: 'Ultimate',
    dailyBattery: 5000,
    features: [
      'Access to all AI models',
      '5,000 battery units daily',
      'Priority processing',
      'Dedicated support',
      'Battery rollover',
      'Custom integrations',
    ],
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type Plan = (typeof SUBSCRIPTION_PLANS)[PlanId];

// Helper functions
export function getPlanById(planId: string): Plan | undefined {
  const id = planId.toLowerCase() as PlanId;
  return SUBSCRIPTION_PLANS[id];
}

export function getPlanName(planId: string): string {
  const plan = getPlanById(planId);
  return plan?.name || 'Subscription';
}

export function getPlanDisplayName(planId: string): string {
  const plan = getPlanById(planId);
  return plan?.displayName || 'Subscription Plan';
}

// Check if user has any paid subscription
export function hasPaidSubscription(planId: string | null | undefined): boolean {
  if (!planId) return false;
  return planId.toLowerCase() in SUBSCRIPTION_PLANS;
}

// Get the minimum plan required for a feature
export function getMinimumPlanForFeature(_feature: string): string {
  // This can be expanded based on feature requirements
  // For now, return the most popular plan as default
  return 'Daily';
}

// Common upgrade messages
export const UPGRADE_MESSAGES = {
  generic: 'Upgrade to unlock this feature',
  apiKey: 'Upgrade to a paid plan or add your API key',
  export: 'Export features are available with a subscription',
  speed: 'Get faster processing with a paid plan',
  models: 'Access all AI models with a subscription',
} as const;
