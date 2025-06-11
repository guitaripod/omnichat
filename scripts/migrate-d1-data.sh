#!/bin/bash

# D1 Data Migration Script
# Updates existing messages with default values for streaming fields

echo "🔄 Starting D1 data migration..."
echo ""
echo "⚠️  Note: This script requires you to have configured your database in the Cloudflare dashboard"
echo "   and authenticated wrangler with your account."
echo ""

# Get the database ID from environment or prompt
if [ -z "$D1_DATABASE_ID" ]; then
  echo "Please provide your D1 database ID (from Cloudflare dashboard):"
  read -r DATABASE_ID
else
  DATABASE_ID=$D1_DATABASE_ID
fi

# Update messages with default streaming field values
echo "📝 Updating messages table with default streaming fields..."

wrangler d1 execute $DATABASE_ID --command "
  UPDATE messages 
  SET 
    is_complete = CASE 
      WHEN is_complete IS NULL THEN 1 
      ELSE is_complete 
    END,
    tokens_generated = CASE 
      WHEN tokens_generated IS NULL THEN 0 
      ELSE tokens_generated 
    END
  WHERE is_complete IS NULL OR tokens_generated IS NULL;
"

# Check how many rows were affected
echo "🔍 Checking migration results..."

wrangler d1 execute $DATABASE_ID --command "
  SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN is_complete IS NULL THEN 1 ELSE 0 END) as null_is_complete,
    SUM(CASE WHEN tokens_generated IS NULL THEN 1 ELSE 0 END) as null_tokens_generated
  FROM messages;
"

echo "✅ D1 data migration completed!"
echo ""
echo "⚠️  Note: If you see any NULL counts above, run this script again."