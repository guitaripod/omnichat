import { useEffect, useRef, useCallback } from 'react';
import { useConversationStore } from '@/store/conversations';

interface SyncOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
}

export function useSync(options: SyncOptions = {}) {
  const { enabled = true, interval = 30000 } = options; // Default 30 seconds
  const { syncConversations, currentConversationId, syncMessages } = useConversationStore();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date>(new Date());
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync conversations and current conversation messages
  const performSync = useCallback(async () => {
    try {
      // Sync conversations list
      await syncConversations();

      // Sync current conversation messages if one is selected
      if (currentConversationId) {
        await syncMessages(currentConversationId);
      }

      lastSyncRef.current = new Date();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [syncConversations, syncMessages, currentConversationId]);

  // Debounced sync function
  const performSyncDebounced = useCallback(() => {
    // Clear existing debounce
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    // Debounce for 3 seconds to allow conversation creation to complete
    syncDebounceRef.current = setTimeout(() => {
      performSync();
    }, 3000);
  }, [performSync]);

  // Initial sync on mount (with debounce)
  useEffect(() => {
    if (enabled) {
      performSyncDebounced();
    }

    // Cleanup debounce on unmount
    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up periodic sync
  useEffect(() => {
    if (!enabled) return;

    // Clear existing interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Set up new interval
    syncIntervalRef.current = setInterval(performSync, interval);

    // Cleanup
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, interval, performSync]);

  // Sync on online event
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log('Back online, syncing...');
      performSync();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, performSync]);

  // Sync on visibility change (when tab becomes visible)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only sync if it's been more than 5 seconds since last sync
        const timeSinceLastSync = Date.now() - lastSyncRef.current.getTime();
        if (timeSinceLastSync > 5000) {
          performSync();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, performSync]);

  return {
    performSync,
    lastSync: lastSyncRef.current,
  };
}
