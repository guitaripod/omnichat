'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/utils';
import { Menu, X, Settings, User, Image as ImageIcon, CreditCard, BarChart3 } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { MockUserButton } from '@/components/ui/mock-user-button';
import { ConversationList } from './conversation-list';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useUserStore } from '@/store/user';
import { PremiumBadge } from '@/components/premium-badge';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const isDevMode = useDevMode();
  const user = useUserStore((state) => state.user);
  const isPremium =
    user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';

  return (
    <>
      {/* Mobile menu button */}
      <button className="fixed top-4 left-4 z-50 md:hidden" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:relative md:translate-x-0 dark:border-gray-700 dark:bg-gray-800',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isPremium && 'border-r-2 border-purple-200 dark:border-purple-800'
        )}
      >
        <div className={cn('flex h-full flex-col', isPremium && 'relative overflow-hidden')}>
          {/* Premium gradient background */}
          {isPremium && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-violet-50/30 dark:from-purple-900/10 dark:to-violet-900/10" />
          )}
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
            <Link href="/chat" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">OmniChat</span>
              {isPremium && <PremiumBadge size="sm" />}
            </Link>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>

          {/* Bottom section */}
          <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-700">
            {isPremium && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
              >
                <BarChart3 size={16} />
                Premium Dashboard
              </Link>
            )}
            <Link
              href="/billing"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <CreditCard size={16} />
              Billing
            </Link>
            <Link
              href="/images"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ImageIcon size={16} />
              Image History
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <User size={16} />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Settings size={16} />
              Settings
            </Link>
            <div className="pt-2">
              {!isDevMode && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <MockUserButton />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-30 bg-black md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
