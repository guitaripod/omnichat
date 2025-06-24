# OmniChat API Validator (Go)

A comprehensive Go-based CLI tool for validating **all 43 endpoints** of the OmniChat API, including both Clerk-authenticated web app endpoints and JWT-authenticated V1 API endpoints.

## Features

- ✅ Tests all 43 API endpoints across 10 categories
- ✅ Supports both Clerk and JWT authentication
- ✅ Clear categorized output with color coding
- ✅ Shows which endpoints require authentication
- ✅ Provides helpful error messages and next steps
- ✅ Tests multipart file uploads
- ✅ Validates response structures
- ✅ Shows endpoint coverage statistics
- ✅ Cross-platform support

## Endpoint Coverage

The validator tests all endpoints organized by category:

### Public Endpoints (3)

- `GET /api/config` - App configuration
- `GET /api/openapi.json` - OpenAPI specification
- `GET /api/v1/docs` - API documentation

### Authentication Endpoints (2)

- `POST /api/v1/auth/apple` - Apple Sign In
- `POST /api/v1/auth/refresh` - Token refresh

### Clerk Auth Endpoints (14)

- **Chat & AI**: Chat interactions, AI models
- **Conversations**: List, create, delete
- **Messages**: Get, create messages
- **Files**: Upload, download files
- **Search**: Search conversations
- **Battery**: Usage tracking
- **User**: Get tier information
- **Billing**: Checkout, subscriptions, portal

### JWT Auth Endpoints (24)

- **Conversations V1**: Full CRUD operations
- **Messages V1**: Get, create with pagination
- **User Profile V1**: Profile, usage statistics
- **Files V1**: Upload, download with auth

## Installation

### From Source

```bash
# Clone the repository
cd go-cli

# Install dependencies
make deps

# Build the binary
make build

# Install to $GOPATH/bin (optional)
make install
```

### Pre-built Binaries

Build for multiple platforms:

```bash
make build-all
```

This creates binaries for:

- Linux (amd64)
- macOS (amd64, arm64)
- Windows (amd64)

## Usage

### Basic Testing (No Authentication)

```bash
# Test local development server (default: http://localhost:3000)
./bin/omnichat-validator

# Test with custom URL
./bin/omnichat-validator --url http://localhost:3002
```

Output shows:

- Public endpoints (should pass)
- Auth endpoints with mock data (expect 400/401)
- Protected endpoints (expect 401)

### Testing with Clerk Authentication

```bash
# Get Clerk token from web app (inspect network requests)
./bin/omnichat-validator --clerk "your-clerk-session-token"
```

This enables testing of:

- All web app endpoints (/api/\*)
- Chat, conversations, messages
- File uploads, search
- Battery status, billing

### Testing with JWT Authentication

```bash
# First get a JWT token via Apple Sign In
# Then test V1 API endpoints
./bin/omnichat-validator --bearer "your-jwt-token"
```

This enables testing of:

- All V1 API endpoints (/api/v1/\*)
- CRUD operations on conversations
- Message creation with streaming
- User profile and usage stats

### Full Testing (Both Auth Types)

```bash
# Test all endpoints with both auth types
./bin/omnichat-validator \
  --clerk "clerk-token" \
  --bearer "jwt-token" \
  --verbose
```

### Testing Production API

```bash
# Test against production
./bin/omnichat-validator \
  --url https://omnichat-7pu.pages.dev \
  --bearer "production-jwt-token"
```

### Command-Line Options

```
--url string
    Base URL of the API (default "http://localhost:3000")

--clerk string
    Clerk session token for web app endpoints

--bearer string
    JWT Bearer token for V1 API endpoints

--token string
    Bearer token (deprecated, use --clerk or --bearer)

--timeout duration
    Request timeout (default 30s)

--verbose
    Enable verbose output

--help
    Show help message
```

## Output Format

The validator provides color-coded output:

```
🚀 OmniChat API Validator
📍 Testing 43 endpoints across 10 categories
────────────────────────────────────────────────────────────

🔍 Validating OmniChat API at http://localhost:3000
🔐 Authentication: No authentication

📂 Testing Public Endpoints:

✅ GET /api/config (23ms)
✅ GET /api/openapi.json (5ms)
✅ GET /api/v1/docs (3ms)

🔐 Testing Authentication Endpoints:

❌ POST /api/v1/auth/apple (12ms)
   Error: HTTP 400: Bad Request
   💡 Expected: Requires valid Apple ID token

🔒 Testing Clerk Auth Endpoints:

💬 Chat & AI:
⚠️  POST /api/chat (8ms)
   Error: HTTP 401: Unauthorized
   🔑 Requires Clerk authentication. Use --clerk flag

📊 Test Summary:

By Category:
  Public              Total:  3 | Passed: 3 | Failed: 0
  Authentication      Total:  2 | Passed: 0 | Failed: 2
  Chat & AI           Total:  2 | Passed: 0 | Failed: 2 | Auth Required: 2
  ...

Overall: Total: 43 | Passed: 3 | Failed: 40 | Auth Required: 38
Endpoint Coverage: 43/43 (100.0%)

💡 To test authenticated endpoints:
   1. Get a Clerk token from the web app session
   2. Get a JWT token via: POST /api/v1/auth/apple
   3. Run: omnichat-validator --clerk CLERK_TOKEN --bearer JWT_TOKEN
```

## Getting Authentication Tokens

### Clerk Token (Web App)

1. Log into the OmniChat web app
2. Open browser DevTools (F12)
3. Go to Application/Storage > Cookies
4. Find the `__session` cookie value
5. Use this as your Clerk token

### JWT Token (V1 API)

1. Implement Apple Sign In in your app
2. Call `POST /api/v1/auth/apple` with Apple ID token
3. Use the returned `accessToken` as your JWT token
4. Refresh before expiration (15 minutes)

## Development

### Project Structure

```
go-cli/
├── cmd/
│   └── omnichat-validator/
│       └── main.go          # Entry point
├── internal/
│   ├── client/
│   │   └── client.go        # HTTP client
│   ├── validator/
│   │   └── validator.go     # Validation logic
│   └── types/
│       └── types.go         # Type definitions
├── pkg/
│   └── colors/
│       └── colors.go        # Terminal colors
├── Makefile                 # Build automation
├── go.mod                   # Go module file
└── README.md               # This file
```

### Running Tests

```bash
make test
```

### Code Quality

```bash
# Format code
make fmt

# Run go vet
make vet

# Run linter (requires golangci-lint)
make lint
```

### Building

```bash
# Build for current platform
make build

# Build for all platforms
make build-all

# Clean build artifacts
make clean
```

## Mock Data

The validator uses realistic mock data for testing:

- **Chat requests**: Test messages with model selection
- **Conversations**: Create with title and model
- **Files**: Multipart upload simulation
- **User updates**: Profile modifications
- **Billing**: Checkout session creation

## Exit Codes

- `0`: All accessible tests passed
- `1`: Some tests failed (excluding auth failures)

## Validation

To validate the OpenAPI specification itself:

```bash
npx @redocly/cli lint ../openapi/openapi.json
```

## Future Enhancements

- [ ] Streaming response validation
- [ ] Rate limit testing
- [ ] Performance benchmarking
- [ ] Response time analytics
- [ ] Automated token retrieval
- [ ] CI/CD integration
- [ ] Custom test configuration files
