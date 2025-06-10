import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AuditLogger, type AuditAction, type AuditResource } from './audit-logger';

interface WithAuditOptions {
  action: AuditAction;
  resource: AuditResource;
  extractResourceId?: (req: NextRequest) => string | undefined;
}

export function withAudit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: WithAuditOptions
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await currentUser();
    const resourceId = options.extractResourceId?.(req);

    try {
      // Execute the handler
      const response = await handler(req);

      // Log successful request (async, non-blocking)
      AuditLogger.logApiRequest(
        req,
        user,
        options.action,
        options.resource,
        resourceId ? { resourceId } : undefined
      ).catch(console.error);

      return response;
    } catch (error) {
      // Log error (async, non-blocking)
      AuditLogger.logApiError(
        req,
        user,
        options.action,
        options.resource,
        error as Error,
        resourceId ? { resourceId } : undefined
      ).catch(console.error);

      // Re-throw the error to maintain original behavior
      throw error;
    }
  };
}
