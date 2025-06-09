import { offlineStorage } from './offline';

export class SyncService {
  private isSyncing = false;

  async processSyncQueue(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      const queue = await offlineStorage.getSyncQueue();

      for (const item of queue) {
        try {
          await offlineStorage.updateSyncQueueItem(item.id, { status: 'syncing' });

          switch (item.type) {
            case 'create_conversation':
              await this.syncCreateConversation(item);
              break;
            case 'create_message':
              await this.syncCreateMessage(item);
              break;
            case 'update_conversation':
              await this.syncUpdateConversation(item);
              break;
            case 'delete_conversation':
              await this.syncDeleteConversation(item);
              break;
          }

          // Remove from queue on success
          await offlineStorage.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);

          // Update retry count
          await offlineStorage.updateSyncQueueItem(item.id, {
            status: 'pending',
            retries: (item.retries || 0) + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Remove from queue if too many retries
          if (item.retries >= 3) {
            await offlineStorage.updateSyncQueueItem(item.id, { status: 'failed' });
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncCreateConversation(item: {
    id: number;
    type: string;
    data: unknown;
    timestamp: Date;
    status: string;
    retries: number;
    error?: string;
  }): Promise<void> {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }
  }

  private async syncCreateMessage(item: {
    id: number;
    type: string;
    data: any;
    timestamp: Date;
    status: string;
    retries: number;
    error?: string;
  }): Promise<void> {
    const { conversationId, ...messageData } = item.data;

    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }
  }

  private async syncUpdateConversation(item: {
    id: number;
    type: string;
    data: any;
    timestamp: Date;
    status: string;
    retries: number;
    error?: string;
  }): Promise<void> {
    const { id, ...updates } = item.data;

    const response = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update conversation: ${response.statusText}`);
    }
  }

  private async syncDeleteConversation(item: {
    id: number;
    type: string;
    data: { id: string };
    timestamp: Date;
    status: string;
    retries: number;
    error?: string;
  }): Promise<void> {
    const response = await fetch(`/api/conversations/${item.data.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Start monitoring online status
  startMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('Back online - processing sync queue');
      this.processSyncQueue();
    });
  }
}

export const syncService = new SyncService();
