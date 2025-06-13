import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { getStripe } from '@/lib/stripe-config';
import { db } from '@/lib/db/index';
import {
  users,
  userSubscriptions,
  userBattery,
  batteryTransactions,
  subscriptionPlans,
} from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  // Read body once at the beginning
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  if (!signature) {
    console.error('[Webhook] No stripe-signature header found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // Get webhook secret from environment
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();

    // Create WebCrypto provider for Edge Runtime
    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    // Use constructEventAsync for Edge Runtime compatibility
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log('[Webhook] Signature verified successfully for event:', event.type);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', {
      error: err.message,
      type: err.constructor.name,
      code: err.code,
      statusCode: err.statusCode,
    });
    return NextResponse.json({ error: 'Invalid signature', details: err.message }, { status: 400 });
  }

  console.log('[Webhook] Processing event:', event.type, 'ID:', event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] Checkout session completed:', {
          mode: session.mode,
          sessionId: session.id,
          metadata: session.metadata,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        if (session.mode === 'subscription') {
          await handleSubscriptionCreated(session);
        } else if (session.mode === 'payment') {
          await handleBatteryPurchase(session);
        }
        break;
      }

      case 'customer.subscription.created': {
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
          await handleSubscriptionRenewal(invoice);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Handler error:', {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack,
    });

    // Return 200 to acknowledge receipt even if processing failed
    // This prevents Stripe from retrying
    return NextResponse.json({ received: true, error: 'Processing failed' }, { status: 200 });
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
    console.error('[Webhook] Missing required data:', { userId, subscriptionId });
    return;
  }

  try {
    // First, verify the user exists
    const existingUser = await db().select().from(users).where(eq(users.id, userId)).get();

    if (!existingUser) {
      console.error('[Webhook] User not found in database:', userId);
      throw new Error(`User ${userId} not found in database`);
    }

    // Get the subscription details
    const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const subscription = stripeSubscription as Stripe.Subscription;
    const planId = subscription.metadata.planId;

    if (!planId) {
      console.error('[Webhook] No planId in subscription metadata');
      throw new Error('No planId in subscription metadata');
    }

    // Get period dates with fallbacks
    const currentPeriodStart = subscription.current_period_start || Math.floor(Date.now() / 1000);
    const currentPeriodEnd =
      subscription.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    console.log('[Webhook] Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      planId,
      currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
    });

    // Get plan details with fallback
    let plan = await db()
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .get();

    if (!plan) {
      console.warn('[Webhook] Plan not found in database, using defaults for:', planId);
      const defaultPlans: Record<
        string,
        { name: string; batteryUnits: number; dailyBattery: number }
      > = {
        starter: { name: 'Starter', batteryUnits: 10000, dailyBattery: 1000 },
        daily: { name: 'Daily', batteryUnits: 50000, dailyBattery: 5000 },
        power: { name: 'Power', batteryUnits: 100000, dailyBattery: 10000 },
        ultimate: { name: 'Ultimate', batteryUnits: 500000, dailyBattery: 50000 },
      };

      const defaultPlan = defaultPlans[planId];
      if (!defaultPlan) {
        throw new Error(`No default plan configuration for: ${planId}`);
      }

      plan = {
        id: planId,
        ...defaultPlan,
        priceMonthly: 0,
        priceAnnual: 0,
        features: '[]',
        stripePriceIdMonthly: null,
        stripePriceIdAnnual: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Create or update user subscription
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
          updatedAt: new Date().toISOString(),
        },
      });

    console.log('[Webhook] User subscription record created/updated');

    // Update user tier
    await db()
      .update(users)
      .set({
        tier: 'paid',
        subscriptionStatus: subscription.status,
        subscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log('[Webhook] User tier updated to paid');

    // Initialize or update battery
    const existingBattery = await db()
      .select()
      .from(userBattery)
      .where(eq(userBattery.userId, userId))
      .get();

    if (!existingBattery) {
      console.log('[Webhook] Creating new battery record');
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

    // Record battery transaction
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
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionCreated:', error);
    throw error;
  }
}

// Include the other handler functions from the original file...
// (handleBatteryPurchase, handleSubscriptionUpdate, handleSubscriptionDeleted, handleSubscriptionRenewal, handlePaymentFailed)

async function handleBatteryPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const batteryUnits = parseInt(session.metadata?.batteryUnits || '0');
  const paymentIntentId = session.payment_intent as string;

  if (!userId || !batteryUnits) {
    console.error('[Webhook] Missing data for battery purchase:', { userId, batteryUnits });
    return;
  }

  // Verify user exists
  const existingUser = await db().select().from(users).where(eq(users.id, userId)).get();

  if (!existingUser) {
    console.error('[Webhook] User not found for battery purchase:', userId);
    throw new Error(`User ${userId} not found`);
  }

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

  console.log('[Webhook] Battery purchase completed for user:', userId);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;

  console.log('[Webhook] handleSubscriptionUpdate:', {
    subscriptionId: subscription.id,
    userId,
    planId,
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
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
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
    const plan = await db()
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .get();

    if (plan) {
      await db()
        .update(userBattery)
        .set({
          dailyAllowance: plan.dailyBattery,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userBattery.userId, userId));
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('[Webhook] No userId in subscription metadata for deletion');
    return;
  }

  // Update subscription status
  await db()
    .update(userSubscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  // Update user to free tier
  await db()
    .update(users)
    .set({
      tier: 'free',
      subscriptionStatus: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Remove daily allowance
  await db()
    .update(userBattery)
    .set({
      dailyAllowance: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userBattery.userId, userId));

  console.log('[Webhook] Subscription deleted for user:', userId);
}

async function handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const userId = invoice.subscription_details?.metadata?.userId;

  if (!userId || !subscriptionId) {
    console.error('[Webhook] Missing data for subscription renewal:', { userId, subscriptionId });
    return;
  }

  // Get subscription details
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const subscription = stripeSubscription as Stripe.Subscription;
  const planId = subscription.metadata.planId;

  if (!planId) {
    console.error('[Webhook] No planId for subscription renewal');
    return;
  }

  // Get plan details
  const plan = await db()
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .get();

  if (!plan) {
    console.error('[Webhook] Plan not found for renewal:', planId);
    return;
  }

  // Add monthly battery units
  await db()
    .update(userBattery)
    .set({
      totalBalance: sql`total_balance + ${plan.batteryUnits}`,
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
      amount: plan.batteryUnits,
      balanceAfter: batteryBalance?.totalBalance || plan.batteryUnits,
      description: `${plan.name} subscription renewed`,
    });

  console.log('[Webhook] Subscription renewal processed for user:', userId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.error('[Webhook] No subscription ID for failed payment');
    return;
  }

  // Update subscription status
  await db()
    .update(userSubscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId));

  console.log('[Webhook] Payment failed for subscription:', subscriptionId);
}
