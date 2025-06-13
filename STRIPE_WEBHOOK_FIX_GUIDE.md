# Stripe Webhook 500 Error Fix Guide

Based on comprehensive research, here are all the potential issues and fixes for your Stripe webhook failing with 500 errors:

## Issue 1: Webhook Secret Mismatch (Most Common)

**Problem**: The webhook secret in Cloudflare doesn't match the one from Stripe Dashboard.

**Fix**:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Copy the signing secret (starts with `whsec_`)
4. Update it in Cloudflare:
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET
   # Paste the exact secret from Stripe
   ```
5. **IMPORTANT**: Ensure you're using the correct secret for your environment:
   - Test mode webhooks have different secrets than live mode
   - Each endpoint has its own unique secret

## Issue 2: Request Body Already Used Error

**Problem**: The Edge Runtime reads the request body multiple times, causing "Body has already been used" error.

**Current Code Analysis**: Your code correctly reads the body once:

```typescript
const body = await req.text(); // ✓ Good - reads once
```

However, if you have any middleware that reads the body before it reaches the webhook, this could cause issues.

## Issue 3: WebCrypto Implementation

Your current implementation looks correct, but let's ensure it's properly configured:

```typescript
// Your current code (line 37-43):
event = await stripe.webhooks.constructEventAsync(
  body,
  signature,
  STRIPE_CONFIG.webhookSecret,
  undefined,
  Stripe.createSubtleCryptoProvider() // ✓ Correct for Edge Runtime
);
```

## Issue 4: Stripe SDK Initialization for Edge Runtime

Check your stripe initialization in `/src/lib/stripe-config.ts`:

```typescript
// Add httpClient configuration
stripeInstance = new Stripe(secretKey, {
  apiVersion: '2025-05-28.basil',
  httpClient: Stripe.createFetchHttpClient(), // Add this line
});
```

## Issue 5: Database Foreign Key Constraints

**Problem**: The webhook might be failing when trying to insert data due to foreign key constraints.

**Potential Issues in Your Code**:

1. Line 267-280: Creating userBattery record - the userId might not exist
2. Line 208-244: Creating userSubscriptions - the userId might not match Clerk's user ID

**Fix**: Add proper error handling and logging:

```typescript
// Before line 208, add validation:
const userExists = await db().select().from(users).where(eq(users.id, userId)).get();

if (!userExists) {
  console.error('[Webhook] User not found in database:', userId);
  // Create the user or handle appropriately
}
```

## Issue 6: Cloudflare Pages Specific Configuration

Add node compatibility flag (if not already present):

Create `wrangler.toml` in your project root:

```toml
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-01-01"
```

## Issue 7: Environment Variable Access

Your code uses `process.env` which might not work correctly in Edge Runtime. Consider using the Cloudflare environment pattern:

```typescript
// In your route handler
export async function POST(req: NextRequest, { env }: { env: Env }) {
  // Access secrets via env instead of process.env
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
}
```

## Issue 8: Debugging Steps

To get detailed error logs:

1. **View real-time logs**:

   ```bash
   # Get your deployment ID
   DEPLOYMENT_ID=$(wrangler pages deployment list --project-name omnichat | grep -E "Production.*master" | head -n 1 | grep -oE "https://[a-f0-9]{8}" | cut -d'/' -f3)

   # Tail the logs
   wrangler pages deployment tail $DEPLOYMENT_ID --project-name omnichat --format pretty
   ```

2. **Add more detailed logging** to your webhook:
   ```typescript
   } catch (err) {
     console.error('Webhook signature verification failed:', {
       error: err.message,
       stack: err.stack,
       signature: signature?.substring(0, 20) + '...',
       bodyLength: body?.length,
       webhookSecretExists: !!STRIPE_CONFIG.webhookSecret,
     });
     return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
   }
   ```

## Issue 9: Stripe CLI Testing

Test locally with Stripe CLI to ensure the webhook works:

```bash
# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger a test event
stripe trigger checkout.session.completed
```

## Issue 10: Edge Runtime Limitations

If all else fails, consider switching the webhook route to Node.js runtime:

```typescript
// Remove this line from your webhook route.ts
// export const runtime = 'edge';

// Or explicitly set to nodejs
export const runtime = 'nodejs';
```

## Immediate Action Items

1. **First, verify the webhook secret**:

   ```bash
   # Check if the secret is set in Cloudflare
   wrangler secret list
   ```

2. **Test with a minimal webhook** to isolate the issue:

   ```typescript
   export async function POST(req: NextRequest) {
     console.log('Webhook received');
     const body = await req.text();
     console.log('Body length:', body.length);
     const signature = req.headers.get('stripe-signature');
     console.log('Signature exists:', !!signature);
     return NextResponse.json({ received: true });
   }
   ```

3. **Check Cloudflare dashboard logs** for the actual error message

4. **Verify database structure** matches what the webhook expects

## Most Likely Cause

Based on your setup and common issues, the most likely causes are:

1. **Webhook secret mismatch** between test/live environments
2. **Database foreign key constraint** when userId doesn't exist
3. **Edge Runtime environment variable access** issues

Start with verifying the webhook secret matches exactly between Stripe and Cloudflare.
