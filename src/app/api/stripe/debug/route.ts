import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Debug endpoint to check Stripe configuration
// REMOVE THIS IN PRODUCTION
export async function GET() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const envVars = {
    // Check which Stripe env vars are set (without exposing values)
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    // Product IDs
    STRIPE_PRODUCT_STARTER: !!process.env.STRIPE_PRODUCT_STARTER,
    STRIPE_PRODUCT_DAILY: !!process.env.STRIPE_PRODUCT_DAILY,
    STRIPE_PRODUCT_POWER: !!process.env.STRIPE_PRODUCT_POWER,
    STRIPE_PRODUCT_ULTIMATE: !!process.env.STRIPE_PRODUCT_ULTIMATE,
    STRIPE_PRODUCT_BATTERY_PACK: !!process.env.STRIPE_PRODUCT_BATTERY_PACK,

    // Price IDs
    STRIPE_PRICE_STARTER_MONTHLY: !!process.env.STRIPE_PRICE_STARTER_MONTHLY,
    STRIPE_PRICE_STARTER_ANNUAL: !!process.env.STRIPE_PRICE_STARTER_ANNUAL,
    STRIPE_PRICE_DAILY_MONTHLY: !!process.env.STRIPE_PRICE_DAILY_MONTHLY,
    STRIPE_PRICE_DAILY_ANNUAL: !!process.env.STRIPE_PRICE_DAILY_ANNUAL,
    STRIPE_PRICE_POWER_MONTHLY: !!process.env.STRIPE_PRICE_POWER_MONTHLY,
    STRIPE_PRICE_POWER_ANNUAL: !!process.env.STRIPE_PRICE_POWER_ANNUAL,
    STRIPE_PRICE_ULTIMATE_MONTHLY: !!process.env.STRIPE_PRICE_ULTIMATE_MONTHLY,
    STRIPE_PRICE_ULTIMATE_ANNUAL: !!process.env.STRIPE_PRICE_ULTIMATE_ANNUAL,

    // Battery prices
    STRIPE_PRICE_BATTERY_1000: !!process.env.STRIPE_PRICE_BATTERY_1000,
    STRIPE_PRICE_BATTERY_5000: !!process.env.STRIPE_PRICE_BATTERY_5000,
    STRIPE_PRICE_BATTERY_15000: !!process.env.STRIPE_PRICE_BATTERY_15000,
    STRIPE_PRICE_BATTERY_50000: !!process.env.STRIPE_PRICE_BATTERY_50000,

    // Other
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV,
  };

  // Count missing vars
  const missing = Object.entries(envVars).filter(
    ([key, value]) => key.startsWith('STRIPE_') && value === false
  );

  return NextResponse.json({
    configured: missing.length === 0,
    missingCount: missing.length,
    missingVars: missing.map(([key]) => key),
    details: envVars,
  });
}
