'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { useDevMode } from '@/hooks/use-dev-mode';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const isDevMode = useDevMode();
  // In Cloudflare Pages, environment variables need to be accessed at build time
  // or passed from server components
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If in dev mode or no publishable key, render children without Clerk
  if (isDevMode || !publishableKey) {
    if (!isDevMode && !publishableKey) {
      console.warn('Clerk publishable key not found');
    }
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
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
