'use client';

import { Settings2, Moon, Sun, Download } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { SearchBar } from './search-bar';
import { useState } from 'react';
import { useConversationStore } from '@/store/conversations';
import { ExportDialog } from '@/components/chat/export-dialog';

export function Header() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { currentConversationId, messages } = useConversationStore();

  const hasMessages = currentConversationId && messages[currentConversationId]?.length > 0;

  if (!mounted) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h1>
        <SearchBar />
      </div>

      <div className="flex items-center gap-2">
        {hasMessages && (
          <button
            onClick={() => setShowExportDialog(true)}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Export conversation"
            title="Export conversation"
          >
            <Download size={20} />
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Settings"
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* Export Dialog */}
      {showExportDialog && currentConversationId && (
        <ExportDialog
          isOpen={true}
          onClose={() => setShowExportDialog(false)}
          conversationId={currentConversationId}
        />
      )}
    </header>
  );
}
