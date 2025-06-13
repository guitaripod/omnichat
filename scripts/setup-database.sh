#!/bin/bash
# Database setup script - run this manually when setting up a new environment

set -e

echo "🔧 OmniChat Database Setup"
echo "========================="
echo ""
echo "This script will set up your database with all required tables."
echo ""

# Check if running locally or remotely
if [ "$1" = "--local" ]; then
    REMOTE_FLAG=""
    echo "📍 Running on LOCAL database"
else
    REMOTE_FLAG="--remote"
    echo "☁️  Running on REMOTE database"
fi

DB_NAME="omnichat-db"

# Function to check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo "❌ wrangler CLI not found"
        echo "Please install with: npm install -g wrangler"
        exit 1
    fi
}

# Function to run a command and show status
run_command() {
    local description=$1
    local command=$2
    
    echo -n "→ $description... "
    if output=$(eval "$command" 2>&1); then
        echo "✅"
        return 0
    else
        echo "❌"
        echo "  Error: $output"
        return 1
    fi
}

# Check prerequisites
check_wrangler

echo ""
echo "📋 Starting database setup..."
echo ""

# Run migrations
echo "🔨 Applying migrations..."
bash scripts/migrate-simple.sh $1

echo ""
echo "📊 Verifying database setup..."

# Check if tables exist
TABLES=$(wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>&1 || true)

if echo "$TABLES" | grep -q "users" && echo "$TABLES" | grep -q "conversations" && echo "$TABLES" | grep -q "messages"; then
    echo "✅ Core tables verified"
else
    echo "❌ Core tables missing. Please check the migration output above."
    exit 1
fi

# Show summary
echo ""
echo "✅ Database setup complete!"
echo ""
echo "Tables created:"
echo "$TABLES" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/  - /'

echo ""
echo "Next steps:"
echo "  1. Set up your environment variables (see docs/DATABASE_SETUP.md)"
echo "  2. Configure Stripe webhook endpoints:"
echo "     - Local: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "     - Production: Add https://your-domain.com/api/stripe/webhook to Stripe dashboard"
echo "  3. Run 'npm run dev' to start development"

# Additional verification for Stripe-related tables
echo ""
echo "🔍 Verifying Stripe integration tables..."

STRIPE_TABLES=$(wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --command "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('user_subscriptions', 'subscription_plans', 'battery_transactions', 'user_battery');" 2>&1 || true)

if echo "$STRIPE_TABLES" | grep -q '"count":4'; then
    echo "✅ All Stripe-related tables verified"
    
    # Check if subscription plans are populated
    PLANS=$(wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --command "SELECT COUNT(*) as count FROM subscription_plans;" 2>&1 || true)
    if echo "$PLANS" | grep -q '"count":4'; then
        echo "✅ Subscription plans populated"
    else
        echo "⚠️  Subscription plans table is empty. This should have been populated by migrations."
    fi
else
    echo "⚠️  Some Stripe-related tables are missing. Please check the migration output above."
fi