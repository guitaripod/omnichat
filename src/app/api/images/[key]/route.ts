import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const key = decodeURIComponent(params.key);

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
      return Response.json({ success: false, error: 'Image not found' }, { status: 404 });
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
