import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { auth } from '@clerk/nextjs/server';
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe-config';
import { db } from '@/lib/db/index';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('[Stripe Portal] No authenticated user');
      return NextResponse.json(
        { error: 'Please sign in to manage your subscription' },
        { status: 401 }
      );
    }

    // Get user
    const user = await db().select().from(users).where(eq(users.clerkId, userId)).get();

    if (!user) {
      console.error('[Stripe Portal] User not found in database:', userId);
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      console.error('[Stripe Portal] User has no Stripe customer ID:', userId);
      return NextResponse.json(
        {
          error:
            'No billing account found. Please contact support if you have an active subscription.',
          details: 'Missing Stripe customer ID',
        },
        { status: 404 }
      );
    }

    // Get return URL from request
    const { returnUrl } = (await req.json()) as { returnUrl?: string };

    console.log('[Stripe Portal] Creating portal session for customer:', user.stripeCustomerId);

    // Create portal session
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || STRIPE_CONFIG.checkout.billingPortalReturnUrl,
    });

    console.log('[Stripe Portal] Portal session created successfully');
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Portal] Error creating portal session:', error);

    // Check for specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('No such customer')) {
        return NextResponse.json(
          {
            error: 'Customer account not found in Stripe. Please contact support.',
            details: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('STRIPE_SECRET_KEY')) {
        return NextResponse.json(
          {
            error: 'Payment system is not configured. Please contact support.',
            details: 'Missing Stripe configuration',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to access billing portal. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
