'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  // In Cloudflare Pages, environment variables need to be accessed at build time
  // or passed from server components
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Always wrap with ClerkProvider, but without a key if not configured
  return (
    <BaseClerkProvider
      publishableKey={publishableKey || ''}
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      afterSignInUrl="/chat"
      afterSignUpUrl="/chat"
      signInFallbackRedirectUrl="/chat"
      signUpFallbackRedirectUrl="/chat"
    >
      {children}
    </BaseClerkProvider>
  );
}
