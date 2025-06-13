# Stripe Test Keys Setup Guide

This guide will walk you through getting your Stripe test keys and setting up test products/prices.

## Step 1: Access Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in to your Stripe account

## Step 2: Switch to Test Mode

**IMPORTANT**: Make sure you're in TEST mode, not LIVE mode!

1. Look at the top-left of the Stripe dashboard
2. You'll see a toggle that says "Test mode" or "Live mode"
3. **Click to switch to "Test mode"** - it should show an orange "TEST" badge

## Step 3: Get Your Test API Keys

1. Click on **"Developers"** in the left sidebar
2. Click on **"API keys"**
3. You'll see two types of keys:

### Publishable Key (for client-side)

- Starts with `pk_test_`
- Safe to expose in frontend code
- Copy this for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Secret Key (for server-side)

- Starts with `sk_test_`
- **NEVER expose this publicly**
- You might need to click "Reveal test key" to see it
- Copy this for `STRIPE_SECRET_KEY`

## Step 4: Get Webhook Secret (Optional for now)

1. Still in Developers section, click **"Webhooks"**
2. Click **"Add endpoint"** (if you don't have one)
3. Enter your webhook URL: `https://omnichat-7pu.pages.dev/api/stripe/webhook`
4. Select events to listen to (at minimum: `checkout.session.completed`)
5. After creating, click on the webhook
6. Copy the **Signing secret** (starts with `whsec_`)
7. This goes in `STRIPE_WEBHOOK_SECRET`

## Step 5: Create Test Products and Prices

### Create Products

1. Go to **"Products"** in the left sidebar
2. Make sure you're still in **TEST mode** (orange badge)
3. Click **"Add product"**
4. Create these products:

#### Subscription Plans:

- **Starter Plan**
  - Name: "Starter Plan"
  - Description: "1,000 battery units per day"
- **Daily Plan**
  - Name: "Daily Plan"
  - Description: "5,000 battery units per day"
- **Power Plan**
  - Name: "Power Plan"
  - Description: "15,000 battery units per day"
- **Ultimate Plan**
  - Name: "Ultimate Plan"
  - Description: "50,000 battery units per day"

#### Battery Packs:

- **Battery Pack**
  - Name: "Battery Pack"
  - Description: "One-time battery unit purchase"

### Create Prices

For each subscription product, create TWO prices (monthly and annual):

1. Click on the product
2. Click **"Add price"**
3. Create prices according to this table:

| Product  | Type      | Billing | Amount  | Price ID Variable             |
| -------- | --------- | ------- | ------- | ----------------------------- |
| Starter  | Recurring | Monthly | $4.99   | STRIPE_PRICE_STARTER_MONTHLY  |
| Starter  | Recurring | Yearly  | $47.90  | STRIPE_PRICE_STARTER_ANNUAL   |
| Daily    | Recurring | Monthly | $9.99   | STRIPE_PRICE_DAILY_MONTHLY    |
| Daily    | Recurring | Yearly  | $95.90  | STRIPE_PRICE_DAILY_ANNUAL     |
| Power    | Recurring | Monthly | $24.99  | STRIPE_PRICE_POWER_MONTHLY    |
| Power    | Recurring | Yearly  | $239.90 | STRIPE_PRICE_POWER_ANNUAL     |
| Ultimate | Recurring | Monthly | $99.99  | STRIPE_PRICE_ULTIMATE_MONTHLY |
| Ultimate | Recurring | Yearly  | $959.90 | STRIPE_PRICE_ULTIMATE_ANNUAL  |

For Battery Pack, create ONE-TIME prices:

| Units  | Type     | Amount | Price ID Variable          |
| ------ | -------- | ------ | -------------------------- |
| 1,000  | One-time | $2.99  | STRIPE_PRICE_BATTERY_1000  |
| 5,000  | One-time | $9.99  | STRIPE_PRICE_BATTERY_5000  |
| 15,000 | One-time | $24.99 | STRIPE_PRICE_BATTERY_15000 |
| 50,000 | One-time | $74.99 | STRIPE_PRICE_BATTERY_50000 |

## Step 6: Copy Price IDs

After creating each price:

1. Click on the price
2. Copy the **Price ID** (starts with `price_`)
3. You'll need these for your environment variables

## Step 7: Update Cloudflare Pages Environment Variables

1. Go to your Cloudflare Pages dashboard
2. Select the `omnichat` project
3. Go to **Settings** → **Environment variables**
4. Update these variables with your TEST values:

```bash
# API Keys (TEST keys!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Price IDs (from test products)
STRIPE_PRICE_STARTER_MONTHLY=price_YOUR_TEST_ID
STRIPE_PRICE_STARTER_ANNUAL=price_YOUR_TEST_ID
STRIPE_PRICE_DAILY_MONTHLY=price_YOUR_TEST_ID
STRIPE_PRICE_DAILY_ANNUAL=price_YOUR_TEST_ID
STRIPE_PRICE_POWER_MONTHLY=price_YOUR_TEST_ID
STRIPE_PRICE_POWER_ANNUAL=price_YOUR_TEST_ID
STRIPE_PRICE_ULTIMATE_MONTHLY=price_YOUR_TEST_ID
STRIPE_PRICE_ULTIMATE_ANNUAL=price_YOUR_TEST_ID

# Battery prices
STRIPE_PRICE_BATTERY_1000=price_YOUR_TEST_ID
STRIPE_PRICE_BATTERY_5000=price_YOUR_TEST_ID
STRIPE_PRICE_BATTERY_15000=price_YOUR_TEST_ID
STRIPE_PRICE_BATTERY_50000=price_YOUR_TEST_ID
```

## Step 8: Test with Test Cards

When testing checkout, use these test card numbers:

- **Success**: 4242 4242 4242 4242
- **Requires auth**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

Use any future expiry date and any 3-digit CVC.

## Verification Checklist

- [ ] Stripe dashboard is in TEST mode (orange badge visible)
- [ ] Test publishable key starts with `pk_test_`
- [ ] Test secret key starts with `sk_test_`
- [ ] All products created in TEST mode
- [ ] All price IDs copied correctly
- [ ] Environment variables updated in Cloudflare Pages
- [ ] Triggered new deployment after updating env vars

## Common Issues

1. **"Invalid price" error**: Make sure the price ID exists in TEST mode
2. **"No such price" error**: You're using live price IDs with test keys
3. **Keys not working**: Ensure you're using test keys (pk*test*, sk*test*)

## Next Steps

1. Deploy your changes
2. Visit `/api/config` to verify the test publishable key is returned
3. Try a test purchase with card 4242 4242 4242 4242
4. Check Stripe dashboard (in test mode) to see the payment
