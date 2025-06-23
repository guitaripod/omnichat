#!/usr/bin/env node

// Test script for the iOS API
// Usage: node test-api.js

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');

// Mock Apple ID token for testing
function createMockAppleIdToken(userId, email) {
  const payload = {
    iss: 'https://appleid.apple.com',
    aud: 'com.example.omnichat',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
    sub: userId || '001234.abcdef.567890', // Apple user ID
    email: email || 'test@icloud.com',
    email_verified: 'true',
    is_private_email: 'false',
  };

  // Sign with a test key (not secure, for testing only)
  return jwt.sign(payload, 'test-secret');
}

// Test functions
async function testAppleAuth() {
  console.log('🔐 Testing Apple Sign In...');

  const mockToken = createMockAppleIdToken();

  const response = await fetch('http://localhost:3000/api/v1/auth/apple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: mockToken,
      user: {
        email: 'test@icloud.com',
        name: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    }),
  });

  const data = await response.json();
  console.log('Response:', response.status, data);

  if (response.ok) {
    console.log('✅ Apple Sign In successful!');
    return data;
  } else {
    console.error('❌ Apple Sign In failed');
    return null;
  }
}

async function testRefreshToken(refreshToken) {
  console.log('\n🔄 Testing token refresh...');

  const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  const data = await response.json();
  console.log('Response:', response.status, data);

  if (response.ok) {
    console.log('✅ Token refresh successful!');
    return data;
  } else {
    console.error('❌ Token refresh failed');
    return null;
  }
}

async function testConversationsList(accessToken) {
  console.log('\n📋 Testing conversations list...');

  const response = await fetch('http://localhost:3000/api/v1/conversations', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  console.log('Response:', response.status, data);

  if (response.ok) {
    console.log('✅ Conversations list successful!');
    return data;
  } else {
    console.error('❌ Conversations list failed');
    return null;
  }
}

async function testCreateConversation(accessToken) {
  console.log('\n➕ Testing conversation creation...');

  const response = await fetch('http://localhost:3000/api/v1/conversations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Conversation from API',
      model: 'gpt-4o-mini',
    }),
  });

  const data = await response.json();
  console.log('Response:', response.status, data);

  if (response.ok) {
    console.log('✅ Conversation created successfully!');
    return data;
  } else {
    console.error('❌ Conversation creation failed');
    return null;
  }
}

// Main test flow
async function runTests() {
  console.log('🚀 Starting API tests...\n');

  try {
    // Test Apple Sign In
    const authData = await testAppleAuth();
    if (!authData) {
      console.error('Authentication failed, stopping tests');
      return;
    }

    const { accessToken, refreshToken } = authData;
    console.log('\n🎫 Access Token:', accessToken.substring(0, 50) + '...');
    console.log('🔑 Refresh Token:', refreshToken.substring(0, 50) + '...');

    // Test token refresh
    const refreshData = await testRefreshToken(refreshToken);
    const newAccessToken = refreshData?.accessToken || accessToken;

    // Test conversations API
    await testConversationsList(newAccessToken);
    await testCreateConversation(newAccessToken);

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test error:', error);
  }
}

// Run tests
runTests();
