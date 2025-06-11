'use client';

import React from 'react';
import { useConversationStore } from '@/store/conversations';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class SafeChatWrapper extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('Chat error caught:', error);
    return {
      hasError: true,
      errorMessage: error.message || 'An error occurred while loading the chat',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat error details:', error, errorInfo);
  }

  handleReset = () => {
    // Clear the current conversation to return to a safe state
    const store = useConversationStore.getState();
    store.setCurrentConversation(null);

    // Reset error state
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleClearAndReset = () => {
    // More aggressive reset - clear all messages for current conversation
    const store = useConversationStore.getState();
    const currentId = store.currentConversationId;

    if (currentId) {
      // Clear messages for this conversation
      store.messages[currentId] = [];
    }

    store.setCurrentConversation(null);
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
              Chat Loading Error
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {this.state.errorMessage}
            </p>
            <p className="mb-6 text-xs text-gray-500 dark:text-gray-500">
              This usually happens when trying to load conversations created with an older version
              of the app.
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Return to Chat List
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                Clear & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
