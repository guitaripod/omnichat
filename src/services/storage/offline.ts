import type { Conversation, Message } from '@/types';

const DB_NAME = 'omnichat-offline';
const DB_VERSION = 1;

type OfflineDB = IDBDatabase;

class OfflineStorage {
  private db: OfflineDB | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result as OfflineDB;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationStore.createIndex('userId', 'userId', { unique: false });
          conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
          messageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create sync queue store for offline actions
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Conversations
  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');
    await store.put(conversation);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Messages
  async saveMessage(message: Message): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    await store.put(message);
  }

  async saveMessages(messages: Message[]): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');

    for (const message of messages) {
      await store.put(message);
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('conversationId');
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by createdAt
        messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue
  async addToSyncQueue(action: {
    type: 'create_conversation' | 'create_message' | 'update_conversation' | 'delete_conversation';
    data: unknown;
  }): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await store.add({
      ...action,
      timestamp: new Date(),
      status: 'pending',
      retries: 0,
    });
  }

  async getSyncQueue(): Promise<
    Array<{
      id: number;
      type: string;
      data: unknown;
      timestamp: Date;
      status: string;
      retries: number;
      error?: string;
    }>
  > {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(
    id: number,
    updates: Partial<{
      status: 'pending' | 'syncing' | 'completed' | 'failed';
      retries: number;
      error?: string;
    }>
  ): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    const item = await store.get(id);
    if (item) {
      await store.put({ ...item, ...updates });
    }
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.delete(id);
  }

  // Clear all offline data
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(
      ['conversations', 'messages', 'syncQueue'],
      'readwrite'
    );

    await transaction.objectStore('conversations').clear();
    await transaction.objectStore('messages').clear();
    await transaction.objectStore('syncQueue').clear();
  }
}

export const offlineStorage = new OfflineStorage();
