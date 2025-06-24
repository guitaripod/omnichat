# OmniChat API Validator (Go)

A Go-based CLI tool for validating the OmniChat API endpoints.

## Features

- ✅ Tests public endpoints (no auth required)
- ✅ Tests authentication endpoints (Sign in with Apple)
- ✅ Tests authenticated endpoints (with bearer token)
- ✅ Validates response structures
- ✅ Colored terminal output
- ✅ Detailed error reporting with helpful hints
- ✅ Cross-platform support

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

### Basic Usage

```bash
# Test local development server (default: http://localhost:3000)
./bin/omnichat-validator

# Test with custom URL
./bin/omnichat-validator -url http://localhost:3002

# Test with authentication token
./bin/omnichat-validator -token "your-bearer-token"

# Test production API
./bin/omnichat-validator -url https://omnichat.app -token "your-token"
```

### Command-Line Options

```
-url string
    Base URL of the API (default "http://localhost:3000")

-token string
    Bearer token for authentication

-timeout duration
    Request timeout (default 30s)

-verbose
    Enable verbose output

-help
    Show help message
```

### Examples

```bash
# Test local server on different port
./bin/omnichat-validator -url http://localhost:3002

# Test with authentication
./bin/omnichat-validator -token "eyJhbGciOiJIUzI1NiIs..."

# Test with longer timeout
./bin/omnichat-validator -timeout 60s

# Test production API
./bin/omnichat-validator -url https://api.omnichat.app -token "prod-token"
```

## Output

The validator provides colored output showing:

```
🔍 Validating API at http://localhost:3000

📂 Testing Public Endpoints:

✅ GET /api/config (45ms)
   Config: Stripe=false, Clerk=false
✅ GET /api/openapi.json (12ms)
   OpenAPI Version: 3.0.3, Paths: 1
✅ GET /api/v1/docs (8ms)

🔐 Testing Authentication Endpoints:

❌ POST /api/v1/auth/apple (no body) (15ms)
   Error: HTTP 400: Bad Request
   💡 Expected: Requires {"idToken": "apple-jwt-token"}

🔒 Testing Authenticated Endpoints:

❌ GET /api/models (22ms)
   Error: HTTP 500: Internal Server Error
   💡 This endpoint requires authentication or dev mode setup

📈 Summary: 3 passed, 2 failed
```

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

## Comparison with TypeScript Version

This Go implementation provides the same functionality as the TypeScript version with:

- ✅ Better performance and smaller binary size
- ✅ No runtime dependencies
- ✅ Cross-platform standalone executables
- ✅ Structured error handling
- ✅ Concurrent request capability (can be added)

## Future Enhancements

- [ ] Add concurrent endpoint testing
- [ ] Add JSON/YAML output format options
- [ ] Add more comprehensive OpenAPI validation
- [ ] Add request/response logging option
- [ ] Add custom test configuration files
- [ ] Add performance benchmarking mode
