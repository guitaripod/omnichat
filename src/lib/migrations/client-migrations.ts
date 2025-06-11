// Client-side migration system for handling schema changes from D1
import { Message as ClientMessage, Conversation as ClientConversation } from '@/types';

// Migration version - increment this when adding new migrations
export const MIGRATION_VERSION = 2;

// Define the shape of data from D1 (includes all fields)
export interface D1Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string | null;
  parentId?: string | null;
  isComplete: boolean;
  streamState?: string | null;
  tokensGenerated: number;
  totalTokens?: number | null;
  streamId?: string | null;
  createdAt: Date | string;
}

// Define migration functions for each version
type Migration = {
  version: number;
  migrate: (data: MigrationData) => MigrationData;
};

interface MigrationData {
  messages?: Array<Record<string, unknown>>;
  conversations?: Array<Record<string, unknown>>;
}

// Migration functions that transform D1 data to client-side format
// Currently not used but kept for future migration needs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const migrations: Migration[] = [
  {
    version: 1,
    migrate: (data: MigrationData) => data, // Initial version, no migration needed
  },
  {
    version: 2,
    migrate: (data: MigrationData) => {
      // Handle streaming fields added in migration 0002
      if (data.messages) {
        data.messages = data.messages.map((msg) => {
          // Remove streaming fields that aren't in client types
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isComplete, streamState, tokensGenerated, totalTokens, streamId, ...rest } = msg;
          return rest;
        });
      }
      return data;
    },
  },
];

// Transform a single message from D1 format to client format
export function migrateMessage(d1Message: D1Message): ClientMessage {
  // Start with the base message structure
  const baseMessage: ClientMessage = {
    id: d1Message.id,
    conversationId: d1Message.conversationId,
    role: d1Message.role,
    content: d1Message.content,
    model: d1Message.model || undefined,
    parentId: d1Message.parentId || undefined,
    createdAt: new Date(d1Message.createdAt),
    attachments: [],
  };

  // For now, we simply return the base message without streaming fields
  // The streaming fields are automatically stripped since they're not in ClientMessage type
  return baseMessage;
}

// Transform multiple messages
export function migrateMessages(d1Messages: D1Message[]): ClientMessage[] {
  return d1Messages.map(migrateMessage);
}

// Validate and migrate conversation data from D1
export function migrateConversation(d1Conversation: Record<string, unknown>): ClientConversation {
  return {
    id: d1Conversation.id as string,
    userId: d1Conversation.userId as string,
    title: d1Conversation.title as string,
    model: d1Conversation.model as string,
    createdAt: new Date(d1Conversation.createdAt as string | Date),
    updatedAt: new Date(d1Conversation.updatedAt as string | Date),
    isArchived: Boolean(d1Conversation.isArchived),
  };
}

// Helper to check if data needs migration
export function needsMigration(data: MigrationData): boolean {
  // Check if any message has the new streaming fields
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages.some(
      (msg) =>
        'isComplete' in msg ||
        'streamState' in msg ||
        'tokensGenerated' in msg ||
        'totalTokens' in msg ||
        'streamId' in msg
    );
  }
  return false;
}

// Store migration version in localStorage
const MIGRATION_VERSION_KEY = 'omnichat_migration_version';

export function getMigrationVersion(): number {
  if (typeof window === 'undefined') return MIGRATION_VERSION;
  const stored = localStorage.getItem(MIGRATION_VERSION_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

export function setMigrationVersion(version: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_VERSION_KEY, version.toString());
}

// Clear all client-side storage if migration fails
export function clearClientStorage(): void {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.removeItem('conversation-storage');
  localStorage.removeItem('chat-storage');
  localStorage.removeItem(MIGRATION_VERSION_KEY);

  // Clear IndexedDB
  if ('indexedDB' in window) {
    indexedDB.deleteDatabase('omnichat-offline');
  }
}
