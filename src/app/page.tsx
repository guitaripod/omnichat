import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isDevMode } from '@/lib/auth/dev-auth';
import { Zap, MessageSquare, ArrowRight, Sparkles, Shield, Server, Brain, Key } from 'lucide-react';

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
        <div className="animation-delay-2000 absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
        <div className="animation-delay-4000 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-br from-orange-300 to-yellow-300 opacity-10 mix-blend-multiply blur-3xl filter dark:opacity-5" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between rounded-2xl border border-gray-200/50 bg-white/50 px-6 py-4 shadow-lg backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 p-2 text-white">
              <MessageSquare className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-300">
              OmniChat
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/auth/sign-in"
              className="font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative container mx-auto px-4 py-16">
        <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          {/* Hero Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200/50 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 shadow-lg backdrop-blur-sm dark:border-purple-700/50 dark:from-purple-900/20 dark:to-pink-900/20">
            <Sparkles className="h-5 w-5 animate-pulse text-purple-600 dark:text-purple-400" />
            <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-sm font-semibold text-transparent dark:from-purple-300 dark:to-pink-300">
              NEW: Opus 4 & Latest AI Models Available
            </span>
          </div>

          {/* Hero Title */}
          <h1 className="mb-8 text-6xl font-bold tracking-tight md:text-8xl lg:text-9xl">
            <span className="animate-gradient bg-300% bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              OmniChat
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="mb-12 max-w-3xl text-xl leading-relaxed text-gray-600 md:text-2xl lg:text-3xl dark:text-gray-300">
            The ultimate AI conversation platform with
            <span className="font-semibold text-gray-900 dark:text-white"> 20+ models</span>,
            <span className="font-semibold text-gray-900 dark:text-white"> unlimited local AI</span>
            , and
            <span className="font-semibold text-gray-900 dark:text-white">
              {' '}
              transparent pricing
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="mb-16 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                Start Free with Ollama
                <Server className="h-5 w-5 transition-transform group-hover:rotate-12" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <Link
              href="/pricing"
              className="group rounded-2xl border-2 border-gray-300 bg-white/80 px-10 py-4 font-semibold text-gray-900 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:border-purple-300 hover:shadow-xl dark:border-gray-600 dark:bg-gray-800/80 dark:text-white dark:hover:border-purple-600"
            >
              <span className="flex items-center justify-center gap-3 text-lg">
                View Pricing
                <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
              </span>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mb-20 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: AI Models */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-purple-900/10 dark:to-pink-900/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-3 text-white shadow-lg">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  20+ AI Models
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  Access the latest from OpenAI (GPT-4.1), Anthropic (Opus 4), Google (Gemini 2.0),
                  and more - all in one place.
                </p>
              </div>
            </div>

            {/* Feature 2: Local AI */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-green-900/10 dark:to-emerald-900/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-3 text-white shadow-lg">
                  <Server className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  Free Local AI
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  Run unlimited Ollama models locally on your computer. No API keys, no costs,
                  complete privacy.
                </p>
              </div>
            </div>

            {/* Feature 3: Advanced Features */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/10 dark:to-cyan-900/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-3 text-white shadow-lg">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  Pro Features
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  Image generation, web search, file attachments, conversation branching, and more.
                </p>
              </div>
            </div>

            {/* Feature 4: Flexible Access */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-orange-900/10 dark:to-yellow-900/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-600 p-3 text-white shadow-lg">
                  <Key className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  Your Keys or Ours
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  Use your own API keys for complete control, or let us handle it with our
                  transparent battery system.
                </p>
              </div>
            </div>

            {/* Feature 5: Fair Pricing */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-indigo-900/10 dark:to-purple-900/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white shadow-lg">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  Battery Pricing
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  Pay only for what you use. Daily allowances roll over, so you never waste credits.
                </p>
              </div>
            </div>

            {/* Feature 6: Privacy */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-red-900/10 dark:to-pink-900/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 p-3 text-white shadow-lg">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                  Your Privacy
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  Run models locally with Ollama or use encrypted cloud connections. Your data, your
                  choice.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Teaser */}
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-purple-200/50 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 p-12 shadow-2xl backdrop-blur-sm dark:border-purple-700/50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
            <div className="bg-grid-pattern absolute inset-0 opacity-5" />
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  TRANSPARENT PRICING
                </span>
              </div>

              <h2 className="mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:to-gray-300">
                Start Free, Scale As You Grow
              </h2>
              <p className="mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                Begin with unlimited free local AI. Upgrade anytime for instant access to premium
                cloud models.
              </p>

              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-4">
                {/* Free Plan */}
                <div className="group relative overflow-hidden rounded-2xl border border-green-200/50 bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-green-700/50 dark:bg-gray-800/80">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-green-900/20 dark:to-emerald-900/20" />
                  <div className="relative z-10">
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">$0</p>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                      Free Forever
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Unlimited Ollama
                    </p>
                  </div>
                </div>

                {/* Paid Plans */}
                <div className="group relative overflow-hidden rounded-2xl bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-800/80">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-cyan-900/20" />
                  <div className="relative z-10">
                    <p className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">
                      $4.99
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                      Starter
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">200 battery/day</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border-2 border-purple-300/50 bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-purple-600/50 dark:bg-gray-800/80">
                  <div className="absolute -top-2 -right-2 z-20">
                    <span className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      POPULAR
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20" />
                  <div className="relative z-10">
                    <p className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
                      $12.99
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                      Daily
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">600 battery/day</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-800/80">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-orange-900/20 dark:to-yellow-900/20" />
                  <div className="relative z-10">
                    <p className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-4xl font-bold text-transparent">
                      $29.99
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                      Power
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      1,500 battery/day
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/pricing"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl dark:from-white dark:to-gray-200 dark:text-gray-900"
              >
                <span>Explore All Plans</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-20 text-center">
            <p className="mb-8 text-sm font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Trusted by developers and AI enthusiasts
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 dark:border-gray-800"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">1,000+</span> users
                </span>
              </div>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">50K+</span>{' '}
                  conversations
                </span>
              </div>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">4.9/5</span> rating
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-24 border-t border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-gray-900 dark:text-white">OmniChat</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">© 2024</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Terms
                </Link>
                <Link
                  href="/docs"
                  className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Documentation
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
