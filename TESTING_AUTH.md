# Testing OmniChat API Authentication

## Overview

The OmniChat API uses two authentication methods:

1. **Clerk Authentication** - For web app endpoints (`/api/*`)
2. **JWT Authentication** - For V1 API endpoints (`/api/v1/*`)

## Testing Options

### Option 1: Deploy to Production (Recommended for Apple Sign In)

Apple Sign In requires:

- Valid Apple Developer account
- Configured App ID with Sign In with Apple capability
- Proper redirect URLs and domain verification
- Real Apple ID tokens

**To test in production:**

1. Deploy the API to Cloudflare Pages
2. Configure Apple Sign In in your Apple Developer account
3. Implement Apple Sign In in a client app
4. Use the real tokens with the validator

### Option 2: Add Development Mode Bypass (For Local Testing)

Add a development-only bypass to your Apple auth endpoint:

```typescript
// In /src/app/api/v1/auth/apple/route.ts
export async function POST(request: Request) {
  const { idToken, user } = await request.json();

  // Development mode bypass
  if (process.env.NODE_ENV === 'development' && idToken === 'dev-token-12345') {
    // Create a test user and return tokens
    const testUser = {
      id: 'dev_user_123',
      email: user?.email || 'dev@test.com',
      appleId: 'dev_apple_id',
    };

    const accessToken = await generateJWT(testUser);
    const refreshToken = await generateRefreshToken(testUser);

    return Response.json({
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: testUser,
    });
  }

  // Normal Apple verification flow...
}
```

Then test with:

```bash
# Get dev token
curl -X POST http://localhost:3000/api/v1/auth/apple \
  -H 'Content-Type: application/json' \
  -d '{"idToken": "dev-token-12345", "user": {"email": "dev@test.com"}}'

# Use the returned accessToken
./bin/omnichat-validator --bearer "YOUR_ACCESS_TOKEN"
```

### Option 3: Test with Clerk Authentication

For testing web app endpoints:

1. **Get Clerk Token:**

   - Log into the OmniChat web app
   - Open DevTools → Application → Cookies
   - Copy the `__session` cookie value

2. **Test with validator:**
   ```bash
   ./bin/omnichat-validator --clerk "YOUR_CLERK_TOKEN"
   ```

### Option 4: Create a Test Web Page

Create a simple HTML page with Apple Sign In:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Apple Sign In Test</title>
    <meta name="appleid-signin-client-id" content="YOUR_SERVICE_ID" />
    <meta name="appleid-signin-scope" content="name email" />
    <meta name="appleid-signin-redirect-uri" content="http://localhost:3000/auth/callback" />
    <meta name="appleid-signin-state" content="test" />
  </head>
  <body>
    <div id="appleid-signin-data" data-color="black" data-border="true" data-type="sign in"></div>
    <script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
    <script>
      document.addEventListener('AppleIDSignInOnSuccess', (event) => {
        // Send event.detail to your API
        console.log('Apple Sign In Success:', event.detail);

        fetch('http://localhost:3000/api/v1/auth/apple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: event.detail.authorization.id_token,
            user: event.detail.user,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log('API Response:', data);
            if (data.accessToken) {
              console.log('Use this token with the validator:');
              console.log(`./bin/omnichat-validator --bearer "${data.accessToken}"`);
            }
          });
      });
    </script>
  </body>
</html>
```

## Using the Test Helper Script

We've included a helper script to make testing easier:

```bash
cd go-cli
./test-auth-helper.sh
```

This provides options for:

1. Testing with development tokens
2. Instructions for real Apple Sign In
3. Instructions for getting Clerk tokens
4. Testing public endpoints only

## Validation Examples

### Test Everything (Both Auth Types)

```bash
./bin/omnichat-validator \
  --url https://omnichat-7pu.pages.dev \
  --clerk "CLERK_TOKEN" \
  --bearer "JWT_TOKEN"
```

### Test V1 API Only

```bash
./bin/omnichat-validator \
  --url https://omnichat-7pu.pages.dev \
  --bearer "JWT_TOKEN"
```

### Test Web App Endpoints Only

```bash
./bin/omnichat-validator \
  --url https://omnichat-7pu.pages.dev \
  --clerk "CLERK_TOKEN"
```

## Expected Results with Authentication

When properly authenticated, you should see:

- ✅ All authenticated endpoints returning 200/201 status codes
- ✅ Ability to create conversations, send messages, upload files
- ✅ Proper response structures matching the OpenAPI spec
- ✅ 100% endpoint coverage (43/43)

## Security Notes

- Never commit dev bypass code to production
- Always validate Apple ID tokens against Apple's public keys in production
- Use proper CORS and security headers
- Implement rate limiting for auth endpoints
