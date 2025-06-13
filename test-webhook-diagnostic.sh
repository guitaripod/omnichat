#!/bin/bash

# Test Webhook Diagnostic Script
# This script helps diagnose Stripe webhook issues

echo "🔍 Stripe Webhook Diagnostic Tool"
echo "================================="

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./test-webhook-diagnostic.sh <webhook-url>"
    echo "Example: ./test-webhook-diagnostic.sh https://omnichat.pages.dev/api/stripe/webhook-test"
    exit 1
fi

WEBHOOK_URL="$1"

echo ""
echo "Testing webhook at: $WEBHOOK_URL"
echo ""

# First, test if the endpoint is accessible
echo "1️⃣ Testing endpoint accessibility..."
curl -s -X GET "$WEBHOOK_URL" | jq .

echo ""
echo "2️⃣ Testing POST without Stripe headers..."
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}')
echo "$RESPONSE" | jq .

echo ""
echo "3️⃣ Testing with Stripe CLI (if available)..."
if command -v stripe &> /dev/null; then
    echo "Stripe CLI found. You can test the actual webhook with:"
    echo ""
    echo "# Forward to your test endpoint:"
    echo "stripe listen --forward-to $WEBHOOK_URL"
    echo ""
    echo "# Then trigger a test event:"
    echo "stripe trigger checkout.session.completed"
else
    echo "Stripe CLI not found. Install it for better testing:"
    echo "https://stripe.com/docs/stripe-cli"
fi

echo ""
echo "4️⃣ Testing with mock Stripe payload..."
# Create a mock payload
MOCK_PAYLOAD='{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2025-05-28.basil",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "cs_test_123",
      "object": "checkout.session",
      "metadata": {
        "userId": "test_user_123"
      }
    }
  },
  "type": "checkout.session.completed"
}'

# Send with mock signature (will fail verification but show diagnostics)
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=mock_signature_for_testing" \
  -d "$MOCK_PAYLOAD")

echo "$RESPONSE" | jq .

echo ""
echo "5️⃣ Manual verification steps:"
echo "   a) Check Cloudflare dashboard for detailed logs"
echo "   b) Verify STRIPE_WEBHOOK_SECRET is set in Cloudflare"
echo "   c) Ensure webhook secret matches between Stripe and Cloudflare"
echo "   d) Check if you're using test vs live webhook secrets"
echo ""
echo "✅ Diagnostic complete!"