# Stripe Webhook Fix - Immediate Actions

## 🚨 Most Likely Issue: Webhook Secret Mismatch

Based on my analysis, the #1 cause of your 500 errors is likely a webhook secret mismatch. Here's what to do RIGHT NOW:

### Step 1: Verify Your Webhook Secret (2 minutes)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Copy the signing secret (starts with `whsec_`)
4. Run this command to update Cloudflare:
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET
   # Paste the EXACT secret from Stripe (including whsec_ prefix)
   ```

### Step 2: Deploy the Diagnostic Endpoint (5 minutes)

I've created a diagnostic endpoint that will tell us exactly what's wrong:

1. Deploy to Cloudflare:

   ```bash
   npm run pages:deploy
   ```

2. Test the diagnostic endpoint:

   ```bash
   # First, make the script executable (already done)
   # chmod +x test-webhook-diagnostic.sh

   # Run the diagnostic
   ./test-webhook-diagnostic.sh https://omnichat.pages.dev/api/stripe/webhook-test
   ```

3. Share the diagnostic output - it will show:
   - If the webhook secret is loaded
   - If WebCrypto is available
   - Database connection status
   - Exact error messages

### Step 3: Check Live Logs (2 minutes)

Get real-time logs from your webhook:

```bash
# Get latest deployment ID
DEPLOYMENT_ID=$(wrangler pages deployment list --project-name omnichat | grep -E "Production.*master" | head -n 1 | grep -oE "https://[a-f0-9]{8}" | cut -d'/' -f3)

# Tail the logs
wrangler pages deployment tail $DEPLOYMENT_ID --project-name omnichat --format pretty
```

Then trigger a test payment and watch the logs.

### Step 4: Quick Fix - Try the Improved Webhook

I've created an improved webhook handler at `/src/app/api/stripe/webhook/route-fixed.ts` with:

- Better error handling
- User existence validation
- More detailed logging
- Proper Edge Runtime configuration

To use it:

1. Backup current webhook: `mv src/app/api/stripe/webhook/route.ts src/app/api/stripe/webhook/route.backup.ts`
2. Use the fixed version: `mv src/app/api/stripe/webhook/route-fixed.ts src/app/api/stripe/webhook/route.ts`
3. Deploy: `npm run pages:deploy`

## 🔍 Other Common Issues Found

### Issue #2: User ID Mismatch

Your webhook expects `userId` in metadata, but the user might not exist in the database yet.

**Fix**: The improved webhook validates user existence before processing.

### Issue #3: Edge Runtime Environment Variables

The webhook uses both `STRIPE_CONFIG.webhookSecret` and `process.env.STRIPE_WEBHOOK_SECRET` inconsistently.

**Fix**: The improved webhook consistently uses `process.env.STRIPE_WEBHOOK_SECRET`.

### Issue #4: Database Foreign Key Constraints

The webhook tries to insert records with `userId` that might not exist.

**Fix**: The improved webhook checks if the user exists first.

## 📊 Test Checklist

- [ ] Webhook secret in Cloudflare matches Stripe Dashboard exactly
- [ ] Using the correct environment (test vs live) webhook secret
- [ ] Diagnostic endpoint deployed and tested
- [ ] Live logs show detailed error messages
- [ ] User exists in database before webhook fires
- [ ] Database has all required tables (user_subscriptions, user_battery, etc.)

## 🚀 If All Else Fails

1. **Switch to Node.js Runtime**: Remove `export const runtime = 'edge'` from the webhook
2. **Use Stripe CLI locally**: Test with `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. **Check Cloudflare Status**: Sometimes Cloudflare has issues with Edge Runtime

## 💡 Most Important

The webhook secret is the #1 issue in 90% of cases. Double-check:

- You're copying from the right webhook endpoint in Stripe
- You're in the right mode (test vs live)
- The secret includes the `whsec_` prefix
- No extra spaces or newlines when pasting

After updating the secret, wait 1-2 minutes for Cloudflare to propagate the change, then test again.
