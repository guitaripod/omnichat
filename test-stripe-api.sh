#!/bin/bash

echo "=== Testing Stripe API Endpoints ==="
echo

URL="https://omnichat-7pu.pages.dev"

echo "1. Testing /api/config endpoint..."
curl -s "$URL/api/config" | jq '.'
echo

echo "2. Testing /api/stripe/debug endpoint..."
curl -s "$URL/api/stripe/debug" | jq '.'
echo

echo "=== Summary ==="
echo "Check if stripe.publishableKey is present in the config response"
echo "The debug endpoint will only work in development mode"