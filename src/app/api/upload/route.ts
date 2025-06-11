import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  FileAttachment,
  UploadResponse,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from '@/types/attachments';
import { nanoid } from 'nanoid';
import { compressImage, estimateCompressionSavings } from '@/utils/image-compression';

export const runtime = 'edge';

// R2 bucket interface for Cloudflare Workers
interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream,
    options?: R2PutOptions
  ): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
  body: ReadableStream;
}

interface R2ListOptions {
  prefix?: string;
  cursor?: string;
  include?: string[];
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get R2 binding from Cloudflare environment
    const R2_STORAGE = (process.env as any).R2_STORAGE as R2Bucket | undefined;
    if (!R2_STORAGE) {
      return Response.json({ success: false, error: 'R2 storage not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    const messageId = formData.get('messageId') as string;

    if (!file || !conversationId || !messageId) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return Response.json({ success: false, error: 'File type not allowed' }, { status: 400 });
    }

    // Generate unique key for R2
    const fileId = nanoid();
    let fileExtension = file.name.split('.').pop() || '';
    let arrayBuffer = await file.arrayBuffer();
    let finalMimeType = file.type;
    let compressedSize = arrayBuffer.byteLength;

    // Compress if it's an image (excluding SVG)
    if (file.type.startsWith('image/') && !file.type.includes('svg')) {
      try {
        const originalSize = arrayBuffer.byteLength;
        console.log(
          '[Upload] Compressing image, original size:',
          (originalSize / 1024).toFixed(2),
          'KB'
        );

        const compressedBuffer = await compressImage(arrayBuffer, {
          quality: 0.1,
          maxWidth: 2048,
          maxHeight: 2048,
        });

        compressedSize = compressedBuffer.byteLength;
        const savings = estimateCompressionSavings(originalSize, compressedSize);
        console.log(`[Upload] Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
        console.log(`[Upload] Saved: ${savings.humanReadableSaved} (${savings.savedPercentage}%)`);

        // Use compressed version if it's smaller
        if (compressedSize < originalSize) {
          arrayBuffer = compressedBuffer;
          finalMimeType = 'image/webp';
          fileExtension = 'webp';
        }
      } catch (error) {
        console.error('[Upload] Compression failed, using original:', error);
      }
    }

    const r2Key = `${userId}/${conversationId}/${messageId}/${fileId}.${fileExtension}`;

    // Upload to R2
    await R2_STORAGE.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: finalMimeType,
      },
      customMetadata: {
        userId,
        conversationId,
        messageId,
        fileName: file.name,
        originalSize: file.size.toString(),
        finalSize: compressedSize.toString(),
      },
    });

    const attachment: FileAttachment = {
      id: fileId,
      conversationId,
      messageId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      r2Key,
    };

    const response: UploadResponse = {
      success: true,
      attachment,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return Response.json({ success: false, error: 'Missing key parameter' }, { status: 400 });
    }

    // Verify user owns this file
    if (!key.startsWith(`${userId}/`)) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get R2 binding from Cloudflare environment
    const R2_STORAGE = (process.env as any).R2_STORAGE as R2Bucket | undefined;
    if (!R2_STORAGE) {
      return Response.json({ success: false, error: 'R2 storage not configured' }, { status: 500 });
    }

    const object = await R2_STORAGE.get(key);
    if (!object) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Download error:', error);
    return Response.json({ success: false, error: 'Failed to download file' }, { status: 500 });
  }
}
