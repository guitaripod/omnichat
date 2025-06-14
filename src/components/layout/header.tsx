'use client';

import { Settings2, Download } from 'lucide-react';
import { useState } from 'react';
import { useConversationStore } from '@/store/conversations';
import { PremiumExportDialog } from '@/components/export/premium-export-dialog';
import { BatteryWidgetConnected } from '@/components/battery-widget-connected';

export function Header() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { currentConversationId, messages } = useConversationStore();

  const hasMessages = currentConversationId && messages[currentConversationId]?.length > 0;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Battery Widget - positioned prominently in header */}
        <BatteryWidgetConnected />

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
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Settings"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && currentConversationId && (
        <PremiumExportDialog
          isOpen={true}
          onClose={() => setShowExportDialog(false)}
          conversationId={currentConversationId}
        />
      )}
    </header>
  );
}
