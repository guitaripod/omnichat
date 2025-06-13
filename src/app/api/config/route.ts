import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Public configuration endpoint for client-side access
export async function GET() {
  // Only return public configuration values
  const config = {
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    },
    clerk: {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://omnichat-7pu.pages.dev',
      environment: process.env.NODE_ENV || 'development',
    },
  };

  // Log for debugging
  console.log('[Config API] Stripe key exists:', !!config.stripe.publishableKey);
  console.log('[Config API] Clerk key exists:', !!config.clerk.publishableKey);
  console.log('[Config API] App URL:', config.app.url);

  return NextResponse.json(config);
}
