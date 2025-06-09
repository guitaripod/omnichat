export interface FileAttachment {
  id: string;
  conversationId: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  r2Key: string;
}

export interface UploadResponse {
  success: boolean;
  attachment?: FileAttachment;
  error?: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
];
