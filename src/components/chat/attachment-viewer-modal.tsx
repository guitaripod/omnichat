'use client';

import { useEffect, useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { FileAttachment } from '@/types/attachments';
import { PDFViewer } from './pdf-viewer';
import { cn } from '@/lib/utils';

interface AttachmentViewerModalProps {
  attachments: FileAttachment[];
  initialIndex?: number;
  onClose: () => void;
}

export function AttachmentViewerModal({
  attachments,
  initialIndex = 0,
  onClose,
}: AttachmentViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentAttachment = attachments[currentIndex];

  const isImage = currentAttachment?.mimeType.startsWith('image/');
  const isPdf = currentAttachment?.mimeType === 'application/pdf';
  const isTextFile = ['text/plain', 'text/markdown', 'application/json', 'text/csv'].includes(
    currentAttachment?.mimeType || ''
  );

  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < attachments.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, attachments.length, onClose]);

  useEffect(() => {
    if (isTextFile && currentAttachment) {
      loadTextContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAttachment, isTextFile]);

  const getAttachmentUrl = (attachment: FileAttachment) => {
    return `/api/upload?key=${encodeURIComponent(attachment.r2Key)}`;
  };

  const loadTextContent = async () => {
    if (!currentAttachment) return;

    try {
      setLoading(true);
      const response = await fetch(getAttachmentUrl(currentAttachment));
      if (!response.ok) throw new Error('Failed to load file');
      const text = await response.text();
      setTextContent(text);
    } catch (error) {
      console.error('Error loading text file:', error);
      setTextContent('Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentAttachment) return;

    try {
      const response = await fetch(getAttachmentUrl(currentAttachment));
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentAttachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setTextContent(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTextContent(null);
    }
  };

  if (!currentAttachment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Header */}
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-4">
          <h3 className="max-w-md truncate text-lg font-medium">{currentAttachment.fileName}</h3>
          {attachments.length > 1 && (
            <span className="text-sm text-gray-300">
              {currentIndex + 1} / {attachments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
            aria-label="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
      {attachments.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={cn(
              'absolute left-4 rounded-lg bg-white/10 p-3 transition-colors hover:bg-white/20',
              currentIndex === 0 && 'cursor-not-allowed opacity-50'
            )}
            aria-label="Previous attachment"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === attachments.length - 1}
            className={cn(
              'absolute right-4 rounded-lg bg-white/10 p-3 transition-colors hover:bg-white/20',
              currentIndex === attachments.length - 1 && 'cursor-not-allowed opacity-50'
            )}
            aria-label="Next attachment"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="mx-auto max-h-[90vh] max-w-7xl px-16">
        {isImage && (
          <div className="relative">
            <Image
              src={getAttachmentUrl(currentAttachment)}
              alt={currentAttachment.fileName}
              width={1200}
              height={800}
              className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
              priority
            />
          </div>
        )}

        {isPdf && (
          <div className="w-full" style={{ width: '90vw', maxWidth: '1200px' }}>
            <PDFViewer attachment={currentAttachment} />
          </div>
        )}

        {isTextFile && (
          <div className="max-h-[80vh] max-w-4xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {textContent || 'No content'}
              </pre>
            )}
          </div>
        )}

        {!isImage && !isPdf && !isTextFile && (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-900">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Preview not available for this file type
            </p>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Download {currentAttachment.fileName}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
