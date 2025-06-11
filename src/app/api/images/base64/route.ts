import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { base64Data?: string; conversationId?: string };
    const { base64Data, conversationId } = body;

    if (!base64Data || !conversationId) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Get R2 binding from Cloudflare environment
    const R2_STORAGE = (process.env as any).R2_STORAGE as R2Bucket | undefined;

    // If R2 is not available, return the base64 as-is (fallback for local dev)
    if (!R2_STORAGE) {
      console.log('[Base64Upload] R2 not available, using base64 directly');
      return Response.json({
        success: true,
        url: `data:image/png;base64,${base64Data}`,
      });
    }

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Compress the image
    const originalSize = bytes.buffer.byteLength;
    console.log('[Base64Upload] Original size:', (originalSize / 1024).toFixed(2), 'KB');

    const compressedBuffer = await compressImage(bytes.buffer, {
      quality: 0.1,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    const compressedSize = compressedBuffer.byteLength;
    const savings = estimateCompressionSavings(originalSize, compressedSize);
    console.log(`[Base64Upload] Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(
      `[Base64Upload] Saved: ${savings.humanReadableSaved} (${savings.savedPercentage}%)`
    );

    // Generate unique key for R2
    const imageId = nanoid();
    const r2Key = `${userId}/generated-images/${conversationId}/${imageId}.webp`;

    // Upload to R2
    await R2_STORAGE.put(r2Key, compressedBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
      customMetadata: {
        userId,
        conversationId,
        generatedAt: new Date().toISOString(),
        originalSize: originalSize.toString(),
        compressedSize: compressedSize.toString(),
        compressionRatio: savings.savedPercentage.toString(),
      },
    });

    // Return the URL to fetch the image
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const url = `${baseUrl}/api/images/${encodeURIComponent(r2Key)}`;

    return Response.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}
