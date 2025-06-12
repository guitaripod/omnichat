# Stripe Setup Guide

This guide explains how to set up Stripe for the OmniChat billing system.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Have access to your Cloudflare Pages project

## Setup Steps

### 1. Create Products in Stripe

Go to https://dashboard.stripe.com/products and create the following products:

#### Subscription Products (Recurring billing)

1. **Starter Plan**

   - Name: `Starter`
   - Description: `200 battery units per day, perfect for 5-10 daily chats`
   - Monthly price: $4.99
   - Annual price: $47.90

2. **Daily Plan**

   - Name: `Daily`
   - Description: `600 battery units per day, great for 20-30 daily chats`
   - Monthly price: $12.99
   - Annual price: $124.70

3. **Power Plan**

   - Name: `Power`
   - Description: `1,500 battery units per day, ideal for professionals`
   - Monthly price: $29.99
   - Annual price: $287.90

4. **Ultimate Plan**
   - Name: `Ultimate`
   - Description: `5,000 battery units per day, for teams & heavy users`
   - Monthly price: $79.99
   - Annual price: $767.90

#### Battery Pack Products (One-time payments)

5. **1,000 Battery Units** - $1.49
6. **5,000 Battery Units** - $5.99
7. **15,000 Battery Units** - $14.99
8. **50,000 Battery Units** - $44.99

### 2. Set Environment Variables

#### Local Development (.env.local)

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Subscription Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_DAILY_MONTHLY=price_...
STRIPE_PRICE_DAILY_ANNUAL=price_...
STRIPE_PRICE_POWER_MONTHLY=price_...
STRIPE_PRICE_POWER_ANNUAL=price_...
STRIPE_PRICE_ULTIMATE_MONTHLY=price_...
STRIPE_PRICE_ULTIMATE_ANNUAL=price_...

# Battery Pack Price IDs
STRIPE_PRICE_BATTERY_1000=price_...
STRIPE_PRICE_BATTERY_5000=price_...
STRIPE_PRICE_BATTERY_15000=price_...
STRIPE_PRICE_BATTERY_50000=price_...
```

#### Production (Cloudflare Pages)

```bash
# Add publishable key
wrangler pages secret put NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --project-name omnichat

# Add secret key
wrangler pages secret put STRIPE_SECRET_KEY --project-name omnichat

# Add all price IDs
wrangler pages secret put STRIPE_PRICE_STARTER_MONTHLY --project-name omnichat
# ... repeat for all price IDs
```

### 3. Set Up Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.pages.dev/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret
6. Add it to Cloudflare:
   ```bash
   wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name omnichat
   ```

### 4. Apply Database Migrations

```bash
# Set your D1 database ID
export D1_DATABASE_ID=your-database-id

# Apply migrations
wrangler d1 migrations apply omnichat-db
```

## Testing

1. Use Stripe test mode for development
2. Test card numbers: https://stripe.com/docs/testing
3. Common test card: `4242 4242 4242 4242`

## Security Notes

- Never commit API keys or price IDs to version control
- Use environment variables for all sensitive data
- Keep your webhook endpoint secret
- Enable Stripe's security features (3D Secure, etc.)

## Troubleshooting

- **Webhook failures**: Check the webhook logs in Stripe dashboard
- **Price not found**: Ensure all price IDs are set in environment variables
- **Payment fails**: Check Stripe logs and ensure test mode is enabled for development
