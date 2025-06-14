'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import ApiSettings from '@/components/profile/api-settings';
import { PageHeader } from '@/components/layout/page-header';
import {
  Shield,
  Activity,
  Sparkles,
  Battery,
  ArrowRight,
  User,
  Calendar,
  Mail,
  Crown,
} from 'lucide-react';
import type { UserResource } from '@clerk/types';

interface ProfileContentProps {
  user: UserResource;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  return (
    <>
      <PageHeader title="Profile Settings" />

      <div className="relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-300 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
        </div>

        <div className="relative container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            {/* User Info Card */}
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50 dark:from-purple-900/10 dark:to-pink-900/10" />
              <div className="relative p-8">
                <div className="mb-8 flex items-center space-x-6">
                  {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-50 blur-xl" />
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonAvatarBox:
                              'h-20 w-20 ring-4 ring-white dark:ring-gray-800 shadow-2xl',
                          },
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      {user.primaryEmailAddress?.emailAddress ||
                        user.emailAddresses?.[0]?.emailAddress ||
                        'No email'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        User ID
                      </h3>
                    </div>
                    <p className="truncate font-mono text-sm text-gray-900 dark:text-white">
                      {user.id}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Member Since
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                        <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Subscription Status */}
              <Link
                href="/pricing"
                className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700/50 dark:bg-gray-800/80"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-purple-900/10 dark:to-pink-900/10" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-3 text-white shadow-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    Free Plan
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upgrade to unlock all features
                  </p>
                </div>
              </Link>

              {/* Billing & Usage */}
              <Link
                href="/billing"
                className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700/50 dark:bg-gray-800/80"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/10 dark:to-cyan-900/10" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-3 text-white shadow-lg">
                      <Battery className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    Battery Usage
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor your AI usage and credits
                  </p>
                </div>
              </Link>

              {/* Security */}
              <Link
                href="/security"
                className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700/50 dark:bg-gray-800/80"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 transition-opacity group-hover:opacity-100 dark:from-green-900/10 dark:to-emerald-900/10" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-3 text-white shadow-lg">
                      <Shield className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    Security
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage privacy and security settings
                  </p>
                </div>
              </Link>
            </div>

            {/* API Settings Section */}
            <ApiSettings />
          </div>
        </div>
      </div>
    </>
  );
}
