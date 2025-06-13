# Stripe Integration Debug Guide

## Current Issue

The Stripe integration is failing with "Stripe not loaded" error. This is due to environment variables not being available at runtime in Cloudflare Pages.

## Solutions Implemented

### 1. Runtime Configuration API

Created `/api/config` endpoint that returns public configuration at runtime:

- `src/app/api/config/route.ts` - Returns public env vars
- `src/lib/client-config.ts` - Client-side config loader

### 2. Updated Stripe Initialization

Modified the pricing page to:

- Load Stripe SDK dynamically using runtime config
- Pre-load Stripe on component mount
- Show better error messages

### 3. Content Security Policy

Updated `next.config.ts` to allow Stripe domains:

- `js.stripe.com` for scripts
- `api.stripe.com` for API calls
- `hooks.stripe.com` for webhooks

### 4. Diagnostic Component

Added `StripeDiagnostic` component that checks:

- Environment variable availability
- Stripe SDK loading
- API endpoint health

## Setup Instructions

### Local Development

1. Copy `.dev.vars.example` to `.dev.vars`
2. Fill in your Stripe keys
3. Run with `wrangler pages dev` or `npm run preview`

### Cloudflare Pages Deployment

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to Settings > Environment variables
4. Add all required variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - All product and price IDs

### Required Environment Variables

```bash
# Public (client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_APP_URL=https://your-app.pages.dev

# Private (server-side)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Stripe Product IDs
STRIPE_PRODUCT_STARTER=prod_xxx
STRIPE_PRODUCT_DAILY=prod_xxx
STRIPE_PRODUCT_POWER=prod_xxx
STRIPE_PRODUCT_ULTIMATE=prod_xxx
STRIPE_PRODUCT_BATTERY_PACK=prod_xxx

# Stripe Price IDs (Monthly)
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_DAILY_MONTHLY=price_xxx
STRIPE_PRICE_POWER_MONTHLY=price_xxx
STRIPE_PRICE_ULTIMATE_MONTHLY=price_xxx

# Stripe Price IDs (Annual)
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_DAILY_ANNUAL=price_xxx
STRIPE_PRICE_POWER_ANNUAL=price_xxx
STRIPE_PRICE_ULTIMATE_ANNUAL=price_xxx

# Battery Pack Prices
STRIPE_PRICE_BATTERY_1000=price_xxx
STRIPE_PRICE_BATTERY_5000=price_xxx
STRIPE_PRICE_BATTERY_15000=price_xxx
STRIPE_PRICE_BATTERY_50000=price_xxx
```

## Debugging Steps

1. **Check Console Logs**

   - Look for `[Stripe Checkout]` prefixed logs
   - Check for `[Client Config]` logs
   - Review `[Diagnostic]` logs

2. **Use Diagnostic Component**

   - The pricing page shows diagnostic info in development
   - Check all three indicators are green

3. **Verify API Response**

   - Visit `/api/config` to see if env vars are returned
   - Check `/api/stripe/checkout` health with GET request

4. **Common Issues**
   - "Stripe not loaded" - Publishable key not set
   - "Invalid plan" - Price IDs not configured
   - "Unauthorized" - Not signed in with Clerk

## Testing Checklist

- [ ] Environment variables set in Cloudflare Pages
- [ ] CSP headers allow Stripe domains
- [ ] `/api/config` returns publishable key
- [ ] Stripe SDK loads without errors
- [ ] Checkout session creation works
- [ ] Redirect to Stripe checkout works

## Next Steps if Still Not Working

1. Check Cloudflare Pages build logs
2. Verify env vars are set BEFORE build starts
3. Use `wrangler pages deployment tail` to see runtime logs
4. Check browser network tab for blocked requests
5. Ensure Stripe products/prices exist in dashboard
