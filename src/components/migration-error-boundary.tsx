'use client';

import React from 'react';
import { clearClientStorage } from '@/lib/migrations/client-migrations';

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
    // Check if this is a schema-related error
    const isSchemaError =
      error.message.includes('Cannot read properties of undefined') ||
      error.message.includes('isComplete') ||
      error.message.includes('streamState') ||
      error.message.includes('tokensGenerated') ||
      error.message.includes('totalTokens') ||
      error.message.includes('streamId');

    return { hasError: isSchemaError, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Migration error caught:', error, errorInfo);
  }

  handleReset = () => {
    // Clear all client storage and reload
    clearClientStorage();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center p-4">
          <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-red-800">
              Database Schema Update Detected
            </h2>
            <p className="mb-4 text-sm text-red-600">
              Your local data needs to be refreshed to match the latest version. Your conversations
              are safely stored on the server.
            </p>
            <button
              onClick={this.handleReset}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
            >
              Refresh Local Data
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
