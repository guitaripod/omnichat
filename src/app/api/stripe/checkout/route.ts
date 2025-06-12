import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { auth } from '@clerk/nextjs/server';
import { getStripe, getStripePriceId, getBatteryPackPriceId } from '@/lib/stripe-config';
import { db } from '@/lib/db/index';
import { users, userBattery } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
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

    // Get or create user
    let user = await db().select().from(users).where(eq(users.clerkId, userId)).get();

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

    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.id,
        type,
      },
    };

    if (type === 'subscription') {
      // Subscription checkout
      const priceId = getStripePriceId(planId!, isAnnual);

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
    } else if (type === 'battery') {
      // Battery pack purchase
      const priceId = getBatteryPackPriceId(batteryUnits!);

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
    } else {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    // Create checkout session
    const session = await getStripe().checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
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

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.metadata.planId,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}
