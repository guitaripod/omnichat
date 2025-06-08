'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no publishable key, render children without Clerk
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      afterSignInUrl="/chat"
      afterSignUpUrl="/chat"
    >
      {children}
    </BaseClerkProvider>
  );
}
