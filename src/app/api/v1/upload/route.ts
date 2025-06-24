import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { withApiAuth, withRateLimit } from '@/lib/api/middleware/auth';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { attachments } from '@/lib/db/schema';
import type { CloudflareEnv } from '@/../../env';

export const runtime = 'edge';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/xml',
];

// POST /api/v1/upload - Upload file to R2
export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      return withApiAuth(request, async (req) => {
        try {
          const formData = await request.formData();
          const file = formData.get('file') as File;
          const conversationId = formData.get('conversationId') as string;
          const messageId = formData.get('messageId') as string | null;

          if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
          }

          if (!conversationId) {
            return NextResponse.json(
              { error: 'conversationId is required' },
              { status: 400 }
            );
          }

          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
              { status: 400 }
            );
          }

          // Validate file type
          if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
              { error: 'File type not allowed' },
              { status: 400 }
            );
          }

          const userId = req.user!.id;
          const database = db();
          const env = getRequestContext().env as CloudflareEnv;

          // Generate unique key
          const fileId = nanoid();
          const extension = file.name.split('.').pop() || 'bin';
          const key = `${userId}/${conversationId}/${messageId || 'temp'}/${fileId}.${extension}`;

          // Upload to R2
          const arrayBuffer = await file.arrayBuffer();
          await env.R2_STORAGE.put(key, arrayBuffer, {
            httpMetadata: {
              contentType: file.type,
            },
            customMetadata: {
              userId,
              conversationId,
              messageId: messageId || '',
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
            },
          });

          // Create attachment record
          const attachmentId = nanoid();
          const url = `/api/v1/files/${encodeURIComponent(key)}`;

          await database.insert(attachments).values({
            id: attachmentId,
            messageId: messageId || attachmentId, // Temporary, will be updated when message is created
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            r2Key: key,
            url,
          });

          return NextResponse.json({
            id: attachmentId,
            url,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            key,
          });
        } catch (error) {
          console.error('Upload error:', error);
          return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }
      });
    },
    { windowMs: 60000, max: 20 } // Stricter rate limit for uploads
  );
}

// GET /api/v1/upload/presigned - Get presigned upload URL (optional, for direct uploads)
export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withApiAuth(request, async (req) => {
      const { searchParams } = new URL(request.url);
      const fileName = searchParams.get('fileName');
      const fileType = searchParams.get('fileType');
      const conversationId = searchParams.get('conversationId');

      if (!fileName || !fileType || !conversationId) {
        return NextResponse.json(
          { error: 'fileName, fileType, and conversationId are required' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(fileType)) {
        return NextResponse.json(
          { error: 'File type not allowed' },
          { status: 400 }
        );
      }

      const userId = req.user!.id;
      const fileId = nanoid();
      const extension = fileName.split('.').pop() || 'bin';
      const key = `${userId}/${conversationId}/temp/${fileId}.${extension}`;

      // In production, you would generate a presigned URL here
      // For now, return upload instructions
      return NextResponse.json({
        uploadUrl: '/api/v1/upload',
        method: 'POST',
        fields: {
          key,
          conversationId,
        },
        expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });
    });
  });
}