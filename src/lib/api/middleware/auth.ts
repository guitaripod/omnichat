import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '../auth/jwt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    scope: string[];
  };
}

// API authentication middleware
export async function withApiAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const payload = await verifyToken<JWTPayload>(token);

    // Verify user exists in database
    const database = db();
    const user = await database.select().from(users).where(eq(users.id, payload.sub)).get();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Add user info to request
    (request as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      scope: payload.scope,
    };

    // Call the handler
    return handler(request as AuthenticatedRequest);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

// Check if user has required scope
export function hasScope(userScopes: string[], requiredScope: string): boolean {
  return userScopes.includes(requiredScope) || userScopes.includes('admin');
}

// Rate limiting middleware (simple in-memory for local testing)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options = { windowMs: 60000, max: 100 } // 100 requests per minute default
): Promise<NextResponse> {
  const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();

  let clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + options.windowMs,
    };
  }

  clientData.count++;
  rateLimitMap.set(clientId, clientData);

  if (clientData.count > options.max) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': options.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
        },
      }
    );
  }

  const response = await handler();

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', options.max.toString());
  response.headers.set('X-RateLimit-Remaining', (options.max - clientData.count).toString());
  response.headers.set('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

  return response;
}
