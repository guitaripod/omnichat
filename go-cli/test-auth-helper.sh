#!/bin/bash

echo "🔐 OmniChat Authentication Testing Helper"
echo "========================================"
echo ""
echo "This script helps you test the API with real authentication."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
API_URL="${API_URL:-http://localhost:3000}"
VALIDATOR_PATH="./bin/omnichat-validator"

echo -e "${BLUE}Current API URL:${NC} $API_URL"
echo ""

# Function to test with a dev token
test_dev_token() {
    echo -e "${YELLOW}Testing with development token...${NC}"
    echo "Note: This requires the API to have a dev mode bypass"
    echo ""
    
    # Try to authenticate with a dev token
    echo "Attempting to authenticate with dev token..."
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/apple" \
        -H "Content-Type: application/json" \
        -d '{"idToken": "dev-token", "user": {"email": "dev@test.com"}}')
    
    echo "Response: $RESPONSE"
    
    # Extract access token if successful
    ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$ACCESS_TOKEN" ]; then
        echo -e "${GREEN}✅ Got access token!${NC}"
        echo ""
        echo "Running validator with JWT token..."
        $VALIDATOR_PATH --url "$API_URL" --bearer "$ACCESS_TOKEN"
    else
        echo "❌ Failed to get access token. Dev mode may not be enabled."
    fi
}

# Function to test with a real Apple token
test_real_token() {
    echo -e "${YELLOW}To test with a real Apple ID token:${NC}"
    echo ""
    echo "1. You need a real Apple Sign In implementation"
    echo "2. Get the idToken from your Apple Sign In flow"
    echo "3. Run this command:"
    echo ""
    echo -e "${GREEN}# First, get a JWT token:${NC}"
    echo "curl -X POST $API_URL/api/v1/auth/apple \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"idToken\": \"YOUR_APPLE_ID_TOKEN\"}'"
    echo ""
    echo -e "${GREEN}# Then use the returned accessToken:${NC}"
    echo "$VALIDATOR_PATH --url $API_URL --bearer YOUR_JWT_TOKEN"
}

# Function to get Clerk token
get_clerk_token() {
    echo -e "${YELLOW}To get a Clerk token for testing web app endpoints:${NC}"
    echo ""
    echo "1. Open the OmniChat web app in your browser"
    echo "2. Log in with your account"
    echo "3. Open DevTools (F12) → Application → Cookies"
    echo "4. Find the '__session' cookie value"
    echo "5. Run:"
    echo ""
    echo -e "${GREEN}$VALIDATOR_PATH --url $API_URL --clerk YOUR_CLERK_TOKEN${NC}"
}

# Main menu
echo "What would you like to test?"
echo ""
echo "1) Test with development token (requires dev mode in API)"
echo "2) Instructions for real Apple Sign In testing"
echo "3) Instructions for Clerk token testing"
echo "4) Test public endpoints only"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        test_dev_token
        ;;
    2)
        test_real_token
        ;;
    3)
        get_clerk_token
        ;;
    4)
        echo "Testing public endpoints..."
        $VALIDATOR_PATH --url "$API_URL"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac