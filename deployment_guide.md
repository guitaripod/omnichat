Deploy to Production

# 1. Merge to master

git checkout master
git pull origin master
git merge feature/ios-api
git push origin master

# 2. Wait for Cloudflare Pages to deploy (usually 1-3 minutes)

# You can check deployment status at: https://dash.cloudflare.com

# 3. Run database migrations to create the new tables

export D1_DATABASE_ID=your-production-database-id # Get from Cloudflare dashboard
npm run db:migrate:prod

Verify Deployment

Once deployed, test that your API is live:

# Check API documentation

curl https://omnichat.pages.dev/api/v1/docs

# Test auth endpoint (will fail but confirms it's live)

curl -X POST https://omnichat.pages.dev/api/v1/auth/apple \
 -H "Content-Type: application/json" \
 -d '{"idToken": "invalid", "user": {"email": "test@icloud.com"}}'

iOS App Configuration

In your iOS app:
struct APIConfig {
static let baseURL = "https://omnichat.pages.dev/api/v1"
static let clientID = "com.yourcompany.omnichat" // Your Apple Client ID
}

API Endpoints for iOS

Your live endpoints will be:

- Auth: POST https://omnichat.pages.dev/api/v1/auth/apple
- Conversations: GET/POST https://omnichat.pages.dev/api/v1/conversations
- Messages: POST https://omnichat.pages.dev/api/v1/conversations/{id}/messages
- Docs: https://omnichat.pages.dev/api/v1/docs

That's it! Your API will be live at https://omnichat.pages.dev/api/v1 once the deployment completes.
