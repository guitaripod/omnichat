import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, Message } from '@/types';
import { generateId } from '@/utils';
import { offlineStorage } from '@/services/storage/offline';
import { syncService } from '@/services/storage/sync';

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  createConversation: (title?: string, model?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setCurrentConversation: (id: string | null) => void;

  // Message actions
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  getMessages: (conversationId: string) => Message[];

  // Sync actions
  syncConversations: () => Promise<void>;
  syncMessages: (conversationId: string) => Promise<void>;

  // Utils
  getCurrentConversation: () => Conversation | null;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      messages: {},
      isLoading: false,
      isSyncing: false,

      createConversation: async (title, model = 'gpt-4o') => {
        const tempId = generateId();
        const conversation: Conversation = {
          id: tempId,
          userId: 'current-user',
          title: title || 'New Chat',
          model,
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        };

        // Optimistically add to store
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: conversation.id,
          messages: { ...state.messages, [conversation.id]: [] },
        }));

        // Save to offline storage
        await offlineStorage.saveConversation(conversation);

        // Try to persist to database
        try {
          const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: conversation.title, model: conversation.model }),
          });

          if (response.ok) {
            const { conversation: dbConversation } = (await response.json()) as {
              conversation: Conversation;
            };
            // Update with real ID from database
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === tempId
                  ? {
                      ...dbConversation,
                      createdAt: new Date(dbConversation.createdAt),
                      updatedAt: new Date(dbConversation.updatedAt),
                    }
                  : c
              ),
              currentConversationId: dbConversation.id,
              messages: {
                ...state.messages,
                [dbConversation.id]: (state.messages[tempId] || []).map((msg) => ({
                  ...msg,
                  conversationId: dbConversation.id,
                })),
              },
            }));
            // Clean up temp ID
            set((state) => {
              const newMessages = { ...state.messages };
              delete newMessages[tempId];
              return { messages: newMessages };
            });
            return dbConversation;
          }
        } catch (error) {
          console.error('Failed to persist conversation:', error);
          // Add to sync queue for later
          await offlineStorage.addToSyncQueue({
            type: 'create_conversation',
            data: { title: conversation.title, model: conversation.model },
          });
        }

        return conversation;
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          const newMessages = { ...state.messages };
          delete newMessages[id];

          return {
            conversations: newConversations,
            currentConversationId:
              state.currentConversationId === id ? null : state.currentConversationId,
            messages: newMessages,
          };
        });
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c
          ),
        }));
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      addMessage: async (conversationId, message) => {
        // Optimistically add to store
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), message],
          },
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, updatedAt: new Date() } : c
          ),
        }));

        // Save to offline storage
        await offlineStorage.saveMessage(message);

        // Try to persist to database
        try {
          await fetch(`/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: message.role,
              content: message.content,
              model: message.model,
              parentId: message.parentId,
            }),
          });
        } catch (error) {
          console.error('Failed to persist message:', error);
          // Add to sync queue for later
          await offlineStorage.addToSyncQueue({
            type: 'create_message',
            data: {
              conversationId,
              role: message.role,
              content: message.content,
              model: message.model,
              parentId: message.parentId,
            },
          });
        }
      },

      updateMessage: (conversationId, messageId, content) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((m) =>
              m.id === messageId ? { ...m, content, updatedAt: new Date() } : m
            ),
          },
        }));
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).filter(
              (m) => m.id !== messageId
            ),
          },
        }));
      },

      getMessages: (conversationId) => {
        return get().messages[conversationId] || [];
      },

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.currentConversationId) || null;
      },

      syncConversations: async () => {
        set({ isSyncing: true });
        try {
          // Process offline sync queue first
          if (syncService.isOnline()) {
            await syncService.processSyncQueue();
          }

          const response = await fetch('/api/conversations');
          if (response.ok) {
            const { conversations } = (await response.json()) as { conversations: any[] };
            const serverConversations = conversations.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
            }));

            // Merge strategy: Keep local conversations with temp IDs and merge with server data
            set((state) => {
              const localConversations = state.conversations;
              const conversationMap = new Map<string, Conversation>();

              // First, add all server conversations
              for (const conv of serverConversations) {
                conversationMap.set(conv.id, conv);
              }

              // Then, preserve local conversations that aren't on the server yet
              for (const conv of localConversations) {
                // Keep conversations with temporary IDs (not synced yet)
                if (conv.id.startsWith('temp-') && !conversationMap.has(conv.id)) {
                  conversationMap.set(conv.id, conv);
                }
                // Also keep any local conversation that has messages but isn't on server
                else if (!conversationMap.has(conv.id) && state.messages[conv.id]?.length > 0) {
                  conversationMap.set(conv.id, conv);
                }
              }

              // Convert map back to sorted array (newest first)
              const mergedConversations = Array.from(conversationMap.values()).sort(
                (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
              );

              return {
                conversations: mergedConversations,
                isSyncing: false,
              };
            });

            // Update offline storage with server data only
            for (const conv of serverConversations) {
              await offlineStorage.saveConversation(conv);
            }
          } else {
            // Don't overwrite local data on server error
            console.error('Server returned error:', response.status);
            set({ isSyncing: false });
          }
        } catch (error) {
          console.error('Failed to sync conversations:', error);
          // Don't overwrite local data on network error
          set({ isSyncing: false });
        }
      },

      syncMessages: async (conversationId: string) => {
        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages`);
          if (response.ok) {
            const { messages } = (await response.json()) as { messages: any[] };
            const serverMessages = messages.map((m: any) => ({
              ...m,
              createdAt: new Date(m.createdAt),
              updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
            }));

            // Merge strategy for messages
            set((state) => {
              const localMessages = state.messages[conversationId] || [];
              const messageMap = new Map<string, Message>();

              // Add server messages first
              for (const msg of serverMessages) {
                messageMap.set(msg.id, msg);
              }

              // Preserve local messages with temp IDs or that aren't on server
              for (const msg of localMessages) {
                if (msg.id.startsWith('temp-') && !messageMap.has(msg.id)) {
                  messageMap.set(msg.id, msg);
                }
              }

              // Convert back to array sorted by creation time
              const mergedMessages = Array.from(messageMap.values()).sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
              );

              return {
                messages: {
                  ...state.messages,
                  [conversationId]: mergedMessages,
                },
              };
            });

            // Update offline storage with server data
            await offlineStorage.saveMessages(serverMessages);
          } else {
            console.error('Server returned error for messages:', response.status);
            // Don't overwrite local messages on error
          }
        } catch (error) {
          console.error('Failed to sync messages:', error);
          // Don't overwrite local messages on network error
        }
      },
    }),
    {
      name: 'conversation-storage',
    }
  )
);
