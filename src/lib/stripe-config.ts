import Stripe from 'stripe';

// Lazy-load Stripe to avoid initialization at build time
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    console.log('[Stripe Config] Initializing Stripe, secret key exists:', !!secretKey);

    if (!secretKey) {
      console.error('[Stripe Config] STRIPE_SECRET_KEY is not configured');
      console.error(
        '[Stripe Config] Available env vars:',
        Object.keys(process.env).filter((k) => k.includes('STRIPE'))
      );
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    });
    console.log('[Stripe Config] Stripe instance created successfully');
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
  console.log('[Stripe Config] Getting price for plan:', planId, 'isAnnual:', isAnnual);
  console.log('[Stripe Config] Available prices:', Object.keys(config.prices));

  const plan = config.prices[planId as keyof typeof config.prices];
  if (!plan || typeof plan === 'string') {
    console.error('[Stripe Config] Plan not found or invalid:', planId);
    console.error('[Stripe Config] Plan data:', plan);
    throw new Error(`Invalid plan: ${planId}`);
  }

  // Type guard to ensure plan has monthly/annual properties
  if ('monthly' in plan && 'annual' in plan) {
    const priceId = isAnnual ? plan.annual : plan.monthly;
    console.log('[Stripe Config] Price ID for', planId, ':', priceId || 'NOT SET');

    if (!priceId) {
      console.error(
        '[Stripe Config] Price ID not configured for:',
        planId,
        isAnnual ? 'annual' : 'monthly'
      );
      throw new Error(`Price not configured for ${planId} ${isAnnual ? 'annual' : 'monthly'}`);
    }

    return priceId;
  }

  console.error('[Stripe Config] Invalid plan structure:', plan);
  throw new Error(`Invalid plan type: ${planId}`);
}

// Helper to get battery pack price ID
export function getBatteryPackPriceId(units: number): string {
  const config = getStripeConfig();
  const packs = config.prices.batteryPacks;

  console.log('[Stripe Config] Getting battery pack price for units:', units);
  console.log('[Stripe Config] Available packs:', packs);

  let priceId = '';

  // Handle the BATTERY_TOPUPS values
  if (units === 1000) priceId = packs.pack1000;
  else if (units === 5000) priceId = packs.pack5000;
  else if (units === 15000) priceId = packs.pack15000;
  else if (units === 50000) priceId = packs.pack50000;
  else {
    console.error('[Stripe Config] Invalid battery pack size:', units);
    throw new Error(`Invalid battery pack size: ${units}`);
  }

  if (!priceId) {
    console.error('[Stripe Config] Battery pack price not configured for units:', units);
    throw new Error(`Battery pack price not configured for ${units} units`);
  }

  console.log('[Stripe Config] Battery pack price ID:', priceId);
  return priceId;
}

// Format amount for display
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}
