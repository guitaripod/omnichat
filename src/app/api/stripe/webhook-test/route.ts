import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe-config';

export const runtime = 'edge';

// Test endpoint to diagnose webhook issues
export async function POST(req: NextRequest) {
  console.log('[Webhook Test] Request received');

  try {
    // Step 1: Check environment
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      runtime: 'edge',
      environment: process.env.NODE_ENV,
      secrets: {
        stripeSecretKeyExists: !!process.env.STRIPE_SECRET_KEY,
        webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
        webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'not-set',
      },
      headers: {
        hasSignature: !!req.headers.get('stripe-signature'),
        signatureLength: req.headers.get('stripe-signature')?.length || 0,
        contentType: req.headers.get('content-type'),
      },
    };

    // Step 2: Try to read body
    let body: string;
    try {
      body = await req.text();
      diagnostics['body'] = {
        success: true,
        length: body.length,
        preview: body.substring(0, 100) + '...',
      };
    } catch (bodyError) {
      diagnostics['body'] = {
        success: false,
        error: bodyError instanceof Error ? bodyError.message : String(bodyError),
      };
      return NextResponse.json({ error: 'Body read failed', diagnostics }, { status: 400 });
    }

    // Step 3: Test Stripe initialization
    try {
      getStripe(); // Test initialization
      diagnostics['stripe'] = {
        initialized: true,
        version: 'Stripe SDK',
      };
    } catch (stripeError) {
      diagnostics['stripe'] = {
        initialized: false,
        error: stripeError instanceof Error ? stripeError.message : String(stripeError),
      };
    }

    // Step 4: Test WebCrypto availability
    try {
      const webCrypto = Stripe.createSubtleCryptoProvider();
      diagnostics['webCrypto'] = {
        available: true,
        type: typeof webCrypto,
      };
    } catch (cryptoError) {
      diagnostics['webCrypto'] = {
        available: false,
        error: cryptoError instanceof Error ? cryptoError.message : String(cryptoError),
      };
    }

    // Step 5: Try signature verification
    const signature = req.headers.get('stripe-signature') as string;
    if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
      try {
        const stripe = getStripe();
        const event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET,
          undefined,
          Stripe.createSubtleCryptoProvider()
        );

        diagnostics['verification'] = {
          success: true,
          eventType: event.type,
          eventId: event.id,
        };
      } catch (verifyError: any) {
        diagnostics['verification'] = {
          success: false,
          error: verifyError instanceof Error ? verifyError.message : String(verifyError),
          errorType: verifyError?.constructor?.name || 'Unknown',
          errorCode: verifyError?.code || 'unknown',
        };
      }
    } else {
      diagnostics['verification'] = {
        skipped: true,
        reason: !signature ? 'No signature header' : 'No webhook secret',
      };
    }

    // Step 6: Test database connection
    try {
      const { db } = await import('@/lib/db/index');
      const testQuery = await db().$client.prepare('SELECT 1').first();
      diagnostics['database'] = {
        connected: true,
        testResult: testQuery,
      };
    } catch (dbError) {
      diagnostics['database'] = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      };
    }

    console.log('[Webhook Test] Diagnostics:', JSON.stringify(diagnostics, null, 2));

    return NextResponse.json({
      status: 'diagnostic-complete',
      diagnostics,
    });
  } catch (error) {
    console.error('[Webhook Test] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Diagnostic failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to verify the route is accessible
export async function GET() {
  return NextResponse.json({
    status: 'webhook-test-ready',
    instructions: 'Send a POST request with a Stripe webhook payload to test',
    timestamp: new Date().toISOString(),
  });
}
