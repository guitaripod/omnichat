'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useConversationStore } from '@/store/conversations';
import { useDebouncedCallback } from 'use-debounce';
import type { Conversation, Message } from '@/types';

interface SearchResult {
  conversation: Conversation;
  matches: {
    title?: boolean;
    messages: Array<{
      message: Message;
      snippet: string;
    }>;
  };
}

interface SearchBarProps {
  useServerSearch?: boolean;
}

export function SearchBar({ useServerSearch = false }: SearchBarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { conversations, messages, setCurrentConversation } = useConversationStore();

  // Server-side search
  const performServerSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const { results: searchResults } = await response.json();

          // Transform server results to match our format
          const groupedResults = new Map<string, SearchResult>();

          // Add conversation matches
          searchResults.conversations?.forEach((conv: any) => {
            groupedResults.set(conv.id, {
              conversation: conversations.find((c) => c.id === conv.id) || {
                id: conv.id,
                title: conv.title,
                updatedAt: new Date(conv.updatedAt),
                userId: '',
                model: '',
                createdAt: new Date(),
                isArchived: false,
              },
              matches: {
                title: true,
                messages: [],
              },
            });
          });

          // Add message matches
          searchResults.messages?.forEach((msg: any) => {
            const existing = groupedResults.get(msg.conversationId);
            if (existing) {
              existing.matches.messages.push({
                message: {
                  id: msg.id,
                  conversationId: msg.conversationId,
                  role: msg.role,
                  content: msg.content,
                  createdAt: new Date(msg.createdAt),
                },
                snippet: msg.content.substring(0, 150),
              });
            } else {
              const conv = conversations.find((c) => c.id === msg.conversationId);
              if (conv) {
                groupedResults.set(msg.conversationId, {
                  conversation: conv,
                  matches: {
                    title: false,
                    messages: [
                      {
                        message: {
                          id: msg.id,
                          conversationId: msg.conversationId,
                          role: msg.role,
                          content: msg.content,
                          createdAt: new Date(msg.createdAt),
                        },
                        snippet: msg.content.substring(0, 150),
                      },
                    ],
                  },
                });
              }
            }
          });

          setResults(Array.from(groupedResults.values()));
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [conversations]
  );

  // Client-side search
  const performClientSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const searchResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Search through conversations
      conversations.forEach((conversation) => {
        const titleMatch = conversation.title.toLowerCase().includes(lowerQuery);
        const conversationMessages = messages[conversation.id] || [];

        // Search through messages
        const messageMatches: Array<{ message: Message; snippet: string }> = [];

        conversationMessages.forEach((message) => {
          const contentLower = message.content.toLowerCase();
          const index = contentLower.indexOf(lowerQuery);

          if (index !== -1) {
            // Extract snippet around the match
            const start = Math.max(0, index - 50);
            const end = Math.min(message.content.length, index + searchQuery.length + 50);
            let snippet = message.content.substring(start, end);

            if (start > 0) snippet = '...' + snippet;
            if (end < message.content.length) snippet = snippet + '...';

            messageMatches.push({
              message,
              snippet,
            });
          }
        });

        if (titleMatch || messageMatches.length > 0) {
          searchResults.push({
            conversation,
            matches: {
              title: titleMatch,
              messages: messageMatches,
            },
          });
        }
      });

      // Sort by relevance (title matches first, then by number of message matches)
      searchResults.sort((a, b) => {
        if (a.matches.title && !b.matches.title) return -1;
        if (!a.matches.title && b.matches.title) return 1;
        return b.matches.messages.length - a.matches.messages.length;
      });

      setResults(searchResults);
      setIsSearching(false);
    },
    [conversations, messages]
  );

  // Debounced search function
  const performSearch = useDebouncedCallback(
    useServerSearch ? performServerSearch : performClientSearch,
    300 // 300ms debounce
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="hidden rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-500 sm:inline-block dark:bg-gray-700">
          ⌘K
        </kbd>
      </button>

      {/* Search modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="fixed inset-x-4 top-20 mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b px-4 py-3 dark:border-gray-800">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations and messages..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none dark:text-white"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Search results */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-gray-500">Searching...</div>
              ) : results.length === 0 && query ? (
                <div className="p-8 text-center text-gray-500">No results found for "{query}"</div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Start typing to search conversations and messages
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result) => (
                    <div
                      key={result.conversation.id}
                      className="cursor-pointer px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSelectConversation(result.conversation.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {result.matches.title
                              ? highlightMatch(result.conversation.title, query)
                              : result.conversation.title}
                          </h4>
                          {result.matches.messages.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {result.matches.messages.slice(0, 2).map((match, index) => (
                                <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                                    {match.message.role === 'user' ? 'You: ' : 'Assistant: '}
                                  </span>
                                  {highlightMatch(match.snippet, query)}
                                </p>
                              ))}
                              {result.matches.messages.length > 2 && (
                                <p className="text-xs text-gray-500">
                                  +{result.matches.messages.length - 2} more matches
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.conversation.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-gray-500 dark:border-gray-800">
              <span>
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">
                    ↵
                  </kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">
                    esc
                  </kbd>
                  to close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
