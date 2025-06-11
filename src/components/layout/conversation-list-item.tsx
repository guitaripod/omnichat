'use client';

import { useConversationStore } from '@/store/conversations';
import type { Conversation } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
}

export function ConversationListItem({ conversation, isActive }: ConversationListItemProps) {
  const { setCurrentConversation, syncMessages } = useConversationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Set the conversation first
      setCurrentConversation(conversation.id);

      // Then try to sync messages with error handling
      try {
        await syncMessages(conversation.id);
      } catch (syncError) {
        console.error('Failed to sync messages:', syncError);
        // Continue anyway - we'll show empty messages rather than crash
      }
    } catch (err) {
      console.error('Error switching conversation:', err);
      setError('Failed to load conversation');

      // Reset to no conversation to prevent crashes
      setCurrentConversation(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'w-full rounded-lg px-3 py-2 text-left transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isActive && 'bg-gray-100 dark:bg-gray-800',
        isLoading && 'cursor-wait opacity-50',
        error && 'border border-red-500'
      )}
    >
      <p className="truncate font-medium">{conversation.title}</p>
      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
        {conversation.model} • {new Date(conversation.updatedAt).toLocaleDateString()}
      </p>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </button>
  );
}
