'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import type { Message } from '@/types';
import { generateId } from '@/utils';
import { AIProviderFactory } from '@/services/ai/provider-factory';
import { useConversationStore } from '@/store/conversations';
import { useOllama } from '@/hooks/use-ollama';
import { OllamaClientProvider } from '@/services/ai/providers/ollama-client';

export function ChatContainer() {
  const { currentConversationId, createConversation, addMessage, updateMessage } =
    useConversationStore();

  // Subscribe to messages separately to ensure reactivity
  const messages = useConversationStore((state) =>
    currentConversationId ? state.messages[currentConversationId] || [] : []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [, setStreamingMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ollamaProviderRef = useRef<OllamaClientProvider | null>(null);

  // Get Ollama connection status
  const savedKeys = typeof window !== 'undefined' ? localStorage.getItem('apiKeys') : null;
  const ollamaBaseUrl = savedKeys ? JSON.parse(savedKeys).ollama : undefined;
  const { isOllamaAvailable } = useOllama(ollamaBaseUrl);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize AI providers from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      AIProviderFactory.initialize({
        openaiApiKey: keys.openai,
        anthropicApiKey: keys.anthropic,
        googleApiKey: keys.google,
        ollamaBaseUrl: keys.ollama,
      });
    }
  }, []);

  // Create conversation if none exists
  useEffect(() => {
    if (!currentConversationId) {
      createConversation('New Chat', selectedModel);
    }
  }, [currentConversationId, createConversation, selectedModel]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) return;

    const userMessage: Message = {
      id: generateId(),
      conversationId: currentConversationId,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    addMessage(currentConversationId, userMessage);
    setIsLoading(true);
    setStreamingMessage('');

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      let response: Response;
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

      // Check if this is an Ollama model and if Ollama is available locally
      const isOllamaModel = selectedModel.startsWith('ollama/');

      if (isOllamaModel && isOllamaAvailable && ollamaBaseUrl) {
        // Direct browser-to-Ollama connection
        console.log('Using direct Ollama connection for model:', selectedModel);

        if (!ollamaProviderRef.current) {
          ollamaProviderRef.current = new OllamaClientProvider(ollamaBaseUrl);
        }

        const streamResponse = await ollamaProviderRef.current.chatCompletion({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
          stream: true,
        });

        reader = streamResponse.stream.getReader();
      } else {
        // Server-side API route for cloud providers
        console.log('Using server API route for model:', selectedModel);

        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            model: selectedModel,
            stream: true,
            ollamaBaseUrl: isOllamaModel ? ollamaBaseUrl : undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to send message');
        }

        reader = response.body?.getReader();
      }

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: generateId(),
        conversationId: currentConversationId,
        role: 'assistant',
        content: '',
        model: selectedModel,
        createdAt: new Date(),
      };

      addMessage(currentConversationId, assistantMessage);

      // Handle streaming response
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                console.log('Parsed streaming data:', parsed);

                // Handle different response formats
                let content = '';
                if (parsed.content) {
                  content = parsed.content;
                } else if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content;
                }

                if (content) {
                  accumulatedContent += content;
                  setStreamingMessage(accumulatedContent);

                  // Update the assistant message
                  updateMessage(currentConversationId, assistantMessage.id, accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e, 'Line:', line);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        // Show error message
        const errorMessage: Message = {
          id: generateId(),
          conversationId: currentConversationId,
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          createdAt: new Date(),
        };
        addMessage(currentConversationId, errorMessage);
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (ollamaProviderRef.current) {
      ollamaProviderRef.current.abort();
    }
  };

  const handleRegenerateMessage = async (index: number) => {
    if (!currentConversationId || isLoading) return;

    // Get current messages
    const messagesArray = messages;
    if (index !== messagesArray.length - 1 || messagesArray[index].role !== 'assistant') return;

    // Delete the last assistant message
    const assistantMessage = messagesArray[index];
    const conversationStore = useConversationStore.getState();
    conversationStore.deleteMessage(currentConversationId, assistantMessage.id);

    // Get messages up to (but not including) the deleted assistant message
    const previousMessages = messagesArray.slice(0, index);

    // Regenerate response
    setIsLoading(true);
    setStreamingMessage('');
    abortControllerRef.current = new AbortController();

    try {
      let response: Response;
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

      // Check if this is an Ollama model and if Ollama is available locally
      const isOllamaModel = selectedModel.startsWith('ollama/');

      if (isOllamaModel && isOllamaAvailable && ollamaBaseUrl) {
        // Direct browser-to-Ollama connection
        console.log('Using direct Ollama connection for regeneration:', selectedModel);

        if (!ollamaProviderRef.current) {
          ollamaProviderRef.current = new OllamaClientProvider(ollamaBaseUrl);
        }

        const streamResponse = await ollamaProviderRef.current.chatCompletion({
          messages: previousMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
          stream: true,
        });

        reader = streamResponse.stream.getReader();
      } else {
        // Server-side API route for cloud providers
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: previousMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            model: selectedModel,
            stream: true,
            ollamaBaseUrl: isOllamaModel ? ollamaBaseUrl : undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to regenerate message');
        }

        reader = response.body?.getReader();
      }

      // Create new assistant message placeholder
      const newAssistantMessage: Message = {
        id: generateId(),
        conversationId: currentConversationId,
        role: 'assistant',
        content: '',
        model: selectedModel,
        createdAt: new Date(),
      };

      addMessage(currentConversationId, newAssistantMessage);

      // Handle streaming response (same as in handleSendMessage)
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                // Handle different response formats
                let content = '';
                if (parsed.content) {
                  content = parsed.content;
                } else if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content;
                }

                if (content) {
                  accumulatedContent += content;
                  setStreamingMessage(accumulatedContent);
                  updateMessage(currentConversationId, newAssistantMessage.id, accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing streaming data in regenerate:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error regenerating message:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                Start a new conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select a model and send your first message
              </p>
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onRegenerateMessage={handleRegenerateMessage}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStop={handleStopGeneration}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
