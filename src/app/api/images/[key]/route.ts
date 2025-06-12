import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDevUser, isDevMode } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

// R2 bucket interface for Cloudflare Workers
interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    let userId: string | null = null;

    // Try Clerk auth first
    const authResult = await auth();
    if (authResult?.userId) {
      userId = authResult.userId;
    } else if (isDevMode()) {
      // Fallback to dev mode auth
      const devUser = await getDevUser();
      userId = devUser?.id || null;
    }

    if (!userId) {
      console.log('[Image API] No userId found in auth');
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { key: paramKey } = await params;
    // Decode the key first
    let key = decodeURIComponent(paramKey);

    console.log('[Image API] Requested key:', key);
    console.log('[Image API] User ID:', userId);

    // Get R2 binding from Cloudflare environment
    const R2_STORAGE = (process.env as any).R2_STORAGE as R2Bucket | undefined;
    if (!R2_STORAGE) {
      return Response.json({ success: false, error: 'R2 storage not configured' }, { status: 500 });
    }

    let object: R2Object | null = null;

    // If the key looks like an image ID (e.g., "IXwM6v5WBxFB6xBjPRGaR.webp"),
    // search for it in the user's generated-images folder
    if (key.endsWith('.webp') && !key.includes('/')) {
      const imageId = key.replace('.webp', '');

      // List objects to find the image with this ID
      // Note: R2 doesn't have a search function, so we need to use a prefix
      // In production, you'd want to store a mapping of imageId -> full path
      const possiblePaths = [
        `${userId}/generated-images/gpt-image-1/${imageId}.webp`,
        `${userId}/generated-images/dall-e-3/${imageId}.webp`,
        `${userId}/generated-images/dall-e-2/${imageId}.webp`,
      ];

      for (const path of possiblePaths) {
        object = await R2_STORAGE.get(path);
        if (object) {
          key = path;
          break;
        }
      }

      if (!object) {
        return Response.json({ success: false, error: 'Image not found' }, { status: 404 });
      }
    } else {
      // Verify access - check if the key contains the userId anywhere in the path
      // This handles both direct userId paths and full clerk user IDs
      if (!key.includes(userId) && !key.startsWith('generated-images/')) {
        console.log('[Image API] Access denied. Key:', key, 'does not contain userId:', userId);
        return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
      }

      object = await R2_STORAGE.get(key);
      if (!object) {
        return Response.json({ success: false, error: 'Image not found' }, { status: 404 });
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Image download error:', error);
    return Response.json({ success: false, error: 'Failed to download image' }, { status: 500 });
  }
}
