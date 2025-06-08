import { User, Bot } from 'lucide-react';
import type { Message } from '@/types';
import { cn } from '@/utils';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-4 p-6',
        isUser ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-blue-600' : 'bg-gray-600'
        )}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
