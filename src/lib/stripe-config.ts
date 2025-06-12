import Stripe from 'stripe';

// Lazy-load Stripe to avoid initialization at build time
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripeInstance;
}

// Export stripe as a getter for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    return instance[prop as keyof Stripe];
  },
});

// Stripe configuration - lazy-loaded to avoid build-time issues
export function getStripeConfig() {
  return {
    // Product IDs (you'll create these in Stripe Dashboard)
    products: {
      starter: process.env.STRIPE_PRODUCT_STARTER || '',
      daily: process.env.STRIPE_PRODUCT_DAILY || '',
      power: process.env.STRIPE_PRODUCT_POWER || '',
      ultimate: process.env.STRIPE_PRODUCT_ULTIMATE || '',
      batteryPack: process.env.STRIPE_PRODUCT_BATTERY_PACK || '',
    },

    // Price IDs (you'll get these after creating products)
    prices: {
      starter: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || '',
      },
      daily: {
        monthly: process.env.STRIPE_PRICE_DAILY_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_DAILY_ANNUAL || '',
      },
      power: {
        monthly: process.env.STRIPE_PRICE_POWER_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_POWER_ANNUAL || '',
      },
      ultimate: {
        monthly: process.env.STRIPE_PRICE_ULTIMATE_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_ULTIMATE_ANNUAL || '',
      },
      batteryPacks: {
        pack1000: process.env.STRIPE_PRICE_BATTERY_1000 || '',
        pack5000: process.env.STRIPE_PRICE_BATTERY_5000 || '',
        pack15000: process.env.STRIPE_PRICE_BATTERY_15000 || '',
        pack50000: process.env.STRIPE_PRICE_BATTERY_50000 || '',
      },
    },

    // Webhook configuration
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

    // Checkout configuration
    checkout: {
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      billingPortalReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    },
  };
}

// Export for backward compatibility
export const STRIPE_CONFIG = new Proxy({} as ReturnType<typeof getStripeConfig>, {
  get(_target, prop) {
    const config = getStripeConfig();
    return config[prop as keyof ReturnType<typeof getStripeConfig>];
  },
});

// Helper to get price ID based on plan and billing period
export function getStripePriceId(planId: string, isAnnual: boolean): string {
  const config = getStripeConfig();
  const plan = config.prices[planId as keyof typeof config.prices];
  if (!plan || typeof plan === 'string') {
    throw new Error(`Invalid plan: ${planId}`);
  }

  // Type guard to ensure plan has monthly/annual properties
  if ('monthly' in plan && 'annual' in plan) {
    return isAnnual ? plan.annual : plan.monthly;
  }

  throw new Error(`Invalid plan type: ${planId}`);
}

// Helper to get battery pack price ID
export function getBatteryPackPriceId(units: number): string {
  const config = getStripeConfig();
  const packs = config.prices.batteryPacks;

  // Handle the BATTERY_TOPUPS values
  if (units === 1000) return packs.pack1000;
  if (units === 5000) return packs.pack5000;
  if (units === 15000) return packs.pack15000;
  if (units === 50000) return packs.pack50000;

  throw new Error(`Invalid battery pack size: ${units}`);
}

// Format amount for display
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}
