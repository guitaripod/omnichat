#!/bin/bash

# Development Environment Reset Script
# Clears all data for a fresh start

echo "🧹 Resetting OmniChat development environment..."
echo ""
echo "⚠️  This will delete ALL data including:"
echo "   - All conversations"
echo "   - All messages" 
echo "   - All attachments"
echo "   - All user data"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 1
fi

# Database name (not ID)
DATABASE_NAME="omnichat-db"

echo ""
echo "1️⃣ Clearing browser data..."
echo "   ⚠️  IMPORTANT: You must manually clear your browser's local storage!"
echo ""
echo "   Option A - Clear all site data (recommended):"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application tab"
echo "   3. Click 'Clear site data' button"
echo ""
echo "   Option B - Clear specific storage:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application tab > Storage"
echo "   3. Clear Local Storage (all items)"
echo "   4. Clear IndexedDB (if present)"
echo ""
read -p "Press any key when browser data is cleared..." -n 1 -r
echo ""
echo ""

echo "2️⃣ Truncating D1 database tables..."

# Function to execute D1 command and suppress errors for non-existent tables
execute_d1_command() {
    local command=$1
    local description=$2
    echo "   - $description"
    wrangler d1 execute $DATABASE_NAME --remote --command "$command" 2>&1 | grep -v "no such table" || true
}

# Truncate all tables in reverse dependency order
execute_d1_command "DELETE FROM attachments;" "Clearing attachments"
execute_d1_command "DELETE FROM api_usage;" "Clearing API usage"
execute_d1_command "DELETE FROM daily_usage_summary;" "Clearing usage summaries"
execute_d1_command "DELETE FROM messages;" "Clearing messages"
execute_d1_command "DELETE FROM audit_logs;" "Clearing audit logs"
execute_d1_command "DELETE FROM conversations;" "Clearing conversations"
execute_d1_command "DELETE FROM battery_transactions;" "Clearing battery transactions"
execute_d1_command "DELETE FROM user_battery;" "Clearing user battery"
execute_d1_command "DELETE FROM user_subscriptions;" "Clearing user subscriptions"
execute_d1_command "DELETE FROM users;" "Clearing users"
# Note: We keep schema_version and subscription_plans tables

echo ""
echo "3️⃣ Verifying cleanup..."
wrangler d1 execute $DATABASE_NAME --remote --command "SELECT 'messages' as table_name, COUNT(*) as count FROM messages UNION ALL SELECT 'conversations', COUNT(*) FROM conversations;" 2>&1 | grep -E "(count|messages|conversations)" || echo "   Database is empty"

echo ""
echo "✅ Development environment reset complete!"
echo ""
echo "Next steps:"
echo "1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)"
echo "2. You should see a fresh OmniChat with no conversations"
echo "3. All new conversations will work with the updated schema"
echo ""
echo "If you still see old conversations:"
echo "- Make sure you cleared browser storage (Step 1)"
echo "- Try using incognito/private mode"
echo "- Or try a different browser"