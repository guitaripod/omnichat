# OmniChat iOS API Documentation

## Overview

The OmniChat iOS API provides a JWT-based authentication system that supports Sign in with Apple and other auth providers, allowing iOS apps to interact with the OmniChat backend without Clerk dependencies.

## Base URL

- Local Development: `http://localhost:3000/api/v1`
- Production: `https://your-domain.com/api/v1`

## Authentication

All API endpoints (except auth endpoints) require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Sign in with Apple

**POST** `/auth/apple`

Authenticates a user using Apple Sign In.

**Request Body:**

```json
{
  "idToken": "apple_id_token",
  "authorizationCode": "optional_auth_code",
  "user": {
    "email": "user@icloud.com",
    "name": {
      "firstName": "First",
      "lastName": "Last"
    }
  }
}
```

**Response:**

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "user_id",
    "email": "user@icloud.com"
  }
}
```

#### Refresh Token

**POST** `/auth/refresh`

Refreshes an expired access token.

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**

```json
{
  "accessToken": "new_jwt_access_token",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "user_id",
    "email": "user@icloud.com"
  }
}
```

### Conversations

#### List Conversations

**GET** `/conversations`

Returns all conversations for the authenticated user.

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "conversations": [
    {
      "id": "conversation_id",
      "title": "Conversation Title",
      "model": "gpt-4o-mini",
      "isArchived": false,
      "createdAt": "2025-06-23T21:00:00Z",
      "updatedAt": "2025-06-23T21:00:00Z",
      "lastMessage": {
        "id": "message_id",
        "role": "assistant",
        "content": "Last message content",
        "createdAt": "2025-06-23T21:00:00Z"
      }
    }
  ]
}
```

#### Create Conversation

**POST** `/conversations`

Creates a new conversation.

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "title": "New Conversation",
  "model": "gpt-4o-mini"
}
```

**Response:**

```json
{
  "id": "conversation_id",
  "title": "New Conversation",
  "model": "gpt-4o-mini",
  "isArchived": false,
  "createdAt": "2025-06-23T21:00:00Z",
  "updatedAt": "2025-06-23T21:00:00Z"
}
```

## Error Responses

All endpoints return standard HTTP status codes and error messages:

```json
{
  "error": "Error message description"
}
```

Common status codes:

- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (invalid or expired token)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per minute per IP address. Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## Local Development

For local development, the API runs in a mock mode with in-memory storage when `NEXT_PUBLIC_DEV_MODE=true` is set.

### Testing with cURL

```bash
# Sign in with Apple (mock token for testing)
curl -X POST http://localhost:3000/api/v1/auth/apple \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "mock_apple_token",
    "user": {
      "email": "test@icloud.com",
      "name": {
        "firstName": "Test",
        "lastName": "User"
      }
    }
  }'

# List conversations
curl http://localhost:3000/api/v1/conversations \
  -H "Authorization: Bearer <access_token>"

# Create conversation
curl -X POST http://localhost:3000/api/v1/conversations \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Conversation",
    "model": "gpt-4o-mini"
  }'
```

## iOS Integration

### Swift Example

```swift
import Foundation

class OmniChatAPI {
    let baseURL = "https://your-domain.com/api/v1"
    var accessToken: String?
    var refreshToken: String?

    func signInWithApple(idToken: String, user: AppleUser?) async throws -> AuthResponse {
        let url = URL(string: "\(baseURL)/auth/apple")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = SignInRequest(
            idToken: idToken,
            user: user
        )

        request.httpBody = try JSONEncoder().encode(body)

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(AuthResponse.self, from: data)

        self.accessToken = response.accessToken
        self.refreshToken = response.refreshToken

        return response
    }

    func getConversations() async throws -> [Conversation] {
        guard let accessToken = accessToken else {
            throw APIError.notAuthenticated
        }

        let url = URL(string: "\(baseURL)/conversations")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(ConversationsResponse.self, from: data)

        return response.conversations
    }
}
```

## Future Endpoints

The following endpoints are planned for future implementation:

- **GET** `/conversations/{id}` - Get conversation details
- **DELETE** `/conversations/{id}` - Delete a conversation
- **GET** `/conversations/{id}/messages` - Get messages in a conversation
- **POST** `/conversations/{id}/messages` - Send a message (with streaming support)
- **POST** `/upload` - Upload files to R2
- **GET** `/user/profile` - Get user profile
- **GET** `/user/usage` - Get usage statistics

## Migration from Web App

This API is designed to work alongside the existing Clerk-authenticated web app. The same D1 database and R2 storage are used, ensuring data consistency across platforms.
