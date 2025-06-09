'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Paperclip, X, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  UploadResponse,
  FileAttachment,
} from '@/types/attachments';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  conversationId: string;
  messageId: string;
  onUploadComplete: (attachment: FileAttachment) => void;
  onError: (error: string) => void;
}

export function FileUpload({
  conversationId,
  messageId,
  onUploadComplete,
  onError,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      formData.append('messageId', messageId);

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = (await response.json()) as UploadResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }

        if (data.attachment) {
          onUploadComplete(data.attachment);
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [conversationId, messageId, onUploadComplete, onError]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          onError(`File ${file.name} is too large. Maximum size is 10MB.`);
          return;
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          onError(`File type ${file.type} is not allowed.`);
          return;
        }

        uploadFile(file);
      });
    },
    [uploadFile, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="text-muted-foreground mb-4 h-10 w-10" />
          <p className="text-muted-foreground text-sm">
            {isDragActive ? 'Drop files here...' : 'Drag and drop files here, or click to select'}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Supports images, PDFs, and text files (max 10MB)
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center rounded-lg">
          <div className="bg-background rounded-lg border p-4 shadow-lg">
            <p className="mb-2 text-sm">Uploading...</p>
            <div className="bg-muted h-2 w-48 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FileAttachmentDisplayProps {
  attachment: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    r2Key: string;
  };
  onRemove?: () => void;
}

export function FileAttachmentDisplay({ attachment, onRemove }: FileAttachmentDisplayProps) {
  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const Icon = isImage ? ImageIcon : isPdf ? FileText : Paperclip;

  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
      <Icon className="text-muted-foreground h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-muted-foreground text-xs">{formatFileSize(attachment.fileSize)}</p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-background rounded-md p-1 transition-colors"
          aria-label="Remove attachment"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
