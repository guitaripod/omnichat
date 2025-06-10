import { generateId } from '@/utils';

export interface StreamState {
  streamId: string;
  conversationId: string;
  messageId: string;
  model: string;
  startedAt: Date;
  lastChunkAt?: Date;
  tokensGenerated: number;
  totalTokens?: number;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  abortReason?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class StreamStateManager {
  private static readonly STORAGE_KEY = 'omnichat_stream_states';
  private static readonly MAX_STATES = 10;
  private static readonly STATE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  static saveStreamState(state: StreamState): void {
    const states = this.getAllStates();
    states[state.streamId] = {
      ...state,
      lastChunkAt: new Date(),
    };

    // Clean up old states
    this.cleanupOldStates(states);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
  }

  static getStreamState(streamId: string): StreamState | null {
    const states = this.getAllStates();
    const state = states[streamId];

    if (!state) return null;

    // Check if state is expired
    const lastUpdate = new Date(state.lastChunkAt || state.startedAt);
    if (Date.now() - lastUpdate.getTime() > this.STATE_EXPIRY_MS) {
      this.removeStreamState(streamId);
      return null;
    }

    return state;
  }

  static removeStreamState(streamId: string): void {
    const states = this.getAllStates();
    delete states[streamId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
  }

  static getIncompleteStreams(conversationId?: string): StreamState[] {
    const states = this.getAllStates();
    const incompleteStates = Object.values(states).filter((state) => {
      if (conversationId && state.conversationId !== conversationId) {
        return false;
      }
      return !state.error && !state.abortReason;
    });

    return incompleteStates.sort(
      (a, b) =>
        new Date(b.lastChunkAt || b.startedAt).getTime() -
        new Date(a.lastChunkAt || a.startedAt).getTime()
    );
  }

  static createStreamId(): string {
    return `stream_${generateId()}`;
  }

  static markStreamComplete(streamId: string): void {
    const state = this.getStreamState(streamId);
    if (state) {
      this.removeStreamState(streamId);
    }
  }

  static markStreamError(streamId: string, error: string): void {
    const state = this.getStreamState(streamId);
    if (state) {
      state.error = error;
      this.saveStreamState(state);
    }
  }

  static markStreamAborted(streamId: string, reason: string): void {
    const state = this.getStreamState(streamId);
    if (state) {
      state.abortReason = reason;
      this.saveStreamState(state);
    }
  }

  private static getAllStates(): Record<string, StreamState> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private static cleanupOldStates(states: Record<string, StreamState>): void {
    const stateArray = Object.entries(states);

    // Remove expired states
    const now = Date.now();
    const validStates = stateArray.filter(([_, state]) => {
      const lastUpdate = new Date(state.lastChunkAt || state.startedAt);
      return now - lastUpdate.getTime() < this.STATE_EXPIRY_MS;
    });

    // Keep only the most recent MAX_STATES
    const sortedStates = validStates.sort(([_, a], [__, b]) => {
      const aTime = new Date(a.lastChunkAt || a.startedAt).getTime();
      const bTime = new Date(b.lastChunkAt || b.startedAt).getTime();
      return bTime - aTime;
    });

    const keptStates = sortedStates.slice(0, this.MAX_STATES);

    // Clear the states object and repopulate
    Object.keys(states).forEach((key) => delete states[key]);
    keptStates.forEach(([key, state]) => {
      states[key] = state;
    });
  }

  static estimateProgress(state: StreamState): number {
    if (!state.totalTokens || state.totalTokens === 0) {
      // Estimate based on time elapsed (assume 50 tokens/second)
      const elapsed = Date.now() - new Date(state.startedAt).getTime();
      const estimatedTokens = Math.floor(elapsed / 20); // 50 tokens/second
      return Math.min(
        state.tokensGenerated / Math.max(estimatedTokens, state.tokensGenerated + 100),
        0.95
      );
    }

    return Math.min(state.tokensGenerated / state.totalTokens, 1);
  }
}
