import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { isDevMode } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

export default function SignUpPage() {
  // In dev mode, redirect directly to chat
  if (isDevMode()) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
            footerActionLink: 'text-blue-600 hover:text-blue-700',
          },
        }}
        path="/auth/sign-up"
        signInUrl="/auth/sign-in"
        afterSignUpUrl="/chat"
      />
    </div>
  );
}
