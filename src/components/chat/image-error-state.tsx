'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils';

interface ImageErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ImageErrorState({ error, onRetry }: ImageErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="relative">
        <div className="h-32 w-32 rounded-2xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        </div>
      </div>

      <div className="max-w-md space-y-2 text-center">
        <p className="text-lg font-medium text-red-600 dark:text-red-400">
          Image Generation Failed
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            'bg-red-100 text-red-700 hover:bg-red-200',
            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
            'transition-colors'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
