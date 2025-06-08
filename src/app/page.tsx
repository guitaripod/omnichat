import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Only check for user if Clerk is configured
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const user = await currentUser();
      if (user) {
        redirect('/chat');
      }
    } catch {
      // Clerk not configured, continue to show landing page
      console.log('Clerk not configured, showing landing page');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <main className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-7xl dark:text-white">
            OmniChat
          </h1>
          <p className="mb-8 max-w-2xl text-xl text-gray-600 md:text-2xl dark:text-gray-300">
            Chat with multiple AI models including OpenAI, Anthropic, Google, and local Ollama
            models - all in one place.
          </p>

          <div className="mb-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/sign-in"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                Multiple AI Models
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access GPT-4, Claude, Gemini, and local Ollama models from a single interface.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                File Attachments
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload images, PDFs, and documents to enhance your conversations.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                Chat Branching
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create conversation branches to explore different paths and ideas.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
