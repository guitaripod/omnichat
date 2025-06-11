import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

// R2 bucket interface
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
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const model = formData.get('model') as string;
    const prompt = formData.get('prompt') as string;
    const originalSize = formData.get('originalSize') as string;

    if (!imageFile) {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Get R2 storage binding
    const R2_STORAGE = (process.env as any).R2_STORAGE as R2Bucket | undefined;
    if (!R2_STORAGE) {
      return Response.json({ success: false, error: 'R2 storage not configured' }, { status: 500 });
    }

    // Convert file to ArrayBuffer
    const imageBuffer = await imageFile.arrayBuffer();
    const compressedSize = imageBuffer.byteLength;

    // Generate R2 key
    const imageId = nanoid();
    const r2Key = `${userId}/generated-images/${model}/${imageId}.webp`;

    console.log('[Upload] Uploading compressed image to R2, key:', r2Key);
    console.log('[Upload] Compressed size:', (compressedSize / 1024).toFixed(2), 'KB');

    // Upload to R2
    await R2_STORAGE.put(r2Key, imageBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
      },
      customMetadata: {
        model: model || 'unknown',
        prompt: prompt ? prompt.substring(0, 100) : '', // First 100 chars of prompt
        generatedAt: new Date().toISOString(),
        originalSize: originalSize || '0',
        compressedSize: compressedSize.toString(),
        compressionRatio: originalSize
          ? Math.round(
              ((parseInt(originalSize) - compressedSize) / parseInt(originalSize)) * 100
            ).toString()
          : '0',
      },
    });

    // Generate the URL for accessing the image
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omnichat-7pu.pages.dev';
    const imageUrl = `${baseUrl}/api/images/${encodeURIComponent(r2Key)}`;

    return Response.json({
      success: true,
      url: imageUrl,
      key: r2Key,
      size: compressedSize,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return Response.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
  }
}
