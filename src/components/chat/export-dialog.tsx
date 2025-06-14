'use client';

import { useState } from 'react';
import {
  Download,
  X,
  FileJson,
  FileText,
  Image,
  Copy,
  Check,
  Calendar,
  FileSpreadsheet,
  FileType2,
} from 'lucide-react';
import { useConversationStore } from '@/store/conversations';
import { ChatExporter } from '@/utils/export';
import { ChatImageExporter } from '@/utils/export-image';
import { useTheme } from '@/hooks/use-theme';
import { useUserTier } from '@/hooks/use-user-tier';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
}

type ExportScope = 'current' | 'all' | 'selected' | 'date-range';
type ExportFormat = 'markdown' | 'json' | 'image' | 'csv' | 'pdf';

export function ExportDialog({ isOpen, onClose, conversationId }: ExportDialogProps) {
  const [exportScope, setExportScope] = useState<ExportScope>(conversationId ? 'current' : 'all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [selectedConversations] = useState<string[]>([]);
  const [dateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const { theme } = useTheme();
  const { isPaidUser } = useUserTier();

  const { conversations, messages } = useConversationStore();

  const conversation = conversationId ? conversations.find((c) => c.id === conversationId) : null;
  const conversationMessages = conversationId ? messages[conversationId] || [] : [];

  if (!isOpen) return null;

  const formatOptions: {
    value: ExportFormat;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isPro?: boolean;
  }[] = [
    { value: 'markdown', label: 'Markdown', icon: FileText },
    { value: 'json', label: 'JSON', icon: FileJson },
    { value: 'image', label: 'Image', icon: Image },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, isPro: true },
    { value: 'pdf', label: 'PDF', icon: FileType2, isPro: true },
  ];

  const getConversationsToExport = () => {
    switch (exportScope) {
      case 'current':
        return conversation ? [conversation] : [];
      case 'all':
        return conversations;
      case 'selected':
        return conversations.filter((c) => selectedConversations.includes(c.id));
      case 'date-range':
        if (!dateRange.start || !dateRange.end) return [];
        return conversations.filter((c) => {
          const convDate = new Date(c.createdAt);
          return convDate >= dateRange.start! && convDate <= dateRange.end!;
        });
      default:
        return [];
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const conversationsToExport = getConversationsToExport();

      if (conversationsToExport.length === 0) {
        toast.error('No conversations selected for export');
        return;
      }

      // Check if user can export premium formats
      if ((exportFormat === 'csv' || exportFormat === 'pdf') && !isPaidUser) {
        toast.error('CSV and PDF exports are available for premium users');
        return;
      }

      if (exportFormat === 'markdown' || exportFormat === 'json') {
        // For single conversation
        if (conversationsToExport.length === 1) {
          const conv = conversationsToExport[0];
          const msgs = messages[conv.id] || [];

          let content: string;
          let mimeType: string;
          let format: 'json' | 'md';

          if (exportFormat === 'json') {
            content = ChatExporter.exportToJSON(conv, msgs);
            mimeType = 'application/json';
            format = 'json';
          } else {
            content = ChatExporter.exportToMarkdown(conv, msgs);
            mimeType = 'text/markdown';
            format = 'md';
          }

          const filename = ChatExporter.generateFilename(conv, format);
          ChatExporter.downloadFile(filename, content, mimeType);
        } else {
          // For multiple conversations, create a zip or combined file
          // For now, we'll export them separately
          for (const conv of conversationsToExport) {
            const msgs = messages[conv.id] || [];

            let content: string;
            let mimeType: string;
            let format: 'json' | 'md';

            if (exportFormat === 'json') {
              content = ChatExporter.exportToJSON(conv, msgs);
              mimeType = 'application/json';
              format = 'json';
            } else {
              content = ChatExporter.exportToMarkdown(conv, msgs);
              mimeType = 'text/markdown';
              format = 'md';
            }

            const filename = ChatExporter.generateFilename(conv, format);
            ChatExporter.downloadFile(filename, content, mimeType);
          }
        }
      } else if (exportFormat === 'image') {
        // Image export only for single conversation
        if (conversationsToExport.length === 1) {
          const conv = conversationsToExport[0];
          const msgs = messages[conv.id] || [];

          const blob = await ChatImageExporter.exportToImage(conv, msgs, theme as 'light' | 'dark');
          const filename = `omnichat_${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.png`;
          ChatImageExporter.downloadImage(blob, filename);
        } else {
          toast.error('Image export is only available for single conversations');
          return;
        }
      } else if (exportFormat === 'csv') {
        // CSV export implementation (premium feature)
        toast.info('CSV export coming soon for premium users!');
      } else if (exportFormat === 'pdf') {
        // PDF export implementation (premium feature)
        toast.info('PDF export coming soon for premium users!');
      }

      toast.success('Export completed successfully');
      setTimeout(onClose, 500);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDescription = {
    markdown:
      'Human-readable format with formatting preserved. Perfect for documentation or notes.',
    json: 'Structured data format preserving all metadata. Ideal for backups or data analysis.',
    image: 'Visual summary card of the conversation. Great for sharing or quick reference.',
    csv: 'Spreadsheet format for data analysis and reporting. Premium feature.',
    pdf: 'Professional document format with full conversation history. Premium feature.',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed inset-x-4 top-1/2 mx-auto max-w-2xl -translate-y-1/2 transform rounded-2xl bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Export Conversations</h2>
            <div className="rounded-full bg-purple-600 p-1">
              <Download className="h-4 w-4 text-white" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* What to Export */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-400">What to Export</h3>
            <div className="grid grid-cols-2 gap-3">
              {conversationId && (
                <button
                  onClick={() => setExportScope('current')}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                    exportScope === 'current'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Current Chat
                </button>
              )}
              <button
                onClick={() => setExportScope('all')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                  exportScope === 'all'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                <Copy className="h-4 w-4" />
                All Chats
              </button>
              <button
                onClick={() => {
                  setExportScope('selected');
                  // TODO: Implement conversation picker
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                  exportScope === 'selected'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                <Check className="h-4 w-4" />
                Selected
              </button>
              <button
                onClick={() => {
                  setExportScope('date-range');
                  // TODO: Implement date range picker
                }}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                  exportScope === 'date-range'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Date Range
              </button>
            </div>
          </div>

          {/* Export Format */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-400">Export Format</h3>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.slice(0, 3).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExportFormat(option.value)}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                    exportFormat === option.value
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {formatOptions.slice(3).map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.isPro && !isPaidUser) {
                      toast.error('This format is available for premium users');
                    } else {
                      setExportFormat(option.value);
                    }
                  }}
                  disabled={option.isPro && !isPaidUser}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                    exportFormat === option.value
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : option.isPro && !isPaidUser
                        ? 'cursor-not-allowed border-gray-800 text-gray-600'
                        : 'border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {option.isPro && (
                    <span className="absolute top-2 right-2 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Pro
                    </span>
                  )}
                  <option.icon className="h-5 w-5" />
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format Description */}
          <div className="mb-6 rounded-lg bg-gray-800/50 p-4">
            <p className="text-sm text-gray-300">
              <span className="font-medium text-white">
                {formatOptions.find((f) => f.value === exportFormat)?.label}:
              </span>{' '}
              {formatDescription[exportFormat]}
            </p>
          </div>

          {/* Export Info */}
          <div className="mb-4 text-sm text-gray-400">
            {exportScope === 'current' && conversation && (
              <p>
                Exporting "{conversation.title}" with {conversationMessages.length} messages
              </p>
            )}
            {exportScope === 'all' && <p>Exporting all {conversations.length} conversations</p>}
            {exportScope === 'selected' && (
              <p>Selected {selectedConversations.length} conversations to export</p>
            )}
            {exportScope === 'date-range' && dateRange.start && dateRange.end && (
              <p>
                Exporting conversations from {format(dateRange.start, 'MMM d, yyyy')} to{' '}
                {format(dateRange.end, 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-800 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 font-medium text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
