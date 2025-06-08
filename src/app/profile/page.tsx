import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Authentication not configured</p>
      </div>
    );
  }

  const user = await currentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>

          <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="mb-6 flex items-center space-x-4">
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'h-16 w-16',
                    },
                  }}
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  User ID
                </h3>
                <p className="text-gray-900 dark:text-white">{user.id}</p>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member Since
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Account Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 py-3 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">Manage Account</span>
                {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonTrigger: 'hidden',
                      },
                    }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between border-b border-gray-200 py-3 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">Subscription</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700">
                  Free Plan
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-700 dark:text-gray-300">API Usage</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  0 / 50 messages today
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
