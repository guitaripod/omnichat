import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { auth } from '@clerk/nextjs/server';
import { getStripe, getStripePriceId, getBatteryPackPriceId } from '@/lib/stripe-config';
import { db } from '@/lib/db/index';
import { users, userBattery, userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  console.log('[Stripe Checkout] Starting checkout session creation');

  try {
    // Check authentication
    const { userId } = await auth();
    console.log('[Stripe Checkout] User ID:', userId);

    if (!userId) {
      console.error('[Stripe Checkout] No user ID found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = (await req.json()) as {
      type: string;
      planId?: string;
      isAnnual?: boolean;
      batteryUnits?: number;
      returnUrl?: string;
    };
    const {
      type, // 'subscription' or 'battery'
      planId,
      isAnnual = false,
      batteryUnits,
      returnUrl,
    } = body;

    console.log('[Stripe Checkout] Request body:', { type, planId, isAnnual, batteryUnits });

    // Get or create user
    let user = await db().select().from(users).where(eq(users.clerkId, userId)).get();
    console.log('[Stripe Checkout] Existing user lookup:', { userId, user });

    if (!user) {
      // Create user if doesn't exist
      const clerkUser = (await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then((res) => res.json())) as any;

      user = await db()
        .insert(users)
        .values({
          id: userId,
          clerkId: userId,
          email: clerkUser.email_addresses[0].email_address,
          name: `${clerkUser.first_name} ${clerkUser.last_name}`.trim() || null,
          imageUrl: clerkUser.image_url,
        })
        .returning()
        .get();

      console.log('[Stripe Checkout] Created new user:', user);

      // Initialize battery balance
      await db()
        .insert(userBattery)
        .values({
          userId: user.id,
          totalBalance: 0,
          dailyAllowance: 0,
        })
        .onConflictDoNothing();
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          clerkId: userId,
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await db().update(users).set({ stripeCustomerId }).where(eq(users.id, user.id));
    }

    // Get the app URL from the request or use environment variable
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`;

    console.log('[Stripe Checkout] Using user for session:', {
      userId: user.id,
      clerkId: user.clerkId,
      stripeCustomerId,
    });

    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl || `${appUrl}/pricing`,
      metadata: {
        userId: user.id,
        type,
      },
    };

    if (type === 'subscription') {
      // Subscription checkout
      console.log('[Stripe Checkout] Creating subscription checkout for plan:', planId);

      try {
        const priceId = getStripePriceId(planId!, isAnnual);
        console.log('[Stripe Checkout] Price ID:', priceId);

        if (!priceId) {
          console.error(
            '[Stripe Checkout] No price ID found for plan:',
            planId,
            'isAnnual:',
            isAnnual
          );
          return NextResponse.json(
            { error: 'Invalid plan or price not configured' },
            { status: 400 }
          );
        }

        sessionConfig = {
          ...sessionConfig,
          mode: 'subscription',
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata: {
              userId: user.id,
              planId: planId!,
            },
          },
          // Enable promo codes
          allow_promotion_codes: true,
        };
      } catch (error) {
        console.error('[Stripe Checkout] Error getting price ID:', error);
        return NextResponse.json({ error: 'Failed to get price for plan' }, { status: 400 });
      }
    } else if (type === 'battery') {
      // Battery pack purchase
      console.log('[Stripe Checkout] Creating battery checkout for units:', batteryUnits);

      try {
        const priceId = getBatteryPackPriceId(batteryUnits!);
        console.log('[Stripe Checkout] Battery price ID:', priceId);

        if (!priceId) {
          console.error('[Stripe Checkout] No price ID found for battery units:', batteryUnits);
          return NextResponse.json({ error: 'Invalid battery pack size' }, { status: 400 });
        }

        sessionConfig = {
          ...sessionConfig,
          mode: 'payment',
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          payment_intent_data: {
            metadata: {
              userId: user.id,
              batteryUnits: batteryUnits!.toString(),
            },
          },
        };
      } catch (error) {
        console.error('[Stripe Checkout] Error getting battery price ID:', error);
        return NextResponse.json(
          { error: 'Failed to get price for battery pack' },
          { status: 400 }
        );
      }
    } else {
      console.error('[Stripe Checkout] Invalid checkout type:', type);
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    // Create checkout session
    console.log(
      '[Stripe Checkout] Creating session with config:',
      JSON.stringify(sessionConfig, null, 2)
    );

    try {
      const stripe = getStripe();
      console.log('[Stripe Checkout] Stripe instance loaded');

      const session = await stripe.checkout.sessions.create(sessionConfig);
      console.log('[Stripe Checkout] Session created:', session.id);

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (stripeError) {
      console.error('[Stripe Checkout] Stripe API error:', stripeError);
      const errorMessage =
        stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error';
      return NextResponse.json({ error: `Stripe error: ${errorMessage}` }, { status: 500 });
    }
  } catch (error) {
    console.error('[Stripe Checkout] General error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Checkout failed: ${errorMessage}` }, { status: 500 });
  }
}

// Get subscription status
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db().select().from(users).where(eq(users.clerkId, userId)).get();
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ subscription: null });
    }

    // Get active subscriptions
    const subscriptions = await getStripe().subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    const subscription = subscriptions.data[0];

    // Retrieve the full subscription with price information to determine billing interval
    const fullSubscription = await getStripe().subscriptions.retrieve(subscription.id, {
      expand: ['items.data.price'],
    });

    // Determine billing interval from the price object
    let billingInterval: 'monthly' | 'annual' | null = null;
    if (
      fullSubscription.items?.data[0]?.price &&
      typeof fullSubscription.items.data[0].price === 'object' &&
      fullSubscription.items.data[0].price.recurring
    ) {
      const interval = fullSubscription.items.data[0].price.recurring.interval;
      billingInterval = interval === 'month' ? 'monthly' : interval === 'year' ? 'annual' : null;
    }

    // Get planId from our database instead of Stripe metadata
    const dbSubscription = await db()
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
      .get();

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId: dbSubscription?.planId || subscription.metadata.planId, // Use DB value if available
        currentPeriodEnd: new Date(
          (subscription.items?.data[0]?.current_period_end ||
            (subscription as any).current_period_end) * 1000
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        billingInterval,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}
