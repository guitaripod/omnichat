'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X, Filter, Calendar, Hash, FileText, ChevronDown, Sparkles } from 'lucide-react';
import { useConversationStore } from '@/store/conversations';
import { useDebouncedCallback } from 'use-debounce';
import { useUserStore } from '@/store/user';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from '@/components/premium-badge';
import { cn } from '@/lib/utils';
import type { Conversation, Message } from '@/types';

interface SearchResult {
  conversation: Conversation;
  matches: {
    title?: boolean;
    messages: Array<{
      message: Message;
      snippet: string;
      matchType: 'content' | 'model' | 'date';
    }>;
  };
  score: number;
}

interface SearchFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  models: string[];
  roles: ('user' | 'assistant' | 'system')[];
  hasAttachments: boolean;
  sortBy: 'relevance' | 'date' | 'messageCount';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: SearchFilters = {
  dateRange: 'all',
  models: [],
  roles: ['user', 'assistant'],
  hasAttachments: false,
  sortBy: 'relevance',
  sortOrder: 'desc',
};

export function AdvancedSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [selectedResult, setSelectedResult] = useState<number>(0);

  const { conversations, messages, setCurrentConversation } = useConversationStore();
  const user = useUserStore((state) => state.user);
  const isPremium =
    user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';

  // Advanced search with filters
  const performAdvancedSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim() && !showFilters) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const searchResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Date range filtering
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'custom':
          startDate = filters.startDate || null;
          endDate = filters.endDate || null;
          break;
      }

      // Search through conversations
      conversations.forEach((conversation) => {
        // Apply model filter
        if (filters.models.length > 0 && !filters.models.includes(conversation.model)) {
          return;
        }

        // Apply date filter
        if (startDate && conversation.updatedAt < startDate) return;
        if (endDate && conversation.updatedAt > endDate) return;

        const titleMatch = conversation.title.toLowerCase().includes(lowerQuery);
        const conversationMessages = messages[conversation.id] || [];

        // Search through messages
        const messageMatches: Array<{
          message: Message;
          snippet: string;
          matchType: 'content' | 'model' | 'date';
        }> = [];

        conversationMessages.forEach((message) => {
          // Apply role filter
          if (!filters.roles.includes(message.role)) return;

          // Apply attachment filter
          if (
            filters.hasAttachments &&
            (!message.attachments || message.attachments.length === 0)
          ) {
            return;
          }

          // Apply date filter to messages
          if (startDate && message.createdAt < startDate) return;
          if (endDate && message.createdAt > endDate) return;

          const contentLower = message.content.toLowerCase();
          const index = contentLower.indexOf(lowerQuery);

          if (index !== -1 || !searchQuery.trim()) {
            // Extract snippet around the match
            const start = Math.max(0, index - 50);
            const end = Math.min(message.content.length, index + searchQuery.length + 50);
            let snippet = message.content.substring(start, end);

            if (start > 0) snippet = '...' + snippet;
            if (end < message.content.length) snippet = snippet + '...';

            messageMatches.push({
              message,
              snippet,
              matchType: 'content',
            });
          }
        });

        if (titleMatch || messageMatches.length > 0 || !searchQuery.trim()) {
          // Calculate relevance score
          let score = 0;
          if (titleMatch) score += 10;
          score += messageMatches.length * 2;

          // Boost recent conversations
          const daysSinceUpdate =
            (Date.now() - conversation.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate < 1) score += 5;
          else if (daysSinceUpdate < 7) score += 3;
          else if (daysSinceUpdate < 30) score += 1;

          searchResults.push({
            conversation,
            matches: {
              title: titleMatch,
              messages: messageMatches,
            },
            score,
          });
        }
      });

      // Sort results
      searchResults.sort((a, b) => {
        switch (filters.sortBy) {
          case 'relevance':
            return filters.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
          case 'date':
            const dateA = a.conversation.updatedAt.getTime();
            const dateB = b.conversation.updatedAt.getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          case 'messageCount':
            const countA = a.matches.messages.length;
            const countB = b.matches.messages.length;
            return filters.sortOrder === 'desc' ? countB - countA : countA - countB;
          default:
            return 0;
        }
      });

      setResults(searchResults);
      setIsSearching(false);
      setSelectedResult(0);
    },
    [conversations, messages, filters, showFilters]
  );

  // Debounced search
  const performSearch = useDebouncedCallback(performAdvancedSearch, 300);

  useEffect(() => {
    performSearch(query);
  }, [query, filters, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      } else if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedResult((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedResult((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedResult]) {
          e.preventDefault();
          handleSelectConversation(results[selectedResult].conversation.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedResult, handleSelectConversation]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setCurrentConversation(conversationId);
      setIsOpen(false);
      setQuery('');
      setResults([]);
      setFilters(DEFAULT_FILTERS);
    },
    [setCurrentConversation]
  );

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
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
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          isPremium
            ? 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 hover:from-purple-100 hover:to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 dark:text-purple-300 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
        )}
      >
        <Search className="h-4 w-4" />
        <span>{isPremium ? 'Advanced Search' : 'Search'}</span>
        <kbd className="hidden rounded bg-white/50 px-2 py-0.5 text-xs font-semibold sm:inline-block dark:bg-black/20">
          ⌘K
        </kbd>
        {isPremium && <PremiumBadge size="xs" />}
      </button>

      {/* Search modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={cn(
              'fixed inset-x-4 top-20 mx-auto overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900',
              isPremium ? 'max-w-4xl' : 'max-w-2xl'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b dark:border-gray-800">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isPremium
                      ? 'Search with advanced filters...'
                      : 'Search conversations and messages...'
                  }
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none dark:text-white"
                  autoFocus
                />
                {isPremium && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors',
                      showFilters
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {Object.keys(filters).some(
                      (key) =>
                        JSON.stringify(filters[key as keyof SearchFilters]) !==
                        JSON.stringify(DEFAULT_FILTERS[key as keyof SearchFilters])
                    ) && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        Active
                      </Badge>
                    )}
                  </button>
                )}
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Filters panel */}
              {isPremium && showFilters && (
                <div className="border-t bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <div className="grid gap-4 md:grid-cols-4">
                    {/* Date range */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Date Range
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            dateRange: e.target.value as SearchFilters['dateRange'],
                          })
                        }
                        className="w-full rounded-lg border bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                      </select>
                    </div>

                    {/* Model filter */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Models
                      </label>
                      <div className="relative">
                        <button className="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800">
                          <span className="truncate">
                            {filters.models.length === 0
                              ? 'All Models'
                              : `${filters.models.length} selected`}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Role filter */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Message Types
                      </label>
                      <div className="flex gap-2">
                        {(['user', 'assistant'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              const newRoles = filters.roles.includes(role)
                                ? filters.roles.filter((r) => r !== role)
                                : [...filters.roles, role];
                              setFilters({ ...filters, roles: newRoles });
                            }}
                            className={cn(
                              'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                              filters.roles.includes(role)
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            )}
                          >
                            {role === 'user' ? 'You' : 'AI'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort by */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Sort By
                      </label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            sortBy: e.target.value as SearchFilters['sortBy'],
                          })
                        }
                        className="w-full rounded-lg border bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date</option>
                        <option value="messageCount">Match Count</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Reset Filters
                    </button>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Premium Feature
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Search results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="mb-2">Searching...</div>
                  {isPremium && (
                    <div className="text-xs text-gray-400">
                      Using advanced filters to find the best matches
                    </div>
                  )}
                </div>
              ) : results.length === 0 && (query || showFilters) ? (
                <div className="p-8 text-center text-gray-500">
                  No results found
                  {filters !== DEFAULT_FILTERS && (
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="mt-2 block w-full text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      Try clearing filters
                    </button>
                  )}
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Start typing to search
                  {isPremium && (
                    <div className="mt-2 text-xs text-gray-400">
                      Or use filters to browse conversations
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <div
                      key={result.conversation.id}
                      className={cn(
                        'cursor-pointer px-4 py-3 transition-colors',
                        index === selectedResult
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                      onClick={() => handleSelectConversation(result.conversation.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {result.matches.title
                              ? highlightMatch(result.conversation.title, query)
                              : result.conversation.title}
                          </h4>

                          {/* Metadata */}
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(result.conversation.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {result.conversation.model}
                            </span>
                            {result.matches.messages.length > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {result.matches.messages.length} matches
                              </span>
                            )}
                          </div>

                          {result.matches.messages.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {result.matches.messages.slice(0, 2).map((match, idx) => (
                                <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                                    {match.message.role === 'user' ? 'You: ' : 'AI: '}
                                  </span>
                                  {highlightMatch(match.snippet, query)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {isPremium && result.score > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Score</div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {result.score}
                            </div>
                          </div>
                        )}
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
                {isPremium && filters !== DEFAULT_FILTERS && ' (filtered)'}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">
                    ↑↓
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">
                    ↵
                  </kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-700">
                    esc
                  </kbd>
                  close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
