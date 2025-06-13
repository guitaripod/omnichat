import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe-config';
import { db } from '@/lib/db/index';
import { users, userSubscriptions, userBattery, batteryTransactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    // Use constructEventAsync for Edge Runtime compatibility
    // In test environment or when createSubtleCryptoProvider is not available,
    // use the sync method
    if (
      process.env.NODE_ENV === 'test' ||
      typeof Stripe.createSubtleCryptoProvider !== 'function'
    ) {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
    } else {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_CONFIG.webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[Webhook] Processing event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] Checkout session completed:', {
          mode: session.mode,
          sessionId: session.id,
          metadata: session.metadata,
        });

        if (session.mode === 'subscription') {
          // Handle subscription creation
          await handleSubscriptionCreated(session);
        } else if (session.mode === 'payment') {
          // Handle battery pack purchase
          await handleBatteryPurchase(session);
        }
        break;
      }

      case 'customer.subscription.created': {
        // Skip this event - we handle subscription creation in checkout.session.completed
        console.log(
          '[Webhook] Skipping customer.subscription.created - handled in checkout.session.completed'
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_cycle') {
          // Monthly subscription renewal
          await handleSubscriptionRenewal(invoice);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const userId = session.metadata?.userId;

  console.log('[Webhook] handleSubscriptionCreated:', {
    subscriptionId,
    customerId,
    userId,
    metadata: session.metadata,
  });

  if (!userId || !subscriptionId) {
    console.error('[Webhook] Missing userId or subscriptionId:', { userId, subscriptionId });
    return;
  }

  // Get the subscription details
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);

  // The retrieved subscription has all the properties we need
  const subscription = stripeSubscription as Stripe.Subscription;
  const planId = subscription.metadata.planId;

  // Get the current period from the first subscription item or fallback to subscription level
  const currentPeriodStart =
    subscription.items?.data[0]?.current_period_start ||
    (subscription as any).current_period_start ||
    Math.floor(Date.now() / 1000);
  const currentPeriodEnd =
    subscription.items?.data[0]?.current_period_end ||
    (subscription as any).current_period_end ||
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

  console.log('[Webhook] Retrieved subscription:', {
    id: subscription.id,
    status: subscription.status,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    metadata: subscription.metadata,
    items: subscription.items?.data?.length || 0,
    firstItem: subscription.items?.data[0]
      ? {
          id: subscription.items.data[0].id,
          hasStart: !!subscription.items.data[0].current_period_start,
          hasEnd: !!subscription.items.data[0].current_period_end,
        }
      : null,
  });

  // Get the plan details - use defaults if not in database
  console.log('[Webhook] Looking for plan:', planId);

  // Default plan configurations
  const defaultPlans: Record<
    string,
    {
      name: string;
      batteryUnits: number;
      dailyBattery: number;
      priceMonthly: number;
      priceAnnual: number;
      features: string[];
    }
  > = {
    starter: {
      name: 'Starter',
      batteryUnits: 10000,
      dailyBattery: 1000,
      priceMonthly: 399,
      priceAnnual: 3999,
      features: [
        '10,000 battery units/month',
        '1,000 daily battery allowance',
        'Access to all AI models',
        'Basic support',
      ],
    },
    daily: {
      name: 'Daily',
      batteryUnits: 50000,
      dailyBattery: 5000,
      priceMonthly: 1299,
      priceAnnual: 12999,
      features: [
        '50,000 battery units/month',
        '5,000 daily battery allowance',
        'Priority model access',
        'Email support',
      ],
    },
    power: {
      name: 'Power',
      batteryUnits: 100000,
      dailyBattery: 10000,
      priceMonthly: 2499,
      priceAnnual: 24999,
      features: [
        '100,000 battery units/month',
        '10,000 daily battery allowance',
        'Fastest model access',
        'Priority support',
      ],
    },
    ultimate: {
      name: 'Ultimate',
      batteryUnits: 500000,
      dailyBattery: 50000,
      priceMonthly: 9999,
      priceAnnual: 99999,
      features: [
        '500,000 battery units/month',
        '50,000 daily battery allowance',
        'Unlimited model switching',
        'Dedicated support',
      ],
    },
  };

  const defaultPlan = defaultPlans[planId];
  if (!defaultPlan) {
    console.error('[Webhook] Invalid plan ID:', planId);
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  // Use the default plan configuration
  const plan = {
    id: planId,
    ...defaultPlan,
    features: JSON.stringify(defaultPlan.features),
    stripePriceIdMonthly: process.env[`STRIPE_PRICE_${planId.toUpperCase()}_MONTHLY`] || null,
    stripePriceIdAnnual: process.env[`STRIPE_PRICE_${planId.toUpperCase()}_ANNUAL`] || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('[Webhook] Using plan configuration:', {
    id: plan.id,
    name: plan.name,
    batteryUnits: plan.batteryUnits,
    dailyBattery: plan.dailyBattery,
  });

  // Create user subscription record
  try {
    await db()
      .insert(userSubscriptions)
      .values({
        userId,
        planId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: subscription.status as
          | 'active'
          | 'canceled'
          | 'past_due'
          | 'trialing'
          | 'incomplete',
        currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          planId,
          stripeSubscriptionId: subscriptionId,
          status: subscription.status as
            | 'active'
            | 'canceled'
            | 'past_due'
            | 'trialing'
            | 'incomplete',
          currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
          currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
  } catch (error: any) {
    console.error('[Webhook] Failed to create/update user subscription:', error);
    throw error;
  }

  // Update user tier to 'paid'
  console.log('[Webhook] Updating user tier for userId:', userId);
  const updateResult = await db()
    .update(users)
    .set({
      tier: 'paid',
      subscriptionStatus: subscription.status,
      subscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  console.log('[Webhook] User tier update result:', updateResult);

  // Update user battery with plan allowance
  console.log('[Webhook] Updating battery for userId:', userId, 'with plan:', plan);

  // First check if userBattery record exists
  const existingBattery = await db()
    .select()
    .from(userBattery)
    .where(eq(userBattery.userId, userId))
    .get();

  if (!existingBattery) {
    console.log('[Webhook] No battery record found, creating one');
    await db()
      .insert(userBattery)
      .values({
        userId: userId,
        totalBalance: plan.batteryUnits,
        dailyAllowance: plan.dailyBattery,
        lastDailyReset: new Date().toISOString().split('T')[0],
      });
  } else {
    console.log('[Webhook] Updating existing battery record');
    await db()
      .update(userBattery)
      .set({
        dailyAllowance: plan.dailyBattery,
        totalBalance: sql`total_balance + ${plan.batteryUnits}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userBattery.userId, userId));
  }

  // Record the transaction
  const batteryBalance = await db()
    .select()
    .from(userBattery)
    .where(eq(userBattery.userId, userId))
    .get();

  await db()
    .insert(batteryTransactions)
    .values({
      userId,
      type: 'subscription',
      amount: plan.batteryUnits,
      balanceAfter: batteryBalance?.totalBalance || plan.batteryUnits,
      description: `${plan.name} subscription activated`,
    });

  console.log('[Webhook] Subscription created successfully for user:', userId);
}

async function handleBatteryPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const batteryUnits = parseInt(session.metadata?.batteryUnits || '0');
  const paymentIntentId = session.payment_intent as string;

  if (!userId || !batteryUnits) return;

  // Update user battery balance
  await db()
    .update(userBattery)
    .set({
      totalBalance: sql`total_balance + ${batteryUnits}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userBattery.userId, userId));

  // Get updated balance
  const batteryBalance = await db()
    .select()
    .from(userBattery)
    .where(eq(userBattery.userId, userId))
    .get();

  // Record the transaction
  await db()
    .insert(batteryTransactions)
    .values({
      userId,
      type: 'purchase',
      amount: batteryUnits,
      balanceAfter: batteryBalance?.totalBalance || batteryUnits,
      description: `Purchased ${batteryUnits.toLocaleString()} battery units`,
      stripePaymentIntentId: paymentIntentId,
    });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;

  console.log('[Webhook] handleSubscriptionUpdate:', {
    subscriptionId: subscription.id,
    userId,
    planId,
    metadata: subscription.metadata,
    status: subscription.status,
  });

  if (!userId) {
    console.error('[Webhook] No userId in subscription metadata');
    return;
  }

  // Update subscription record
  await db()
    .update(userSubscriptions)
    .set({
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete',
      currentPeriodStart: new Date(
        (subscription.items?.data[0]?.current_period_start ||
          (subscription as any).current_period_start) * 1000
      ).toISOString(),
      currentPeriodEnd: new Date(
        (subscription.items?.data[0]?.current_period_end ||
          (subscription as any).current_period_end) * 1000
      ).toISOString(),
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  // Update user tier based on subscription status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  await db()
    .update(users)
    .set({
      tier: isActive ? 'paid' : 'free',
      subscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Update daily allowance if plan changed
  if (planId) {
    // Use default plan config
    const defaultPlans: Record<string, { dailyBattery: number }> = {
      starter: { dailyBattery: 1000 },
      daily: { dailyBattery: 5000 },
      power: { dailyBattery: 10000 },
      ultimate: { dailyBattery: 50000 },
    };

    const planConfig = defaultPlans[planId];
    if (planConfig) {
      await db()
        .update(userBattery)
        .set({
          dailyAllowance: planConfig.dailyBattery,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userBattery.userId, userId));
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) return;

  // Update subscription status
  await db()
    .update(userSubscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  // Remove daily allowance
  await db()
    .update(userBattery)
    .set({
      dailyAllowance: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userBattery.userId, userId));
}

async function handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  const userId = (invoice as any).subscription_details?.metadata?.userId;

  if (!userId || !subscriptionId) return;

  // Get subscription details
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const subscription = stripeSubscription as Stripe.Subscription;
  const planId = subscription.metadata.planId;

  // Use default plan config
  const defaultPlans: Record<string, { name: string; batteryUnits: number }> = {
    starter: { name: 'Starter', batteryUnits: 10000 },
    daily: { name: 'Daily', batteryUnits: 50000 },
    power: { name: 'Power', batteryUnits: 100000 },
    ultimate: { name: 'Ultimate', batteryUnits: 500000 },
  };

  const planConfig = defaultPlans[planId];
  if (!planConfig) return;

  // Add monthly battery units
  await db()
    .update(userBattery)
    .set({
      totalBalance: sql`total_balance + ${planConfig.batteryUnits}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userBattery.userId, userId));

  // Get updated balance
  const batteryBalance = await db()
    .select()
    .from(userBattery)
    .where(eq(userBattery.userId, userId))
    .get();

  // Record the transaction
  await db()
    .insert(batteryTransactions)
    .values({
      userId,
      type: 'subscription',
      amount: planConfig.batteryUnits,
      balanceAfter: batteryBalance?.totalBalance || planConfig.batteryUnits,
      description: `${planConfig.name} subscription renewed`,
    });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) return;

  // Update subscription status
  await db()
    .update(userSubscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId));
}
