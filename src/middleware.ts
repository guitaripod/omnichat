import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/api/conversations(.*)',
  '/api/user(.*)',
  '/api/images(.*)',
  '/api/battery(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/images(.*)',
  '/billing(.*)',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);

// Skip authentication in dev mode
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_BASE_URL || 'https://omnichat.pages.dev'
      : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Middleware that combines Clerk auth and CORS
const middleware =
  !isDevMode && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? clerkMiddleware(async (auth, req) => {
        // Handle CORS preflight requests first
        if (req.method === 'OPTIONS' && isApiRoute(req)) {
          return new NextResponse(null, { status: 200, headers: corsHeaders });
        }

        // Protect routes if needed
        if (isProtectedRoute(req)) {
          await auth.protect();
        }

        // For API routes, we need to add CORS headers
        if (isApiRoute(req)) {
          const response = NextResponse.next();
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        return NextResponse.next();
      })
    : (req: NextRequest) => {
        // Dev mode or no Clerk - just handle CORS
        if (req.method === 'OPTIONS' && isApiRoute(req)) {
          return new NextResponse(null, { status: 200, headers: corsHeaders });
        }

        const response = NextResponse.next();

        if (isApiRoute(req)) {
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }

        return response;
      };

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
