import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'edge';

interface R2Bucket {
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  checksums: Record<string, string>;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
}

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get R2 storage binding
    const R2_STORAGE = (process.env as any).R2_STORAGE as R2Bucket | undefined;
    if (!R2_STORAGE) {
      return Response.json({ success: false, error: 'R2 storage not configured' }, { status: 500 });
    }

    // List all images for this user
    const prefix = `${userId}/generated-images/`;
    console.log('[Image List] Listing images with prefix:', prefix);
    const result = await R2_STORAGE.list({ prefix, limit: 1000 });
    console.log('[Image List] Found', result.objects.length, 'images');

    // Transform R2 objects to image data
    const images = result.objects.map((obj) => {
      // Parse model from key: userId/generated-images/model/imageId.webp
      const keyParts = obj.key.split('/');
      const model = keyParts[2] || 'unknown';
      const fileName = keyParts[3] || obj.key;

      // Generate the URL for accessing the image
      // Use relative URL so it works in any environment
      const imageUrl = `/api/images/${encodeURIComponent(obj.key)}`;

      return {
        id: obj.key,
        url: imageUrl,
        model: model,
        fileName: fileName,
        size: obj.size,
        uploaded: obj.uploaded,
        prompt: obj.customMetadata?.prompt || 'Generated image',
        originalSize: obj.customMetadata?.originalSize || '0',
        compressedSize: obj.customMetadata?.compressedSize || obj.size.toString(),
        compressionRatio: obj.customMetadata?.compressionRatio || '0',
      };
    });

    // Sort by upload date (newest first)
    images.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

    return Response.json({
      success: true,
      images,
      total: images.length,
    });
  } catch (error) {
    console.error('Error listing images:', error);
    return Response.json({ success: false, error: 'Failed to list images' }, { status: 500 });
  }
}
