import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniChat API v1 Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background: #1a1a1a;
      color: white;
      padding: 2rem 0;
      margin-bottom: 2rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { opacity: 0.8; font-size: 1.1rem; }
    .content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 {
      color: #1a1a1a;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
    }
    h3 {
      color: #333;
      margin: 1.5rem 0 0.5rem;
    }
    h4 {
      color: #666;
      margin: 1rem 0 0.5rem;
    }
    pre {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    code {
      font-family: 'Courier New', monospace;
      background: #f0f0f0;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre code {
      background: none;
      padding: 0;
    }
    .endpoint {
      background: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 1rem;
      margin: 1rem 0;
    }
    .method {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-weight: bold;
      font-size: 0.85rem;
      margin-right: 0.5rem;
    }
    .method.get { background: #28a745; color: white; }
    .method.post { background: #007bff; color: white; }
    .method.patch { background: #ffc107; color: #333; }
    .method.delete { background: #dc3545; color: white; }
    .path {
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
    .params {
      background: #f0f0f0;
      padding: 1rem;
      border-radius: 4px;
      margin: 0.5rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f8f8;
      font-weight: 600;
    }
    .nav {
      position: sticky;
      top: 20px;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    .nav ul {
      list-style: none;
    }
    .nav a {
      color: #007bff;
      text-decoration: none;
      display: block;
      padding: 0.25rem 0;
    }
    .nav a:hover {
      text-decoration: underline;
    }
    .nav > ul > li {
      font-weight: bold;
      margin-top: 0.5rem;
    }
    .nav > ul > li:first-child {
      margin-top: 0;
    }
    .nav ul ul {
      margin-left: 1rem;
      font-weight: normal;
    }
    @media (min-width: 1024px) {
      .main-content {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 2rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>OmniChat API v1</h1>
      <p class="subtitle">RESTful API for client applications</p>
    </div>
  </header>

  <div class="container">
    <div class="main-content">
      <nav class="nav">
        <ul>
          <li><a href="#overview">Overview</a></li>
          <li><a href="#authentication">Authentication</a>
            <ul>
              <li><a href="#auth-apple">Sign in with Apple</a></li>
              <li><a href="#auth-refresh">Refresh Token</a></li>
            </ul>
          </li>
          <li><a href="#conversations">Conversations</a>
            <ul>
              <li><a href="#conv-list">List Conversations</a></li>
              <li><a href="#conv-create">Create Conversation</a></li>
              <li><a href="#conv-get">Get Conversation</a></li>
              <li><a href="#conv-update">Update Conversation</a></li>
              <li><a href="#conv-delete">Delete Conversation</a></li>
            </ul>
          </li>
          <li><a href="#messages">Messages</a>
            <ul>
              <li><a href="#msg-list">List Messages</a></li>
              <li><a href="#msg-send">Send Message</a></li>
            </ul>
          </li>
          <li><a href="#files">Files</a>
            <ul>
              <li><a href="#file-upload">Upload File</a></li>
              <li><a href="#file-get">Get File</a></li>
              <li><a href="#file-delete">Delete File</a></li>
            </ul>
          </li>
          <li><a href="#user">User</a>
            <ul>
              <li><a href="#user-profile">Get Profile</a></li>
              <li><a href="#user-update">Update Profile</a></li>
              <li><a href="#user-usage">Usage Statistics</a></li>
            </ul>
          </li>
          <li><a href="#errors">Error Handling</a></li>
          <li><a href="#rate-limiting">Rate Limiting</a></li>
        </ul>
      </nav>

      <div class="content">
        <h2 id="overview">Overview</h2>
        <p>The OmniChat API v1 provides a JWT-based authentication system that supports Sign in with Apple and other auth providers, allowing any client application to interact with the OmniChat backend without Clerk dependencies.</p>
        
        <h3>Base URL</h3>
        <pre><code>Production: https://omnichat-7pu.pages.dev/api/v1</code></pre>

        <h3>Authentication</h3>
        <p>All API endpoints (except auth endpoints) require a Bearer token in the Authorization header:</p>
        <pre><code>Authorization: Bearer &lt;access_token&gt;</code></pre>

        <h2 id="authentication">Authentication Endpoints</h2>

        <div id="auth-apple" class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/auth/apple</span></h3>
          <p>Authenticates a user using Apple Sign In.</p>
          
          <h4>Request Body</h4>
          <pre><code>{
  "idToken": "apple_id_token",
  "user": {
    "email": "user@icloud.com",
    "name": {
      "firstName": "First",
      "lastName": "Last"
    }
  }
}</code></pre>

          <h4>Response</h4>
          <pre><code>{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "user_id",
    "email": "user@icloud.com"
  }
}</code></pre>
        </div>

        <div id="auth-refresh" class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/auth/refresh</span></h3>
          <p>Refreshes an expired access token using a refresh token.</p>
          
          <h4>Request Body</h4>
          <pre><code>{
  "refreshToken": "jwt_refresh_token"
}</code></pre>

          <h4>Response</h4>
          <pre><code>{
  "accessToken": "new_jwt_access_token",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "user_id",
    "email": "user@icloud.com"
  }
}</code></pre>
        </div>

        <h2 id="conversations">Conversation Endpoints</h2>

        <div id="conv-list" class="endpoint">
          <h3><span class="method get">GET</span> <span class="path">/conversations</span></h3>
          <p>Returns all conversations for the authenticated user.</p>
          
          <h4>Headers</h4>
          <pre><code>Authorization: Bearer &lt;access_token&gt;</code></pre>

          <h4>Response</h4>
          <pre><code>{
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
}</code></pre>
        </div>

        <div id="conv-create" class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/conversations</span></h3>
          <p>Creates a new conversation.</p>
          
          <h4>Request Body</h4>
          <pre><code>{
  "title": "New Conversation",
  "model": "gpt-4o-mini"
}</code></pre>

          <h4>Response</h4>
          <pre><code>{
  "id": "conversation_id",
  "title": "New Conversation",
  "model": "gpt-4o-mini",
  "isArchived": false,
  "createdAt": "2025-06-23T21:00:00Z",
  "updatedAt": "2025-06-23T21:00:00Z"
}</code></pre>
        </div>

        <div id="conv-get" class="endpoint">
          <h3><span class="method get">GET</span> <span class="path">/conversations/{id}</span></h3>
          <p>Gets detailed information about a specific conversation.</p>
          
          <h4>Response</h4>
          <pre><code>{
  "id": "conversation_id",
  "title": "Conversation Title",
  "model": "gpt-4o-mini",
  "isArchived": false,
  "createdAt": "2025-06-23T21:00:00Z",
  "updatedAt": "2025-06-23T21:00:00Z",
  "messageCount": 42,
  "lastMessage": {
    "id": "message_id",
    "role": "assistant",
    "content": "Last message content",
    "createdAt": "2025-06-23T21:00:00Z"
  }
}</code></pre>
        </div>

        <div id="conv-update" class="endpoint">
          <h3><span class="method patch">PATCH</span> <span class="path">/conversations/{id}</span></h3>
          <p>Updates a conversation's title or archive status.</p>
          
          <h4>Request Body</h4>
          <pre><code>{
  "title": "Updated Title",
  "isArchived": true
}</code></pre>
        </div>

        <div id="conv-delete" class="endpoint">
          <h3><span class="method delete">DELETE</span> <span class="path">/conversations/{id}</span></h3>
          <p>Deletes a conversation and all its messages.</p>
          
          <h4>Response</h4>
          <pre><code>{
  "success": true
}</code></pre>
        </div>

        <h2 id="messages">Message Endpoints</h2>

        <div id="msg-list" class="endpoint">
          <h3><span class="method get">GET</span> <span class="path">/conversations/{id}/messages</span></h3>
          <p>Gets messages in a conversation with pagination support.</p>
          
          <h4>Query Parameters</h4>
          <table>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>limit</td>
              <td>number</td>
              <td>50</td>
              <td>Number of messages to return</td>
            </tr>
            <tr>
              <td>offset</td>
              <td>number</td>
              <td>0</td>
              <td>Number of messages to skip</td>
            </tr>
            <tr>
              <td>order</td>
              <td>string</td>
              <td>asc</td>
              <td>Sort order: 'asc' or 'desc'</td>
            </tr>
          </table>

          <h4>Response</h4>
          <pre><code>{
  "messages": [
    {
      "id": "message_id",
      "conversationId": "conversation_id",
      "role": "user",
      "content": "Hello!",
      "createdAt": "2025-06-23T21:00:00Z",
      "attachments": []
    }
  ],
  "total": 100,
  "hasMore": true
}</code></pre>
        </div>

        <div id="msg-send" class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/conversations/{id}/messages</span></h3>
          <p>Sends a message and receives an AI response. Supports streaming.</p>
          
          <h4>Request Body</h4>
          <pre><code>{
  "content": "User message text",
  "attachmentIds": ["attachment_id"],
  "stream": true
}</code></pre>

          <h4>Response (Non-streaming)</h4>
          <pre><code>{
  "id": "message_id",
  "conversationId": "conversation_id",
  "role": "assistant",
  "content": "AI response",
  "model": "gpt-4o-mini",
  "createdAt": "2025-06-23T21:00:00Z"
}</code></pre>

          <h4>Response (Streaming)</h4>
          <p>Returns Server-Sent Events stream:</p>
          <pre><code>data: {"id":"msg_id","type":"message_start","content":""}
data: {"id":"msg_id","type":"content_chunk","content":"Hello"}
data: {"id":"msg_id","type":"content_chunk","content":" there!"}
data: {"id":"msg_id","type":"message_complete","content":"Hello there!"}
data: [DONE]</code></pre>
        </div>

        <h2 id="files">File Endpoints</h2>

        <div id="file-upload" class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/upload</span></h3>
          <p>Uploads a file to R2 storage.</p>
          
          <h4>Request (multipart/form-data)</h4>
          <table>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>file</td>
              <td>File</td>
              <td>The file to upload (max 10MB)</td>
            </tr>
            <tr>
              <td>conversationId</td>
              <td>string</td>
              <td>ID of the conversation</td>
            </tr>
            <tr>
              <td>messageId</td>
              <td>string</td>
              <td>Optional message ID to attach to</td>
            </tr>
          </table>

          <h4>Response</h4>
          <pre><code>{
  "id": "attachment_id",
  "url": "/api/v1/files/user_id/conv_id/msg_id/file_id.png",
  "fileName": "image.png",
  "fileType": "image/png",
  "fileSize": 123456,
  "key": "user_id/conv_id/msg_id/file_id.png"
}</code></pre>
        </div>

        <div id="file-get" class="endpoint">
          <h3><span class="method get">GET</span> <span class="path">/files/{...key}</span></h3>
          <p>Retrieves a file from R2 storage.</p>
          
          <h4>Response</h4>
          <p>Returns the file with appropriate content-type headers.</p>
        </div>

        <div id="file-delete" class="endpoint">
          <h3><span class="method delete">DELETE</span> <span class="path">/files/{...key}</span></h3>
          <p>Deletes a file from R2 storage.</p>
        </div>

        <h2 id="user">User Endpoints</h2>

        <div id="user-profile" class="endpoint">
          <h3><span class="method get">GET</span> <span class="path">/user/profile</span></h3>
          <p>Gets the authenticated user's profile information.</p>
          
          <h4>Response</h4>
          <pre><code>{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "imageUrl": "https://example.com/avatar.jpg",
  "tier": "paid",
  "createdAt": "2025-01-01T00:00:00Z",
  "subscription": {
    "id": "sub_id",
    "planName": "Pro",
    "status": "active",
    "currentPeriodEnd": "2025-07-01T00:00:00Z",
    "features": ["unlimited_messages", "priority_support"]
  },
  "battery": {
    "totalBalance": 5000,
    "dailyAllowance": 1000,
    "lastDailyReset": "2025-06-23"
  }
}</code></pre>
        </div>

        <div id="user-update" class="endpoint">
          <h3><span class="method patch">PATCH</span> <span class="path">/user/profile</span></h3>
          <p>Updates the user's profile information.</p>
          
          <h4>Request Body</h4>
          <pre><code>{
  "name": "Jane Doe",
  "imageUrl": "https://example.com/new-avatar.jpg"
}</code></pre>
        </div>

        <div id="user-usage" class="endpoint">
          <h3><span class="method get">GET</span> <span class="path">/user/usage</span></h3>
          <p>Gets detailed usage statistics for the authenticated user.</p>
          
          <h4>Query Parameters</h4>
          <table>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>period</td>
              <td>string</td>
              <td>30d</td>
              <td>Time period: 7d, 30d, 90d, or all</td>
            </tr>
            <tr>
              <td>startDate</td>
              <td>string</td>
              <td>-</td>
              <td>Custom start date (ISO format)</td>
            </tr>
            <tr>
              <td>endDate</td>
              <td>string</td>
              <td>-</td>
              <td>Custom end date (ISO format)</td>
            </tr>
          </table>

          <h4>Response</h4>
          <pre><code>{
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
        "claude-3.5-sonnet": 5
      }
    }
  ],
  "modelBreakdown": [
    {
      "model": "gpt-4o-mini",
      "messageCount": 300,
      "percentage": 66.7
    }
  ],
  "recentTransactions": [
    {
      "id": "trans_id",
      "type": "usage",
      "amount": -50,
      "balanceAfter": 4950,
      "description": "Message generation",
      "createdAt": "2025-06-23T21:00:00Z"
    }
  ]
}</code></pre>
        </div>

        <h2 id="errors">Error Handling</h2>
        <p>All endpoints return standard HTTP status codes and error messages:</p>
        
        <pre><code>{
  "error": "Error message description"
}</code></pre>

        <h3>Common Status Codes</h3>
        <table>
          <tr>
            <th>Code</th>
            <th>Description</th>
          </tr>
          <tr>
            <td>200</td>
            <td>Success</td>
          </tr>
          <tr>
            <td>400</td>
            <td>Bad Request - Missing or invalid parameters</td>
          </tr>
          <tr>
            <td>401</td>
            <td>Unauthorized - Invalid or expired token</td>
          </tr>
          <tr>
            <td>403</td>
            <td>Forbidden - Access denied</td>
          </tr>
          <tr>
            <td>404</td>
            <td>Not Found - Resource doesn't exist</td>
          </tr>
          <tr>
            <td>429</td>
            <td>Too Many Requests - Rate limited</td>
          </tr>
          <tr>
            <td>500</td>
            <td>Internal Server Error</td>
          </tr>
        </table>

        <h2 id="rate-limiting">Rate Limiting</h2>
        <p>API requests are rate limited to prevent abuse. Rate limit information is included in response headers:</p>
        
        <table>
          <tr>
            <th>Header</th>
            <th>Description</th>
          </tr>
          <tr>
            <td>X-RateLimit-Limit</td>
            <td>Maximum requests allowed in window</td>
          </tr>
          <tr>
            <td>X-RateLimit-Remaining</td>
            <td>Requests remaining in current window</td>
          </tr>
          <tr>
            <td>X-RateLimit-Reset</td>
            <td>Time when the rate limit resets (ISO format)</td>
          </tr>
        </table>

        <h3>Default Limits</h3>
        <ul>
          <li>General endpoints: 100 requests per minute</li>
          <li>File uploads: 20 requests per minute</li>
          <li>Message sending: 50 requests per minute</li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>`;

// GET /api/v1/docs - Serve API documentation
export async function GET(_request: NextRequest) {
  return new NextResponse(API_DOCS_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
