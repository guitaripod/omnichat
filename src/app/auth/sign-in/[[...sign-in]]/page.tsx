import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { isDevMode } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

export default function SignInPage() {
  // In dev mode, redirect directly to chat
  if (isDevMode()) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
            footerActionLink: 'text-blue-600 hover:text-blue-700',
          },
        }}
        path="/auth/sign-in"
        signUpUrl="/auth/sign-up"
        afterSignInUrl="/chat"
      />
    </div>
  );
}
