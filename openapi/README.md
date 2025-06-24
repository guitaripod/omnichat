# OmniChat OpenAPI Implementation

## Overview

This directory contains the OpenAPI specification for the OmniChat API.

## Current Status

- ✅ Basic OpenAPI spec created (v3.0.3)
- ✅ `/api/models` endpoint documented
- ✅ Go-based API validator CLI tool created
- ✅ `/api/openapi.json` endpoint serves the spec
- 🔄 Additional endpoints to be documented

## Files

- `openapi.json` - The OpenAPI specification

## Usage

### View the OpenAPI spec

```bash
# Local
curl http://localhost:3000/api/openapi.json

# Production
curl https://omnichat.app/api/openapi.json
```

### Validate API

Use the Go CLI validator located in `/go-cli`:

```bash
# Build the validator
cd go-cli
make build

# Validate local API
./bin/omnichat-validator

# Validate production API (requires auth token)
./bin/omnichat-validator -url https://omnichat.app -token "your-bearer-token"
```

## Next Steps

1. Add Zod schemas for request/response validation
2. Use `zod-to-openapi` to auto-generate spec from schemas
3. Add validation middleware to API routes
4. Document remaining endpoints
5. Generate Swift client from OpenAPI spec
