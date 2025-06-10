import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/api/chat(.*)',
  '/api/conversations(.*)',
  '/api/user(.*)',
  '/profile(.*)',
  '/settings(.*)',
]);

// Skip authentication in dev mode
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Only apply Clerk middleware if not in dev mode and key is present
const middleware =
  !isDevMode && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? clerkMiddleware(async (auth, req) => {
        if (isProtectedRoute(req)) {
          await auth.protect();
        }
      })
    : (_req: NextRequest) => NextResponse.next();

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
