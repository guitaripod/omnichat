import '@testing-library/jest-dom';
import { beforeAll, afterAll, vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Setup global mocks if needed
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };

  // Mock global types for Cloudflare Workers
  global.D1Database = {} as any;
  global.KVNamespace = {} as any;
  global.R2Bucket = {} as any;
});

afterAll(() => {
  // Cleanup
  vi.restoreAllMocks();
});

// Database setup helper for integration tests
export async function setupTestDatabase(db: D1Database) {
  // Run migrations for test database
  const migrationSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      clerk_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      tier TEXT DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      api_usage INTEGER DEFAULT 0,
      api_limit INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      model TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
  `;

  const statements = migrationSQL.split(';').filter((stmt) => stmt.trim());

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

// Helper to clear test database
export async function clearTestDatabase(db: D1Database) {
  await db.prepare('DELETE FROM messages').run();
  await db.prepare('DELETE FROM conversations').run();
  await db.prepare('DELETE FROM users').run();
}

// Mock data generators
export function createMockUser(overrides = {}) {
  return {
    id: `user_${Math.random().toString(36).substring(7)}`,
    clerk_id: `clerk_${Math.random().toString(36).substring(7)}`,
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    tier: 'free',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    api_usage: 0,
    api_limit: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockConversation(userId: string, overrides = {}) {
  return {
    id: `conv_${Math.random().toString(36).substring(7)}`,
    user_id: userId,
    title: 'Test Conversation',
    model: 'gpt-4o',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockMessage(conversationId: string, overrides = {}) {
  return {
    id: `msg_${Math.random().toString(36).substring(7)}`,
    conversation_id: conversationId,
    role: 'user' as const,
    content: 'Test message content',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Test environment context mock
export function createMockExecutionContext(): ExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

// Helper to create test environment
export interface TestEnv {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  CLERK_SECRET_KEY?: string;
}

export function createMockRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}
