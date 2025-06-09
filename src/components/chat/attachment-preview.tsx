'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FileText, Download, X, Maximize2, Minimize2, Eye } from 'lucide-react';
import { FileAttachment } from '@/types/attachments';
import { cn } from '@/lib/utils';
import { PDFViewer } from './pdf-viewer';

interface AttachmentPreviewProps {
  attachment: FileAttachment;
  onRemove?: () => void;
}

export function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';

  const getAttachmentUrl = () => {
    return `/api/upload?key=${encodeURIComponent(attachment.r2Key)}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(getAttachmentUrl());
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isImage && !imageError) {
    return (
      <div className="group relative">
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border transition-all',
            'border-gray-200 dark:border-gray-700',
            isExpanded ? 'max-w-full' : 'max-w-sm',
            'hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          <div className="relative">
            <Image
              src={getAttachmentUrl()}
              alt={attachment.fileName}
              width={isExpanded ? 800 : 400}
              height={isExpanded ? 600 : 300}
              className="h-auto w-full"
              onError={() => setImageError(true)}
              priority={false}
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors hover:bg-black/50 hover:opacity-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-lg bg-white/90 p-2 transition-colors hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-700"
                  aria-label={isExpanded ? 'Minimize' : 'Maximize'}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-lg bg-white/90 p-2 transition-colors hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-700"
                  aria-label="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                {onRemove && (
                  <button
                    onClick={onRemove}
                    className="rounded-lg bg-white/90 p-2 transition-colors hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-700"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* File info */}
          <div className="bg-gray-50 p-2 dark:bg-gray-800/50">
            <p className="truncate text-xs text-gray-600 dark:text-gray-400">
              {attachment.fileName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Non-image file preview
  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600">
        <FileText className="h-8 w-8 shrink-0 text-gray-400 dark:text-gray-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.fileName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(attachment.fileSize)}
          </p>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {isPdf && (
            <button
              onClick={() => setShowPdfViewer(true)}
              className="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="View PDF"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdf && showPdfViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-4xl">
            <PDFViewer attachment={attachment} onClose={() => setShowPdfViewer(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
