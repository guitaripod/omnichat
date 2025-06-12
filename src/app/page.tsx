import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isDevMode } from '@/lib/auth/dev-auth';
import { Zap, MessageSquare, Globe, FileText } from 'lucide-react';

export const runtime = 'edge';

export default async function Home() {
  // In dev mode, redirect directly to chat
  if (isDevMode()) {
    redirect('/chat');
  }

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
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">OmniChat</div>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/auth/sign-in"
              className="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 dark:bg-blue-900">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Battery-powered pricing • Pay only for what you use
            </span>
          </div>

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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Get Started Free
              <Zap className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              View Pricing
            </Link>
          </div>

          <div className="mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Multiple AI Models
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Access GPT-4, Claude, Gemini, and local Ollama models from a single interface.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  File Attachments
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Upload images, PDFs, and documents to enhance your conversations.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-3">
                <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Web Search</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Let AI search the web for real-time information and current events.
              </p>
            </div>
          </div>

          {/* Pricing Teaser */}
          <div className="mt-16 max-w-3xl rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-8 dark:from-blue-950 dark:to-purple-950">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Simple, Fair Pricing
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Our battery system ensures you only pay for what you use. No hidden fees, no
              surprises.
            </p>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">$4.99</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Starter Plan</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">$12.99</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Daily Plan</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">$29.99</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Power Plan</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              See All Plans
              <Zap className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
