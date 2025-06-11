'use client';

import React from 'react';
import { clearClientStorage } from '@/lib/migrations/client-migrations';
import { useConversationStore } from '@/store/conversations';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MigrationErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('MigrationErrorBoundary caught:', error);

    // Check if this is a schema-related error or React hydration error
    const isSchemaError =
      error.message.includes('Cannot read properties of undefined') ||
      error.message.includes('isComplete') ||
      error.message.includes('streamState') ||
      error.message.includes('tokensGenerated') ||
      error.message.includes('totalTokens') ||
      error.message.includes('streamId') ||
      error.message.includes('Minified React error #185') ||
      error.message.includes('hydration');

    return { hasError: isSchemaError, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Migration error caught:', error, errorInfo);
  }

  handleSoftReset = () => {
    // Try to clear just the current conversation's messages
    const store = useConversationStore.getState();
    const currentId = store.currentConversationId;

    if (currentId) {
      store.clearConversationMessages(currentId);
      store.setCurrentConversation(null);
    }

    // Reset error state without full reload
    this.setState({ hasError: false, error: null });
  };

  handleHardReset = () => {
    // Clear all client storage and reload
    clearClientStorage();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center p-4">
          <div className="max-w-md rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20">
            <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
              Chat Loading Error
            </h2>
            <p className="mb-4 text-sm text-red-600 dark:text-red-300">
              {this.state.error?.message.includes('#185')
                ? 'A rendering error occurred with old conversation data.'
                : 'Your local data needs to be refreshed to match the latest version.'}
            </p>
            <p className="mb-6 text-xs text-gray-600 dark:text-gray-400">
              Your conversations are safely stored on the server.
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleSoftReset}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Clear Current Chat
              </button>
              <button
                onClick={this.handleHardReset}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
