'use client';

import { useState, useEffect } from 'react';
import { StreamState, StreamStateManager } from '@/services/streaming/stream-state-manager';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

interface StreamRecoveryProps {
  conversationId: string;
  onResume: (streamState: StreamState) => void;
}

export function StreamRecovery({ conversationId, onResume }: StreamRecoveryProps) {
  const [incompleteStreams, setIncompleteStreams] = useState<StreamState[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkIncompleteStreams = () => {
      const streams = StreamStateManager.getIncompleteStreams(conversationId);
      setIncompleteStreams(streams);
      setIsVisible(streams.length > 0);
    };

    // Check on mount
    checkIncompleteStreams();

    // Check periodically for new incomplete streams
    const interval = setInterval(checkIncompleteStreams, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const handleResume = (stream: StreamState) => {
    onResume(stream);
    setIsVisible(false);
  };

  const handleDismiss = (streamId: string) => {
    StreamStateManager.removeStreamState(streamId);
    setIncompleteStreams((prev) => prev.filter((s) => s.streamId !== streamId));
    if (incompleteStreams.length === 1) {
      setIsVisible(false);
    }
  };

  const handleDismissAll = () => {
    incompleteStreams.forEach((stream) => {
      StreamStateManager.removeStreamState(stream.streamId);
    });
    setIncompleteStreams([]);
    setIsVisible(false);
  };

  if (!isVisible || incompleteStreams.length === 0) {
    return null;
  }

  const latestStream = incompleteStreams[0];
  const progress = StreamStateManager.estimateProgress(latestStream);
  const progressPercentage = Math.round(progress * 100);

  return (
    <div className="fixed right-4 bottom-20 z-50 w-80 rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-lg dark:border-yellow-800 dark:bg-yellow-900/50">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Incomplete Response
          </h3>
        </div>
        <button
          onClick={handleDismissAll}
          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-sm text-yellow-800 dark:text-yellow-200">
        {incompleteStreams.length === 1
          ? 'A previous response was interrupted. Would you like to resume?'
          : `${incompleteStreams.length} responses were interrupted. Resume the latest?`}
      </p>

      {/* Progress indicator */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-yellow-700 dark:text-yellow-300">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-yellow-200 dark:bg-yellow-700">
          <div
            className="h-2 rounded-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
          {latestStream.tokensGenerated} tokens generated
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleResume(latestStream)}
          size="sm"
          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Resume
        </Button>
        <Button
          onClick={() => handleDismiss(latestStream.streamId)}
          size="sm"
          variant="outline"
          className="flex-1 border-yellow-300 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-800"
        >
          Dismiss
        </Button>
      </div>

      {incompleteStreams.length > 1 && (
        <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
          +{incompleteStreams.length - 1} more interrupted
        </p>
      )}
    </div>
  );
}
