'use client';

import { useState } from 'react';
import { Download, X, FileJson, FileText } from 'lucide-react';
import { useConversationStore } from '@/store/conversations';
import { ChatExporter } from '@/utils/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export function ExportDialog({ isOpen, onClose, conversationId }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('markdown');
  const [isExporting, setIsExporting] = useState(false);

  const { conversations, messages } = useConversationStore();

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = messages[conversationId] || [];

  if (!isOpen || !conversation) return null;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content: string;
      let mimeType: string;
      let format: 'json' | 'md';

      if (exportFormat === 'json') {
        content = ChatExporter.exportToJSON(conversation, conversationMessages);
        mimeType = 'application/json';
        format = 'json';
      } else {
        content = ChatExporter.exportToMarkdown(conversation, conversationMessages);
        mimeType = 'text/markdown';
        format = 'md';
      }

      const filename = ChatExporter.generateFilename(conversation, format);
      ChatExporter.downloadFile(filename, content, mimeType);

      // Close dialog after successful export
      setTimeout(onClose, 500);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed inset-x-4 top-1/2 mx-auto max-w-md -translate-y-1/2 transform rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Export Conversation
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Export "{conversation.title}" with {conversationMessages.length} messages
            </p>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('markdown')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  exportFormat === 'markdown'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Markdown</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  exportFormat === 'json'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <FileJson className="h-5 w-5" />
                <span className="font-medium">JSON</span>
              </button>
            </div>
          </div>

          {/* Format descriptions */}
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {exportFormat === 'markdown' ? (
              <p>
                <strong>Markdown format:</strong> Human-readable format with formatting. Perfect for
                sharing, documentation, or importing into note-taking apps.
              </p>
            ) : (
              <p>
                <strong>JSON format:</strong> Structured data format that preserves all metadata.
                Ideal for backups, data analysis, or importing into other tools.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
