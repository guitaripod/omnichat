#!/bin/bash

# Pre-deployment script
# Runs all necessary checks before deployment

set -e  # Exit on error

echo "🚀 Running pre-deployment checks..."
echo ""

# 1. Check Node.js version
echo "1️⃣ Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js version: $NODE_VERSION"

# 2. Install dependencies
echo ""
echo "2️⃣ Installing dependencies..."
npm ci

# 3. Run type checking
echo ""
echo "3️⃣ Running TypeScript type check..."
npm run typecheck

# 4. Run linting
echo ""
echo "4️⃣ Running linter..."
npm run lint

# 5. Run tests
echo ""
echo "5️⃣ Running tests..."
npm test -- --passWithNoTests

# 6. Check migrations
echo ""
echo "6️⃣ Checking D1 migrations..."
node scripts/check-migrations.mjs

# 7. Build the project
echo ""
echo "7️⃣ Building project..."
npm run build

echo ""
echo "✅ All pre-deployment checks passed!"
echo ""
echo "Ready to deploy with:"
echo "  wrangler deploy"
echo ""
echo "Or if you have unapplied migrations:"
echo "  wrangler d1 migrations apply omnichat-db"
echo "  ./scripts/migrate-d1-data.sh  # If data migration needed"
echo "  wrangler deploy"