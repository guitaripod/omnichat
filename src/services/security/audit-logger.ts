import { nanoid } from 'nanoid';
import { getD1Database } from '@/lib/db/get-db';
import { auditLogs, type NewAuditLog } from '@/lib/db/schema';
import type { User } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'api.chat.create'
  | 'api.chat.stream'
  | 'api.conversation.create'
  | 'api.conversation.delete'
  | 'api.message.create'
  | 'api.message.delete'
  | 'api.file.upload'
  | 'api.file.download'
  | 'api.models.list'
  | 'api.search.query'
  | 'api.key.update'
  | 'rate_limit.exceeded'
  | 'security.violation';

export type AuditResource =
  | 'auth'
  | 'chat'
  | 'conversation'
  | 'message'
  | 'file'
  | 'api_key'
  | 'models'
  | 'search';

export type AuditStatus = 'success' | 'failure' | 'error';

interface AuditLogOptions {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  metadata?: Record<string, any>;
  status: AuditStatus;
  errorMessage?: string;
  request?: NextRequest;
}

export class AuditLogger {
  private static getClientInfo(request?: NextRequest) {
    if (!request) return { ipAddress: null, userAgent: null };

    // Get IP address from Cloudflare headers or fallback
    const ipAddress =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    return { ipAddress, userAgent };
  }

  static async log(options: AuditLogOptions): Promise<void> {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(options.request);

      const logEntry: NewAuditLog = {
        id: nanoid(),
        userId: options.userId || null,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId || null,
        ipAddress,
        userAgent,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        status: options.status,
        errorMessage: options.errorMessage || null,
      };

      // Use async logging to avoid blocking the main request
      const db = getD1Database();
      await db.insert(auditLogs).values(logEntry).run();
    } catch (error) {
      // Log to console but don't throw - audit logging should not break the app
      console.error('[AuditLogger] Failed to log audit entry:', error);
    }
  }

  static async logApiRequest(
    request: NextRequest,
    user: User | null,
    action: AuditAction,
    resource: AuditResource,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId: user?.id,
      action,
      resource,
      metadata: {
        ...metadata,
        method: request.method,
        path: request.nextUrl.pathname,
      },
      status: 'success',
      request,
    });
  }

  static async logApiError(
    request: NextRequest,
    user: User | null,
    action: AuditAction,
    resource: AuditResource,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId: user?.id,
      action,
      resource,
      metadata: {
        ...metadata,
        method: request.method,
        path: request.nextUrl.pathname,
        errorType: error.name,
      },
      status: 'error',
      errorMessage: error.message,
      request,
    });
  }

  static async logSecurityEvent(
    request: NextRequest,
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'security.violation',
      resource: 'auth',
      metadata: {
        event,
        severity,
        ...metadata,
      },
      status: 'failure',
      request,
    });
  }
}
