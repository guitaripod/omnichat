import { create } from 'zustand';
import type { Conversation, Message, ModelType } from '@/types';

interface ChatState {
  // Current conversation
  currentConversationId: string | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversationId -> messages

  // Model selection
  selectedModel: ModelType;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentConversation: (id: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;

  setSelectedModel: (model: ModelType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, _get) => ({
  // Initial state
  currentConversationId: null,
  conversations: [],
  messages: {},
  selectedModel: 'gpt-4o',
  isLoading: false,
  error: null,

  // Actions
  setCurrentConversation: (id) => set({ currentConversationId: id }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [...state.conversations, conversation],
      messages: { ...state.messages, [conversation.id]: [] },
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),

  deleteConversation: (id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...remainingMessages } = state.messages;
      return {
        conversations: state.conversations.filter((conv) => conv.id !== id),
        messages: remainingMessages,
        currentConversationId:
          state.currentConversationId === id ? null : state.currentConversationId,
      };
    }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]:
          state.messages[conversationId]?.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || [],
      },
    })),

  setSelectedModel: (model) => set({ selectedModel: model }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
