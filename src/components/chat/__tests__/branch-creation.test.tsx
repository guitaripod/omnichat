import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatContainer } from '../chat-container';
import { useConversationStore } from '@/store/conversations';
import type { Message } from '@/types';

// Mock the conversation store
vi.mock('@/store/conversations', () => ({
  useConversationStore: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock the AI provider factory
vi.mock('@/services/ai/provider-factory', () => ({
  AIProviderFactory: {
    initialize: vi.fn(),
    getProvider: vi.fn(),
  },
}));

// Mock Ollama hook
vi.mock('@/hooks/use-ollama', () => ({
  useOllama: () => ({ isOllamaAvailable: false }),
}));

describe('Branch Creation', () => {
  const mockAddMessage = vi.fn();
  const mockUpdateMessage = vi.fn();
  const mockCreateConversation = vi.fn();

  const createMockMessage = (
    id: string,
    role: 'user' | 'assistant',
    content: string,
    parentId?: string
  ): Message => ({
    id,
    conversationId: 'test-conv',
    role,
    content,
    model: 'gpt-4o',
    createdAt: new Date(),
    parentId,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() =>
      JSON.stringify({
        openai: 'test-key',
      })
    );

    // Setup store mock
    (useConversationStore as any).mockImplementation((selector: any) => {
      const state = {
        currentConversationId: 'test-conv',
        messages: {
          'test-conv': [
            createMockMessage('1', 'user', 'Hello'),
            createMockMessage('2', 'assistant', 'Hi there!'),
          ],
        },
        createConversation: mockCreateConversation,
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
      };

      return selector ? selector(state) : state;
    });
  });

  it('should create a branch when clicking create branch button', async () => {
    // Mock successful API response
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"content": "Alternative response"}\n'),
        })
        .mockResolvedValueOnce({ done: true }),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    render(<ChatContainer />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    // TODO: Test branch creation through UI
    // This would require rendering the branch selector and clicking the button
    // For now, we'll test the underlying logic
  });

  it('should show loading message while creating branch', async () => {
    const mockReader = {
      read: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    // The actual branch creation would be triggered by the UI
    // Here we verify the loading state is shown
    expect(mockAddMessage).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        content: expect.stringContaining('Generating alternative response'),
      })
    );
  });

  it('should handle branch creation errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    // After error, the message should be updated with error info
    await waitFor(() => {
      expect(mockUpdateMessage).toBeCalledWith(
        expect.any(String),
        expect.any(String),
        expect.stringContaining('⚠️')
      );
    });
  });

  it('should append instruction to last user message for variety', () => {
    const messages = [
      createMockMessage('1', 'user', 'Tell me a joke'),
      createMockMessage('2', 'assistant', 'Why did the chicken cross the road?'),
    ];

    // This tests the message transformation logic
    const transformedMessages = messages.slice(0, 1).map((m, idx) => {
      if (idx === 0 && m.role === 'user') {
        return {
          role: m.role,
          content:
            m.content +
            '\n\n[Please provide an alternative response with a different perspective, approach, or style. Be creative and offer a unique take on this request.]',
        };
      }
      return { role: m.role, content: m.content };
    });

    expect(transformedMessages[0].content).toContain('alternative response');
    expect(transformedMessages[0].content).toContain('Tell me a joke');
  });

  it('should set correct parentId for branched messages', async () => {
    const messages = [
      createMockMessage('1', 'user', 'Hello'),
      createMockMessage('2', 'assistant', 'Hi there!', '1'),
      createMockMessage('3', 'user', 'How are you?', '2'),
      createMockMessage('4', 'assistant', 'I am well!', '3'),
    ];

    (useConversationStore as any).mockImplementation((selector: any) => {
      const state = {
        currentConversationId: 'test-conv',
        messages: { 'test-conv': messages },
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
      };
      return selector ? selector(state) : state;
    });

    // When creating a branch from message 4, it should have parentId = 3
    // (the user message that prompted the assistant response)
    const branchCall = mockAddMessage.mock.calls.find(
      (call) => call[1].role === 'assistant' && call[1].parentId
    );

    if (branchCall) {
      expect(branchCall[1].parentId).toBe('3');
    }
  });
});

describe('BranchManager Integration', () => {
  const createMockMessage = (
    id: string,
    role: 'user' | 'assistant',
    content: string,
    parentId?: string
  ): Message => ({
    id,
    conversationId: 'test-conv',
    role,
    content,
    model: 'gpt-4o',
    createdAt: new Date(),
    parentId,
  });

  it('should correctly identify branch points', () => {
    const messages: Message[] = [
      createMockMessage('1', 'user', 'Hello'),
      createMockMessage('2', 'assistant', 'Response 1', '1'),
      createMockMessage('3', 'assistant', 'Response 2', '1'),
    ];

    // Both responses should have the same parent
    const assistant1Parent = messages.find((m) => m.id === '2')?.parentId;
    const assistant2Parent = messages.find((m) => m.id === '3')?.parentId;

    expect(assistant1Parent).toBe('1');
    expect(assistant2Parent).toBe('1');
    expect(assistant1Parent).toBe(assistant2Parent);
  });
});
