'use client';

import { cn } from '@/utils';

interface StreamingIndicatorProps {
  className?: string;
}

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-600"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-600"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-600"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
