# Stripe Configuration Guide for OmniChat

## Fixing the Billing Portal Error

The error "No configuration provided and your test mode default configuration has not been set" occurs because the Stripe Customer Portal needs to be configured in your Stripe Dashboard.

### Steps to Configure Stripe Customer Portal:

1. **Go to Stripe Dashboard**

   - For test mode: https://dashboard.stripe.com/test/settings/billing/portal
   - For live mode: https://dashboard.stripe.com/settings/billing/portal

2. **Enable the Customer Portal**

   - Toggle "Enable customer portal" to ON

3. **Configure Portal Settings**

   - **Branding**: Add your business name and logo
   - **Products**: Select which products customers can update/cancel
   - **Subscriptions**: Enable customers to:
     - Cancel subscriptions
     - Switch plans
     - Update quantities
     - View invoices
   - **Billing**: Allow customers to:
     - Update payment methods
     - View billing history
     - Download invoices

4. **Save Configuration**
   - Click "Save" at the top of the page

### Required Environment Variables

Ensure these are set in Cloudflare:

```bash
# Required for basic functionality
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook endpoint secret

# Required for checkout (get from Stripe Dashboard > Products)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_DAILY_MONTHLY=price_...
STRIPE_PRICE_DAILY_ANNUAL=price_...
STRIPE_PRICE_POWER_MONTHLY=price_...
STRIPE_PRICE_POWER_ANNUAL=price_...
STRIPE_PRICE_ULTIMATE_MONTHLY=price_...
STRIPE_PRICE_ULTIMATE_ANNUAL=price_...

# Battery pack prices
STRIPE_PRICE_BATTERY_1000=price_...
STRIPE_PRICE_BATTERY_5000=price_...
STRIPE_PRICE_BATTERY_15000=price_...
STRIPE_PRICE_BATTERY_50000=price_...

# App URL
NEXT_PUBLIC_APP_URL=https://omnichat-7pu.pages.dev
```

### Setting Environment Variables in Cloudflare

```bash
# Set each variable
wrangler secret put STRIPE_SECRET_KEY
# Enter the value when prompted

# Verify it was set
wrangler secret list
```

### Testing Your Configuration

1. **Test Portal Access**

   - Sign in to your app
   - Subscribe to a plan
   - Click "Manage Subscription"
   - Should redirect to Stripe's customer portal

2. **Check Logs**

   ```bash
   # Get latest deployment ID
   DEPLOYMENT_ID=$(wrangler pages deployment list --project-name omnichat | grep -E "Production.*master" | head -n 1 | grep -oE "https://[a-f0-9]{8}" | cut -d'/' -f3)

   # Tail logs
   wrangler pages deployment tail $DEPLOYMENT_ID --project-name omnichat --format pretty
   ```

### Common Issues

1. **"No such customer" error**

   - User doesn't have a stripeCustomerId in database
   - User needs to complete checkout first

2. **"Missing Stripe configuration" error**

   - STRIPE_SECRET_KEY not set in environment
   - Check with: `wrangler secret list`

3. **Portal loads but shows no subscriptions**
   - Customer has no active subscriptions
   - Check Stripe Dashboard > Customers

## Usage Tracking Fix

The usage tracking error has been fixed in the code. The issue was that new users didn't have battery records initialized. The fix:

1. **Auto-creates battery records** when missing
2. **Sets default values** (0 balance, 0 daily allowance)
3. **Prevents 500 errors** for new users

This fix is already committed and deployed.
