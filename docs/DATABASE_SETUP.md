# OmniChat Database Setup Guide

## Overview

OmniChat uses Cloudflare D1 (SQLite) for data persistence. This guide covers setting up the database schema for development and production environments.

## Prerequisites

- Cloudflare account with D1 database created
- Wrangler CLI installed (`npm install -g wrangler`)
- Database ID from Cloudflare dashboard

## Quick Setup

```bash
# For local development
./scripts/setup-database.sh --local

# For production
./scripts/setup-database.sh
```

## Manual Setup

If you prefer to set up manually or need to troubleshoot:

### 1. Set Database ID

```bash
export D1_DATABASE_ID=your-database-id-here
```

### 2. Run Migrations

```bash
# Local database
./scripts/migrate-simple.sh --local

# Production database
./scripts/migrate-simple.sh
```

## Database Schema

### Core Tables

#### users

- `id` (TEXT PRIMARY KEY) - Clerk user ID
- `email` (TEXT UNIQUE NOT NULL)
- `name` (TEXT)
- `avatarUrl` (TEXT)
- `stripeCustomerId` (TEXT) - Stripe customer ID
- `subscriptionStatus` (TEXT) - active, canceled, past_due, trialing, inactive, incomplete
- `subscriptionId` (TEXT) - Stripe subscription ID
- `tier` (TEXT) - free, paid
- `createdAt` (TEXT)
- `updatedAt` (TEXT)

#### conversations

- `id` (TEXT PRIMARY KEY)
- `userId` (TEXT) - Foreign key to users
- `title` (TEXT)
- `modelId` (TEXT) - AI model used
- `pinned` (BOOLEAN)
- `archived` (BOOLEAN)
- `lastMessageAt` (TEXT)
- `createdAt` (TEXT)
- `updatedAt` (TEXT)

#### messages

- `id` (TEXT PRIMARY KEY)
- `conversationId` (TEXT) - Foreign key to conversations
- `role` (TEXT) - user, assistant, system
- `content` (TEXT NOT NULL)
- `modelId` (TEXT)
- `metadata` (TEXT) - JSON field for attachments, etc.
- `createdAt` (TEXT)
- `updatedAt` (TEXT)

### Subscription & Billing Tables

#### subscription_plans

- `id` (TEXT PRIMARY KEY) - starter, daily, power, ultimate
- `name` (TEXT NOT NULL)
- `price_monthly` (INTEGER) - Price in cents
- `price_annual` (INTEGER) - Price in cents
- `battery_units` (INTEGER) - Total battery allocation
- `daily_battery` (INTEGER) - Daily battery allowance
- `features` (TEXT) - JSON array of features
- `stripe_price_id_monthly` (TEXT)
- `stripe_price_id_annual` (TEXT)

#### user_subscriptions

- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT) - Foreign key to users
- `plan_id` (TEXT) - Foreign key to subscription_plans
- `stripe_customer_id` (TEXT)
- `stripe_subscription_id` (TEXT)
- `status` (TEXT) - active, canceled, past_due, trialing, incomplete
- `current_period_start` (TEXT)
- `current_period_end` (TEXT)
- `cancel_at` (TEXT)
- `canceled_at` (TEXT)
- `trial_end` (TEXT)

#### user_battery

- `user_id` (TEXT PRIMARY KEY)
- `total_balance` (INTEGER) - Current battery balance
- `daily_allowance` (INTEGER) - Daily battery allowance
- `last_daily_reset` (TEXT) - Date of last reset

#### battery_transactions

- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT)
- `type` (TEXT) - purchase, subscription, bonus, refund, usage
- `amount` (INTEGER) - Positive for credits, negative for usage
- `balance_after` (INTEGER)
- `stripe_payment_intent_id` (TEXT)
- `metadata` (TEXT) - JSON

### Analytics Tables

#### api_usage

- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT)
- `conversation_id` (TEXT)
- `message_id` (TEXT)
- `model` (TEXT)
- `input_tokens` (INTEGER)
- `output_tokens` (INTEGER)
- `battery_used` (INTEGER)
- `cached` (BOOLEAN)
- `date` (TEXT) - For daily aggregation

#### daily_usage_summary

- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT)
- `date` (TEXT)
- `total_battery_used` (INTEGER)
- `total_messages` (INTEGER)
- `models_used` (TEXT) - JSON object

### Utility Tables

#### audit_logs

- `id` (TEXT PRIMARY KEY)
- `userId` (TEXT)
- `action` (TEXT)
- `resourceType` (TEXT)
- `resourceId` (TEXT)
- `metadata` (TEXT) - JSON
- `createdAt` (TEXT)

#### schema_version

- `version` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `applied_at` (INTEGER)
- `checksum` (TEXT)

## Stripe Webhook Integration

The database schema is designed to work seamlessly with Stripe webhooks:

1. **Customer Creation**: When a user signs up, create a Stripe customer and store the ID
2. **Subscription Updates**: Webhook events update the `user_subscriptions` table
3. **User Tier Updates**: The `tier` column in users table is automatically updated based on subscription status
4. **Battery Management**: Subscription changes trigger battery balance updates

## Migration Management

### Adding New Migrations

1. Create a new SQL file in `/migrations/` with format: `XXXX_description.sql`
2. Use sequential numbering (e.g., 0009, 0010)
3. Include IF NOT EXISTS clauses for safety
4. Test locally first: `./scripts/migrate-simple.sh --local`

### Migration Best Practices

- Always use `CREATE TABLE IF NOT EXISTS`
- Use `INSERT OR IGNORE` for seed data
- Include proper indexes for performance
- Add foreign key constraints where appropriate
- Test migrations both forward and backward

## Troubleshooting

### Common Issues

1. **"Table already exists" errors**

   - This is often safe to ignore if the table structure matches
   - Check with: `wrangler d1 execute omnichat-db --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='table_name';"`

2. **Missing migrations**

   - Check schema_version table: `wrangler d1 execute omnichat-db --command "SELECT * FROM schema_version ORDER BY version;"`
   - Re-run specific migration if needed

3. **Stripe webhook failures**
   - Ensure user exists before processing subscription events
   - Check that Clerk ID is properly set as user.id

### Verifying Database State

```bash
# List all tables
wrangler d1 execute omnichat-db --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check schema version
wrangler d1 execute omnichat-db --command "SELECT * FROM schema_version ORDER BY version DESC LIMIT 5;"

# Verify user subscription data
wrangler d1 execute omnichat-db --command "SELECT u.id, u.email, u.tier, us.status FROM users u LEFT JOIN user_subscriptions us ON u.id = us.user_id;"
```

## Environment Configuration

### Required Environment Variables

```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Database (for wrangler commands)
D1_DATABASE_ID=your-database-id

# Stripe (for webhook processing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Setting Secrets in Cloudflare

```bash
# Set Stripe keys
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Set Clerk keys
wrangler secret put CLERK_SECRET_KEY
```

## Production Deployment

1. Ensure all environment variables are set in Cloudflare dashboard
2. Run database setup: `./scripts/setup-database.sh`
3. Verify tables were created correctly
4. Deploy application: `wrangler pages deploy`
5. Test Stripe webhooks with Stripe CLI

## Backup and Recovery

### Creating Backups

```bash
# Export schema
wrangler d1 execute omnichat-db --command ".schema" > backup-schema.sql

# Export data (table by table)
wrangler d1 execute omnichat-db --command "SELECT * FROM users;" > backup-users.json
```

### Restoring from Backup

1. Create new database if needed
2. Run schema creation
3. Import data using wrangler d1 execute

## Security Considerations

- User IDs must match Clerk authentication IDs
- Stripe customer IDs should be validated before processing
- All monetary values stored in cents
- Sensitive data (like API keys) never stored in database
- Use prepared statements to prevent SQL injection
