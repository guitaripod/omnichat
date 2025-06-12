import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { isDevMode } from '@/lib/auth/dev-auth';

export const runtime = 'edge';

export default async function SignUpPage() {
  // In dev mode, redirect directly to chat
  if (isDevMode()) {
    redirect('/chat');
  }

  // Check if user is already signed in
  const user = await currentUser();
  if (user) {
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
