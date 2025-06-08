import { SignIn } from '@clerk/nextjs';

export const runtime = 'edge';

export default function SignInPage() {
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
