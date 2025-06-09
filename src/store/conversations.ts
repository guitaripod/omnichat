import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Conversation, Message } from '@/types';
import { generateId } from '@/utils';

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> messages

  // Actions
  createConversation: (title?: string, model?: string) => Conversation;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setCurrentConversation: (id: string | null) => void;

  // Message actions
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  getMessages: (conversationId: string) => Message[];

  // Utils
  getCurrentConversation: () => Conversation | null;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      messages: {},

      createConversation: (title, model = 'gpt-4o') => {
        const conversation: Conversation = {
          id: generateId(),
          userId: 'current-user', // TODO: Get from auth
          title: title || 'New Chat',
          model,
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: conversation.id,
          messages: { ...state.messages, [conversation.id]: [] },
        }));

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

      addMessage: (conversationId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), message],
          },
        }));
      },

      updateMessage: (conversationId, messageId, content) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((m) =>
              m.id === messageId ? { ...m, content } : m
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
    }),
    {
      name: 'conversation-storage',
    }
  )
);
