import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, Message } from '@/types';
import { generateId } from '@/utils';

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

        // Try to persist to database
        try {
          const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: conversation.title, model: conversation.model }),
          });

          if (response.ok) {
            const { conversation: dbConversation } = await response.json();
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
                [dbConversation.id]: state.messages[tempId] || [],
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
          const response = await fetch('/api/conversations');
          if (response.ok) {
            const { conversations } = await response.json();
            set({
              conversations: conversations.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
              })),
              isSyncing: false,
            });
          }
        } catch (error) {
          console.error('Failed to sync conversations:', error);
          set({ isSyncing: false });
        }
      },

      syncMessages: async (conversationId: string) => {
        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages`);
          if (response.ok) {
            const { messages } = await response.json();
            set((state) => ({
              messages: {
                ...state.messages,
                [conversationId]: messages.map((m: any) => ({
                  ...m,
                  createdAt: new Date(m.createdAt),
                  updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
                })),
              },
            }));
          }
        } catch (error) {
          console.error('Failed to sync messages:', error);
        }
      },
    }),
    {
      name: 'conversation-storage',
    }
  )
);
