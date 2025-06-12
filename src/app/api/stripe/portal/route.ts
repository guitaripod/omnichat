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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await db().select().from(users).where(eq(users.clerkId, userId)).get();

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    // Get return URL from request
    const { returnUrl } = (await req.json()) as { returnUrl?: string };

    // Create portal session
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || STRIPE_CONFIG.checkout.billingPortalReturnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
