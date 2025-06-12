'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/utils';
import { Menu, X, Settings, User, Image, CreditCard } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { MockUserButton } from '@/components/ui/mock-user-button';
import { ConversationList } from './conversation-list';
import { useDevMode } from '@/hooks/use-dev-mode';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const isDevMode = useDevMode();

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
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
            <Link href="/chat" className="text-xl font-bold text-gray-900 dark:text-white">
              OmniChat
            </Link>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>

          {/* Bottom section */}
          <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-700">
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
              <Image size={16} />
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
