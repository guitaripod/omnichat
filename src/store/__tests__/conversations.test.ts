import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConversationStore } from '../conversations';
import type { Conversation, Message } from '@/types';

// Mock the external dependencies
vi.mock('@/services/storage/offline', () => ({
  offlineStorage: {
    saveConversation: vi.fn(),
    saveMessage: vi.fn(),
    saveMessages: vi.fn(),
    addToSyncQueue: vi.fn(),
    getConversations: vi.fn(),
    getMessages: vi.fn(),
  },
}));

vi.mock('@/services/storage/sync', () => ({
  syncService: {
    isOnline: vi.fn(() => true),
    processSyncQueue: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Conversation Store - Sync Merge Logic', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Reset zustand store
    useConversationStore.setState({
      conversations: [],
      currentConversationId: null,
      messages: {},
      isLoading: false,
      isSyncing: false,
    });
  });

  describe('syncConversations', () => {
    it('should merge server conversations with local temp conversations', async () => {
      // Create local conversations with temp IDs
      const tempConv1: Conversation = {
        id: 'temp-123',
        userId: 'current-user',
        title: 'Local Chat 1',
        model: 'gpt-4o',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isArchived: false,
      };

      const tempConv2: Conversation = {
        id: 'temp-456',
        userId: 'current-user',
        title: 'Local Chat 2',
        model: 'gpt-4o',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        isArchived: false,
      };

      // Add local conversations
      useConversationStore.setState({
        conversations: [tempConv1, tempConv2],
      });

      // Mock server response with different conversations
      const serverConv1 = {
        id: 'server-123',
        userId: 'current-user',
        title: 'Server Chat 1',
        model: 'gpt-4o',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        isArchived: false,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [serverConv1] }),
      });

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncConversations();

      // Should have both server and local temp conversations
      const state = useConversationStore.getState();
      expect(state.conversations).toHaveLength(3);
      expect(state.conversations.map((c) => c.id)).toContain('temp-123');
      expect(state.conversations.map((c) => c.id)).toContain('temp-456');
      expect(state.conversations.map((c) => c.id)).toContain('server-123');
    });

    it('should preserve local conversations with messages even without temp ID', async () => {
      // Create a local conversation with messages
      const localConv: Conversation = {
        id: 'local-123',
        userId: 'current-user',
        title: 'Local Chat with Messages',
        model: 'gpt-4o',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        isArchived: false,
      };

      const messages: Message[] = [
        {
          id: 'msg-1',
          conversationId: 'local-123',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        },
      ];

      // Add local conversation with messages
      useConversationStore.setState({
        conversations: [localConv],
        messages: { 'local-123': messages },
      });

      // Mock empty server response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncConversations();

      // Should preserve local conversation with messages
      const state = useConversationStore.getState();
      expect(state.conversations).toHaveLength(1);
      expect(state.conversations[0].id).toBe('local-123');
      expect(state.messages['local-123']).toEqual(messages);
    });

    it('should not overwrite local data on server error', async () => {
      // Create local conversations
      const localConv: Conversation = {
        id: 'temp-789',
        userId: 'current-user',
        title: 'Local Chat',
        model: 'gpt-4o',
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false,
      };

      useConversationStore.setState({
        conversations: [localConv],
      });

      // Mock server error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncConversations();

      // Should preserve local data
      const state = useConversationStore.getState();
      expect(state.conversations).toHaveLength(1);
      expect(state.conversations[0].id).toBe('temp-789');
    });

    it('should not overwrite local data on network error', async () => {
      // Create local conversations
      const localConv: Conversation = {
        id: 'temp-999',
        userId: 'current-user',
        title: 'Local Chat',
        model: 'gpt-4o',
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false,
      };

      useConversationStore.setState({
        conversations: [localConv],
      });

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncConversations();

      // Should preserve local data
      const state = useConversationStore.getState();
      expect(state.conversations).toHaveLength(1);
      expect(state.conversations[0].id).toBe('temp-999');
    });
  });

  describe('syncMessages', () => {
    it('should merge server messages with local temp messages', async () => {
      const conversationId = 'conv-123';

      // Create local messages with temp IDs
      const tempMsg1: Message = {
        id: 'temp-msg-1',
        conversationId,
        role: 'user',
        content: 'Local message 1',
        createdAt: new Date('2024-01-01'),
      };

      const tempMsg2: Message = {
        id: 'temp-msg-2',
        conversationId,
        role: 'assistant',
        content: 'Local message 2',
        createdAt: new Date('2024-01-02'),
      };

      // Add local messages
      useConversationStore.setState({
        messages: { [conversationId]: [tempMsg1, tempMsg2] },
      });

      // Mock server response with different messages
      const serverMsg1 = {
        id: 'server-msg-1',
        conversationId,
        role: 'user',
        content: 'Server message 1',
        createdAt: '2024-01-03T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [serverMsg1] }),
      });

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncMessages(conversationId);

      // Should have both server and local temp messages
      const state = useConversationStore.getState();
      const messages = state.messages[conversationId];
      expect(messages).toHaveLength(3);
      expect(messages.map((m) => m.id)).toContain('temp-msg-1');
      expect(messages.map((m) => m.id)).toContain('temp-msg-2');
      expect(messages.map((m) => m.id)).toContain('server-msg-1');

      // Should be sorted by creation time
      expect(messages[0].id).toBe('temp-msg-1');
      expect(messages[1].id).toBe('temp-msg-2');
      expect(messages[2].id).toBe('server-msg-1');
    });

    it('should not overwrite local messages on server error', async () => {
      const conversationId = 'conv-456';

      // Create local messages
      const localMsg: Message = {
        id: 'temp-msg-3',
        conversationId,
        role: 'user',
        content: 'Local message',
        createdAt: new Date(),
      };

      useConversationStore.setState({
        messages: { [conversationId]: [localMsg] },
      });

      // Mock server error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncMessages(conversationId);

      // Should preserve local messages
      const state = useConversationStore.getState();
      expect(state.messages[conversationId]).toHaveLength(1);
      expect(state.messages[conversationId][0].id).toBe('temp-msg-3');
    });

    it('should not overwrite local messages on network error', async () => {
      const conversationId = 'conv-789';

      // Create local messages
      const localMsg: Message = {
        id: 'temp-msg-4',
        conversationId,
        role: 'user',
        content: 'Local message',
        createdAt: new Date(),
      };

      useConversationStore.setState({
        messages: { [conversationId]: [localMsg] },
      });

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Perform sync
      const store = useConversationStore.getState();
      await store.syncMessages(conversationId);

      // Should preserve local messages
      const state = useConversationStore.getState();
      expect(state.messages[conversationId]).toHaveLength(1);
      expect(state.messages[conversationId][0].id).toBe('temp-msg-4');
    });
  });
});
