'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X } from 'lucide-react';
import { FileAttachment } from '@/types/attachments';
import { cn } from '@/lib/utils';

// Dynamic import for pdf.js to avoid SSR issues
let pdfjs: any;
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((module) => {
    pdfjs = module;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  });
}

interface PDFViewerProps {
  attachment: FileAttachment;
  onClose?: () => void;
}

export function PDFViewer({ attachment, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  const getAttachmentUrl = () => {
    return `/api/upload?key=${encodeURIComponent(attachment.r2Key)}`;
  };

  useEffect(() => {
    loadPDF();
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
    };
  }, [attachment.r2Key]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage, scale]);

  const loadPDF = async () => {
    if (!pdfjs) {
      setError('PDF.js is not loaded');
      return;
    }

    try {
      setLoading(true);
      const loadingTask = pdfjs.getDocument(getAttachmentUrl());
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setLoading(false);
      renderPage(1);
    } catch (err) {
      setError('Failed to load PDF');
      setLoading(false);
      console.error('PDF loading error:', err);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Page rendering error:', err);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadPDF}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 className="truncate pr-4 text-lg font-medium">{attachment.fileName}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="max-h-[70vh] overflow-auto bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-center p-4">
          <canvas ref={canvasRef} className="shadow-lg" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className={cn(
              'rounded-lg p-2 transition-colors',
              currentPage <= 1
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className={cn(
              'rounded-lg p-2 transition-colors',
              currentPage >= numPages
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className={cn(
              'rounded-lg p-2 transition-colors',
              scale <= 0.5
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[60px] text-center text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className={cn(
              'rounded-lg p-2 transition-colors',
              scale >= 3.0
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
