'use client';

import { useEffect, useState } from 'react';
import { StreamStateManager } from '@/services/streaming/stream-state-manager';

interface StreamProgressProps {
  streamId?: string;
  isStreaming: boolean;
  tokensGenerated?: number;
}

export function StreamProgress({
  streamId,
  isStreaming,
  tokensGenerated = 0,
}: StreamProgressProps) {
  const [progress, setProgress] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isStreaming || !streamId) {
      // Fade out animation
      setTimeout(() => {
        setProgress(0);
        setEstimatedTotal(null);
        setIsVisible(false);
      }, 300);
      return;
    }

    // Fade in
    setIsVisible(true);

    const updateProgress = () => {
      const state = StreamStateManager.getStreamState(streamId);
      if (state) {
        const progressValue = StreamStateManager.estimateProgress(state);
        setProgress(progressValue);
        setEstimatedTotal(state.totalTokens || null);
      }
    };

    // Update immediately
    updateProgress();

    // Update periodically
    const interval = setInterval(updateProgress, 100);

    return () => clearInterval(interval);
  }, [streamId, isStreaming, tokensGenerated]);

  if (!isStreaming && !isVisible) {
    return null;
  }

  const progressPercentage = Math.round(progress * 100);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 text-xs text-gray-500 transition-all duration-300 dark:text-gray-400 ${
        isVisible && isStreaming ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="flex-1">
        <div className="mb-1 flex justify-end">
          {estimatedTotal && (
            <span className="tabular-nums">
              {tokensGenerated} / ~{estimatedTotal} tokens
            </span>
          )}
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          {/* Progress bar */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Shimmer effect */}
          {isStreaming && (
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </div>
      </div>
      {progressPercentage > 0 && (
        <span className="font-mono text-xs tabular-nums transition-all duration-150">
          {progressPercentage}%
        </span>
      )}
    </div>
  );
}
