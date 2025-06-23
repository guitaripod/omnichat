# OmniChat API v1 Documentation

## Overview

The OmniChat API v1 provides a JWT-based authentication system that supports Sign in with Apple (with Google and other providers coming soon), allowing iOS and Android apps to interact with the OmniChat backend independently of the web application's Clerk authentication.

## Live Documentation

Interactive API documentation is available at: `https://omnichat.pages.dev/api/v1/docs`

## Base URL

Production: `https://omnichat.pages.dev/api/v1`

## Authentication

All API endpoints (except authentication endpoints) require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 30 days
- Use the refresh endpoint to get a new access token before expiration
- Store tokens securely in your app's keychain (iOS) or encrypted preferences (Android)

## Endpoints

### Authentication

#### Sign in with Apple

**POST** `/auth/apple`

Authenticates a user using Apple Sign In. Creates a new user account if one doesn't exist.

**Request Body:**
```json
{
  "idToken": "apple_id_token_from_apple_signin",
  "user": {
    "email": "user@icloud.com",
    "name": {
      "firstName": "First",
      "lastName": "Last"
    }
  }
}
```

**Notes:**
- The `user` object is only required on first sign-in when Apple provides user details
- The `idToken` is verified against Apple's public keys
- If the email already exists, the Apple account will be linked to the existing user

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "user_nanoid",
    "email": "user@icloud.com"
  }
}
```

#### Refresh Token

**POST** `/auth/refresh`

Refreshes an expired access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:**
```json
{
  "accessToken": "new_access_token",
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

Returns all conversations for the authenticated user, sorted by most recently updated.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_nanoid",
      "title": "Conversation about AI",
      "model": "gpt-4o-mini",
      "isArchived": false,
      "createdAt": "2025-06-23T21:00:00Z",
      "updatedAt": "2025-06-23T21:30:00Z",
      "lastMessage": {
        "id": "msg_nanoid",
        "role": "assistant",
        "content": "I'd be happy to explain AI concepts...",
        "createdAt": "2025-06-23T21:30:00Z"
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

**Available Models:**
- `gpt-4o-mini` - OpenAI GPT-4 Optimized Mini
- `gpt-4o` - OpenAI GPT-4 Optimized
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet
- `claude-3-5-haiku-20241022` - Claude 3.5 Haiku
- `gemini-2.0-flash-exp` - Google Gemini 2.0 Flash
- `llama-3.1-sonar-huge-128k-online` - Perplexity Llama 3.1

**Response:**
```json
{
  "id": "conv_new_nanoid",
  "title": "New Conversation",
  "model": "gpt-4o-mini",
  "isArchived": false,
  "createdAt": "2025-06-23T22:00:00Z",
  "updatedAt": "2025-06-23T22:00:00Z"
}
```

#### Get Conversation Details

**GET** `/conversations/{id}`

Gets detailed information about a specific conversation.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "conv_nanoid",
  "title": "Conversation about AI",
  "model": "gpt-4o-mini",
  "isArchived": false,
  "createdAt": "2025-06-23T21:00:00Z",
  "updatedAt": "2025-06-23T21:30:00Z",
  "messageCount": 42,
  "lastMessage": {
    "id": "msg_nanoid",
    "role": "assistant",
    "content": "I'd be happy to explain AI concepts...",
    "createdAt": "2025-06-23T21:30:00Z"
  }
}
```

#### Update Conversation

**PATCH** `/conversations/{id}`

Updates a conversation's title or archive status.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "title": "Updated Conversation Title",
  "isArchived": true
}
```

**Response:**
```json
{
  "id": "conv_nanoid",
  "title": "Updated Conversation Title",
  "isArchived": true,
  "updatedAt": "2025-06-23T22:00:00Z"
}
```

#### Delete Conversation

**DELETE** `/conversations/{id}`

Permanently deletes a conversation and all its messages.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true
}
```

### Messages

#### List Messages

**GET** `/conversations/{id}/messages`

Gets messages in a conversation with pagination support.

**Headers:**
- `Authorization: Bearer <access_token>`

**Query Parameters:**
- `limit` (number, default: 50): Number of messages to return
- `offset` (number, default: 0): Number of messages to skip
- `order` (string, default: 'asc'): Sort order - 'asc' or 'desc'

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_nanoid_1",
      "conversationId": "conv_nanoid",
      "role": "user",
      "content": "What is artificial intelligence?",
      "createdAt": "2025-06-23T21:00:00Z",
      "attachments": []
    },
    {
      "id": "msg_nanoid_2",
      "conversationId": "conv_nanoid",
      "role": "assistant",
      "content": "Artificial intelligence (AI) refers to...",
      "model": "gpt-4o-mini",
      "createdAt": "2025-06-23T21:00:05Z",
      "attachments": []
    }
  ],
  "total": 42,
  "hasMore": false
}
```

#### Send Message

**POST** `/conversations/{id}/messages`

Sends a message to a conversation and receives an AI response. Supports both streaming and non-streaming responses.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "content": "What is quantum computing?",
  "attachmentIds": ["attachment_id_1"],
  "stream": true
}
```

**Parameters:**
- `content` (required): The message text
- `attachmentIds` (optional): Array of attachment IDs to include with the message
- `stream` (optional, default: true): Whether to stream the response

**Response (Non-streaming):**
```json
{
  "id": "msg_nanoid_3",
  "conversationId": "conv_nanoid",
  "role": "assistant",
  "content": "Quantum computing is a revolutionary approach to computation...",
  "model": "gpt-4o-mini",
  "createdAt": "2025-06-23T21:01:00Z"
}
```

**Response (Streaming):**
Returns a Server-Sent Events (SSE) stream with the following event types:

```
data: {"id":"msg_nanoid_3","type":"message_start","content":""}

data: {"id":"msg_nanoid_3","type":"content_chunk","content":"Quantum"}

data: {"id":"msg_nanoid_3","type":"content_chunk","content":" computing"}

data: {"id":"msg_nanoid_3","type":"content_chunk","content":" is"}

data: {"id":"msg_nanoid_3","type":"message_complete","content":"Quantum computing is a revolutionary approach..."}

data: [DONE]
```

### File Management

#### Upload File

**POST** `/upload`

Uploads a file to R2 storage. Files are automatically associated with conversations and optionally with messages.

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Request Body (multipart/form-data):**
- `file` (required): The file to upload (max 10MB)
- `conversationId` (required): ID of the conversation
- `messageId` (optional): ID of the message to attach to

**Allowed File Types:**
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `text/plain`, `text/markdown`
- Data: `application/json`, `application/xml`

**Response:**
```json
{
  "id": "attachment_nanoid",
  "url": "/api/v1/files/user_id/conv_id/msg_id/file_id.png",
  "fileName": "screenshot.png",
  "fileType": "image/png",
  "fileSize": 245632,
  "key": "user_id/conv_id/msg_id/file_id.png"
}
```

#### Get File

**GET** `/files/{...key}`

Retrieves a file from R2 storage. Only the file owner can access their files.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
Returns the file with appropriate content-type headers and a 1-hour cache directive.

#### Delete File

**DELETE** `/files/{...key}`

Deletes a file from R2 storage.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true
}
```

### User Management

#### Get User Profile

**GET** `/user/profile`

Gets the authenticated user's profile information, including subscription and battery balance.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "id": "user_nanoid",
  "email": "user@example.com",
  "name": "John Doe",
  "imageUrl": "https://example.com/avatar.jpg",
  "tier": "paid",
  "createdAt": "2025-01-01T00:00:00Z",
  "subscription": {
    "id": "sub_nanoid",
    "planId": "plan_pro",
    "planName": "Pro",
    "status": "active",
    "currentPeriodEnd": "2025-07-01T00:00:00Z",
    "billingInterval": "monthly",
    "features": [
      "unlimited_messages",
      "priority_support",
      "advanced_models"
    ]
  },
  "battery": {
    "totalBalance": 5000,
    "dailyAllowance": 1000,
    "lastDailyReset": "2025-06-23"
  }
}
```

#### Update User Profile

**PATCH** `/user/profile`

Updates the user's profile information.

**Headers:**
- `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "imageUrl": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": "user_nanoid",
  "name": "Jane Doe",
  "imageUrl": "https://example.com/new-avatar.jpg",
  "updatedAt": "2025-06-23T22:00:00Z"
}
```

#### Get Usage Statistics

**GET** `/user/usage`

Gets detailed usage statistics for the authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>`

**Query Parameters:**
- `period` (string, default: '30d'): Time period - '7d', '30d', '90d', or 'all'
- `startDate` (string, optional): Custom start date in ISO format
- `endDate` (string, optional): Custom end date in ISO format

**Response:**
```json
{
  "period": {
    "start": "2025-05-24T00:00:00Z",
    "end": "2025-06-23T23:59:59Z"
  },
  "summary": {
    "totalBatteryUsed": 15000,
    "totalMessages": 450,
    "totalConversations": 25,
    "totalUserMessages": 225,
    "averageDailyUsage": 500
  },
  "dailyUsage": [
    {
      "date": "2025-06-23",
      "batteryUsed": 750,
      "messages": 20,
      "models": {
        "gpt-4o-mini": 15,
        "claude-3-5-sonnet-20241022": 5
      }
    }
  ],
  "modelBreakdown": [
    {
      "model": "gpt-4o-mini",
      "messageCount": 300,
      "percentage": 66.7
    },
    {
      "model": "claude-3-5-sonnet-20241022",
      "messageCount": 150,
      "percentage": 33.3
    }
  ],
  "recentTransactions": [
    {
      "id": "trans_nanoid",
      "type": "usage",
      "amount": -50,
      "balanceAfter": 4950,
      "description": "Message generation - GPT-4o Mini",
      "createdAt": "2025-06-23T21:00:00Z"
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Descriptive error message"
}
```

### Common Status Codes

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (invalid or expired token)
- `403` - Forbidden (access denied to resource)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse. Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: ISO timestamp when the rate limit resets

### Default Limits

- General endpoints: 100 requests per minute per IP
- File uploads: 20 requests per minute per IP
- Message sending: 50 requests per minute per user

## WebSocket Support (Coming Soon)

Real-time features will be available via WebSocket connections:
- Live message streaming
- Conversation updates
- Presence indicators
- Typing indicators

## SDK Support

Official SDKs are planned for:
- Swift (iOS/macOS)
- Kotlin (Android)
- React Native
- Flutter

## Security Best Practices

1. **Token Storage**
   - iOS: Use Keychain Services
   - Android: Use Android Keystore or encrypted SharedPreferences
   - Never store tokens in plain text

2. **Certificate Pinning**
   - Implement certificate pinning in production apps
   - Validate SSL certificates

3. **Request Signing**
   - Consider implementing request signing for additional security
   - Use HMAC-SHA256 with a shared secret

## Migration Notes

This API is designed to work alongside the existing Clerk-authenticated web application. Both systems share the same:
- D1 database
- R2 storage
- AI model integrations
- Billing and subscription system

Users can seamlessly switch between web and mobile apps with their data synchronized.

## Changelog

### v1.0.0 (2025-06-23)
- Initial release
- Apple Sign In authentication
- Conversation and message management
- File upload/download
- User profile and usage statistics
- Streaming AI responses

### Planned Features
- Google Sign In
- Push notifications
- Voice message support
- Offline sync
- Conversation sharing
- Export functionality