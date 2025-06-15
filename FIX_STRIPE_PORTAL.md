# Fix Stripe Customer Portal Error

The error "No configuration provided and your test mode default configuration has not been set" means Stripe Customer Portal needs a default configuration.

## Quick Fix Steps:

### Option 1: Via Stripe Dashboard (Easiest)

1. **Go to Stripe Dashboard Customer Portal Settings**

   - Test mode: https://dashboard.stripe.com/test/settings/billing/portal
   - Live mode: https://dashboard.stripe.com/settings/billing/portal

2. **Check if Portal is Enabled**

   - Look for "Customer portal" toggle - it should be ON
   - If OFF, turn it ON

3. **Look for Existing Configurations**

   - You should see a list of configurations
   - One should be marked as "Default"
   - If none are default, click on a configuration and select "Set as default"

4. **If No Configurations Exist**
   - Click "Create configuration"
   - Enable these features:
     - Customer information updates
     - Payment method updates
     - Invoice history
     - Subscription cancellations
     - Subscription updates
   - Set return URL to: `https://omnichat-7pu.pages.dev/chat`
   - Save and set as default

### Option 2: Via Script

1. **Set your Stripe key**

   ```bash
   export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   ```

2. **Run the setup script**

   ```bash
   node scripts/setup-stripe-portal.mjs
   ```

3. **Follow the output instructions to set as default**

### Option 3: Via API (Manual)

1. **Create configuration**

   ```bash
   curl -X POST https://api.stripe.com/v1/billing_portal/configurations \
     -u sk_test_YOUR_KEY_HERE: \
     -d "features[customer_update][enabled]=true" \
     -d "features[invoice_history][enabled]=true" \
     -d "features[payment_method_update][enabled]=true" \
     -d "features[subscription_cancel][enabled]=true" \
     -d "features[subscription_update][enabled]=true" \
     -d "default_return_url=https://omnichat-7pu.pages.dev/chat"
   ```

2. **Copy the configuration ID from response (starts with bpc\_)**

3. **Set it as default**
   ```bash
   curl -X POST https://api.stripe.com/v1/billing_portal/configurations/bpc_YOUR_CONFIG_ID \
     -u sk_test_YOUR_KEY_HERE: \
     -d "is_default=true"
   ```

## Verify It's Working

1. Try accessing the portal again in your app
2. Check browser console - error should be gone
3. You should be redirected to Stripe's portal page

## Still Not Working?

If you still see the error after setting a default configuration:

1. **Clear browser cache** and try again
2. **Check Stripe API version** - make sure it's recent
3. **Verify customer exists** - the user must have completed checkout before accessing portal
4. **Check logs** for more details:
   ```bash
   wrangler pages deployment tail YOUR_DEPLOYMENT_ID --project-name omnichat --format pretty
   ```

## Common Issues

- **"No such customer"**: User hasn't completed checkout yet
- **"Invalid API Key"**: Wrong environment (test vs live) or invalid key
- **Portal loads but empty**: Customer has no subscriptions
