# OmniChat API Documentation

## Overview

This directory contains the OpenAPI 3.0.3 specification for the OmniChat API. The specification describes all available endpoints, request/response schemas, authentication methods, and error responses.

## API Endpoints

### Authentication

- `POST /api/v1/auth/apple` - Apple Sign In
- `POST /api/v1/auth/refresh` - Refresh access token

### Chat

- `POST /api/chat` - Send messages to AI models (supports streaming)

### Conversations

- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `DELETE /api/conversations/{id}` - Delete conversation
- `GET /api/conversations/{id}/messages` - Get conversation messages
- `POST /api/conversations/{id}/messages` - Create message

### V1 API (JWT Authentication)

- `GET /api/v1/conversations` - List conversations with pagination
- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations/{id}` - Get conversation details
- `PATCH /api/v1/conversations/{id}` - Update conversation
- `DELETE /api/v1/conversations/{id}` - Delete conversation
- `GET /api/v1/conversations/{id}/messages` - Get messages with pagination
- `POST /api/v1/conversations/{id}/messages` - Create message

### User

- `GET /api/user/tier` - Get user subscription tier
- `GET /api/v1/user/profile` - Get user profile
- `PATCH /api/v1/user/profile` - Update user profile
- `GET /api/v1/user/usage` - Get usage statistics

### Files

- `POST /api/upload` - Upload file attachment
- `GET /api/upload?key={key}` - Download file
- `POST /api/v1/upload` - Upload file (V1 API)
- `GET /api/v1/files/{key}` - Download file (V1 API)

### Search

- `GET /api/search?q={query}` - Search conversations and messages

### Battery System

- `GET /api/battery` - Get battery balance and usage history

### Billing

- `POST /api/stripe/checkout` - Create Stripe checkout session
- `GET /api/stripe/checkout` - Get subscription status
- `POST /api/stripe/portal` - Create billing portal session

### Models

- `GET /api/models` - Get available AI models

## Authentication

The API supports two authentication methods:

1. **Clerk Authentication** (Bearer token) - Used for web app endpoints
2. **JWT Authentication** (Bearer token) - Used for V1 API endpoints

## Response Formats

- All endpoints return JSON responses
- Error responses include an `error` field with a descriptive message
- Successful responses vary by endpoint (see specification)

## Rate Limiting

V1 API endpoints include rate limiting. When rate limits are exceeded, a 429 status code is returned.

## Streaming Responses

The `/api/chat` endpoint supports streaming responses using Server-Sent Events (SSE) when `stream: true` is specified in the request.

## File Uploads

File uploads support the following:

- Maximum file size: 10MB
- Allowed types: images (JPEG, PNG, GIF, WebP), PDF, text files, Markdown, JSON, CSV
- Files are stored in Cloudflare R2

## Viewing the Documentation

You can view the API documentation using:

1. **Swagger UI**: Upload the `openapi.json` file to [Swagger Editor](https://editor.swagger.io/)
2. **ReDoc**: Use the ReDoc CLI or online viewer
3. **Postman**: Import the OpenAPI specification into Postman

## Validation

To validate the OpenAPI specification:

```bash
npx @redocly/cli lint openapi/openapi.json
```

## Updates

When adding new endpoints or modifying existing ones:

1. Update the `openapi.json` file
2. Run validation to ensure the specification is valid
3. Update this README if adding new endpoint categories
