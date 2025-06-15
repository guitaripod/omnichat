'use client';

import { useState } from 'react';
import {
  Download,
  X,
  FileJson,
  FileText,
  Image,
  FolderArchive,
  FileSpreadsheet,
  Calendar,
  Check,
  Crown,
} from 'lucide-react';
import { useConversationStore } from '@/store/conversations';
import { ChatExporter } from '@/utils/export';
import { ChatImageExporter } from '@/utils/export-image';
import { useTheme } from '@/hooks/use-theme';
import { useUserTier } from '@/hooks/use-user-tier';
import { UserTier } from '@/lib/tier';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from '@/components/premium-badge';
import { cn } from '@/lib/utils';

interface PremiumExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string; // Optional - if not provided, allow batch export
}

type ExportFormat = 'json' | 'markdown' | 'image' | 'csv' | 'pdf';
type ExportScope = 'single' | 'selected' | 'all' | 'date-range';

export function PremiumExportDialog({ isOpen, onClose, conversationId }: PremiumExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [exportScope, setExportScope] = useState<ExportScope>(conversationId ? 'single' : 'all');
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(
    conversationId ? new Set([conversationId]) : new Set()
  );
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const { theme } = useTheme();
  const { conversations, messages } = useConversationStore();
  const { tier } = useUserTier();
  const isPremium = tier === UserTier.PAID;

  if (!isOpen) return null;

  const getConversationsToExport = (): string[] => {
    switch (exportScope) {
      case 'single':
        return conversationId ? [conversationId] : [];
      case 'selected':
        return Array.from(selectedConversations);
      case 'all':
        return conversations.map((c) => c.id);
      case 'date-range':
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        return conversations
          .filter((c) => {
            if (start && c.updatedAt < start) return false;
            if (end && c.updatedAt > end) return false;
            return true;
          })
          .map((c) => c.id);
      default:
        return [];
    }
  };

  const exportToCSV = (conversationIds: string[]): string => {
    const rows: string[][] = [
      ['Conversation ID', 'Title', 'Model', 'Date', 'Role', 'Content', 'Tokens'],
    ];

    conversationIds.forEach((convId) => {
      const conv = conversations.find((c) => c.id === convId);
      const msgs = messages[convId] || [];

      msgs.forEach((msg) => {
        rows.push([
          conv?.id || '',
          conv?.title || '',
          conv?.model || '',
          msg.createdAt.toISOString(),
          msg.role,
          msg.content.replace(/"/g, '""'), // Escape quotes
          (msg.content.length / 4).toFixed(0), // Rough token estimate
        ]);
      });
    });

    return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const exportToPDF = async (conversationIds: string[]): Promise<void> => {
    // This would require a PDF library like jsPDF
    // For now, we'll export as formatted HTML that can be printed to PDF
    const htmlContent = conversationIds
      .map((convId) => {
        const conv = conversations.find((c) => c.id === convId);
        const msgs = messages[convId] || [];

        return `
        <div style="page-break-after: always;">
          <h1>${conv?.title || 'Untitled'}</h1>
          <p>Model: ${conv?.model || 'Unknown'} | Date: ${conv?.updatedAt.toLocaleDateString()}</p>
          <hr>
          ${msgs
            .map(
              (msg) => `
            <div style="margin: 10px 0;">
              <strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong>
              <p>${msg.content}</p>
            </div>
          `
            )
            .join('')}
        </div>
      `;
      })
      .join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>OmniChat Export</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; }
              hr { margin: 20px 0; }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = async () => {
    if (!isPremium && exportScope !== 'single') {
      // Redirect to pricing for batch export
      window.location.href = '/pricing';
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const conversationIds = getConversationsToExport();
      const totalConversations = conversationIds.length;

      if (exportFormat === 'csv') {
        const csvContent = exportToCSV(conversationIds);
        const filename = `omnichat_export_${new Date().toISOString().split('T')[0]}.csv`;
        ChatExporter.downloadFile(filename, csvContent, 'text/csv');
      } else if (exportFormat === 'pdf') {
        await exportToPDF(conversationIds);
      } else if (exportScope === 'single' && conversationId) {
        // Single conversation export
        const conversation = conversations.find((c) => c.id === conversationId);
        const conversationMessages = messages[conversationId] || [];

        if (!conversation) return;

        if (exportFormat === 'json') {
          const content = ChatExporter.exportToJSON(conversation, conversationMessages);
          const filename = ChatExporter.generateFilename(conversation, 'json');
          ChatExporter.downloadFile(filename, content, 'application/json');
        } else if (exportFormat === 'markdown') {
          const content = ChatExporter.exportToMarkdown(conversation, conversationMessages);
          const filename = ChatExporter.generateFilename(conversation, 'md');
          ChatExporter.downloadFile(filename, content, 'text/markdown');
        } else if (exportFormat === 'image') {
          const blob = await ChatImageExporter.exportToImage(
            conversation,
            conversationMessages,
            theme as 'light' | 'dark'
          );
          const filename = `omnichat_${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.png`;
          ChatImageExporter.downloadImage(blob, filename);
        }
      } else {
        // Batch export - create a zip file
        const exportData: {
          exportDate: string;
          totalConversations: number;
          conversations: Array<any>;
        } = {
          exportDate: new Date().toISOString(),
          totalConversations,
          conversations: [],
        };

        for (let i = 0; i < conversationIds.length; i++) {
          const convId = conversationIds[i];
          const conv = conversations.find((c) => c.id === convId);
          const msgs = messages[convId] || [];

          if (conv) {
            if (exportFormat === 'json') {
              exportData.conversations.push({
                ...conv,
                messages: msgs,
              });
            } else if (exportFormat === 'markdown') {
              const content = ChatExporter.exportToMarkdown(conv, msgs);
              exportData.conversations.push({
                id: conv.id,
                title: conv.title,
                content,
              });
            }
          }

          setExportProgress(((i + 1) / totalConversations) * 100);
        }

        // For batch export, create a single file
        const filename = `omnichat_batch_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        const content =
          exportFormat === 'json'
            ? JSON.stringify(exportData, null, 2)
            : exportData.conversations.map((c) => (c as any).content).join('\n\n---\n\n');

        ChatExporter.downloadFile(
          filename,
          content,
          exportFormat === 'json' ? 'application/json' : 'text/markdown'
        );
      }

      // Close dialog after successful export
      setTimeout(onClose, 500);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const toggleConversationSelection = (convId: string) => {
    const newSelection = new Set(selectedConversations);
    if (newSelection.has(convId)) {
      newSelection.delete(convId);
    } else {
      newSelection.add(convId);
    }
    setSelectedConversations(newSelection);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed inset-x-4 top-1/2 mx-auto max-w-2xl -translate-y-1/2 transform rounded-xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Conversations
              </h2>
              {isPremium && <PremiumBadge size="sm" />}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Export Scope */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                What to Export
              </label>
              <div className="grid grid-cols-2 gap-3">
                {conversationId && (
                  <button
                    onClick={() => setExportScope('single')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors',
                      exportScope === 'single'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Current Chat</span>
                  </button>
                )}
                <button
                  onClick={() => setExportScope('all')}
                  disabled={!isPremium}
                  className={cn(
                    'relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors',
                    exportScope === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                    !isPremium && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <FolderArchive className="h-5 w-5" />
                  <span className="font-medium">All Chats</span>
                  {!isPremium && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 gap-1">
                      <Crown className="h-3 w-3" />
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setExportScope('selected')}
                  disabled={!isPremium}
                  className={cn(
                    'relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors',
                    exportScope === 'selected'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                    !isPremium && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Selected</span>
                  {!isPremium && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 gap-1">
                      <Crown className="h-3 w-3" />
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setExportScope('date-range')}
                  disabled={!isPremium}
                  className={cn(
                    'relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors',
                    exportScope === 'date-range'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                    !isPremium && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Date Range</span>
                  {!isPremium && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 gap-1">
                      <Crown className="h-3 w-3" />
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* Conversation Selection */}
            {exportScope === 'selected' && isPremium && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Conversations
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border dark:border-gray-700">
                  {conversations.map((conv) => (
                    <label
                      key={conv.id}
                      className="flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedConversations.has(conv.id)}
                        onChange={() => toggleConversationSelection(conv.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{conv.title}</div>
                        <div className="text-xs text-gray-500">
                          {conv.updatedAt.toLocaleDateString()} • {messages[conv.id]?.length || 0}{' '}
                          messages
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range Selection */}
            {exportScope === 'date-range' && isPremium && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setExportFormat('markdown')}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                    exportFormat === 'markdown'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  )}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-medium">Markdown</span>
                </button>
                <button
                  onClick={() => setExportFormat('json')}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                    exportFormat === 'json'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  )}
                >
                  <FileJson className="h-5 w-5" />
                  <span className="text-xs font-medium">JSON</span>
                </button>
                {exportScope === 'single' && (
                  <button
                    onClick={() => setExportFormat('image')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                      exportFormat === 'image'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                  >
                    <Image className="h-5 w-5" />
                    <span className="text-xs font-medium">Image</span>
                  </button>
                )}
                {isPremium && (
                  <>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={cn(
                        'relative flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                        exportFormat === 'csv'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                    >
                      <FileSpreadsheet className="h-5 w-5" />
                      <span className="text-xs font-medium">CSV</span>
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                        <Crown className="h-3 w-3" />
                      </Badge>
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={cn(
                        'relative flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                        exportFormat === 'pdf'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-xs font-medium">PDF</span>
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                        <Crown className="h-3 w-3" />
                      </Badge>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Format Description */}
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {exportFormat === 'markdown' && (
                <p>
                  <strong>Markdown:</strong> Human-readable format with formatting preserved.
                  Perfect for documentation or notes.
                </p>
              )}
              {exportFormat === 'json' && (
                <p>
                  <strong>JSON:</strong> Structured data with all metadata. Ideal for backups or
                  data analysis.
                </p>
              )}
              {exportFormat === 'image' && (
                <p>
                  <strong>Image:</strong> Visual summary card for sharing or quick reference.
                </p>
              )}
              {exportFormat === 'csv' && (
                <p>
                  <strong>CSV:</strong> Spreadsheet format for analysis in Excel or Google Sheets.{' '}
                  <span className="text-purple-600 dark:text-purple-400">Premium feature.</span>
                </p>
              )}
              {exportFormat === 'pdf' && (
                <p>
                  <strong>PDF:</strong> Print-ready format with professional formatting.{' '}
                  <span className="text-purple-600 dark:text-purple-400">Premium feature.</span>
                </p>
              )}
            </div>

            {/* Export Progress */}
            {isExporting && exportProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exporting conversations...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-6 pt-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={
                isExporting || (exportScope === 'selected' && selectedConversations.size === 0)
              }
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-colors',
                isPremium
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                  : 'bg-blue-600 hover:bg-blue-700',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          {!isPremium && exportScope !== 'single' && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Batch export is a premium feature.{' '}
              <a
                href="/pricing"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Upgrade to Premium
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
