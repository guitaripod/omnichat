import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';

export const runtime = 'edge';

// GET /api/v1/files/[...key] - Retrieve file from R2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      try {
        const { key: keyParts } = await params;
        const key = keyParts.join('/');
        const userId = req.user!.id;
        const env = getRequestContext().env;

        // Verify user owns this file
        if (!key.startsWith(`${userId}/`)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get object from R2
        const object = await env.R2_STORAGE.get(key);

        if (!object) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Get file data
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('cache-control', 'private, max-age=3600'); // 1 hour cache

        // Add content disposition for downloads
        const metadata = await object.customMetadata;
        if (metadata?.originalName) {
          headers.set(
            'content-disposition',
            `inline; filename="${metadata.originalName}"`
          );
        }

        return new NextResponse(object.body, { headers });
      } catch (error) {
        console.error('File retrieval error:', error);
        return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
      }
    });
  });
}

// DELETE /api/v1/files/[...key] - Delete file from R2
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      try {
        const { key: keyParts } = await params;
        const key = keyParts.join('/');
        const userId = req.user!.id;
        const env = getRequestContext().env;

        // Verify user owns this file
        if (!key.startsWith(`${userId}/`)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Delete from R2
        await env.R2_STORAGE.delete(key);

        // Note: In production, you'd also want to delete the attachment record from D1

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('File deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
      }
    });
  });
}