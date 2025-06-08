'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { MessageSquare, Plus, Menu, X, Settings, User } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { MockUserButton } from '@/components/ui/mock-user-button';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const conversations = [
    { id: '1', title: 'GPT-4 Discussion', updatedAt: new Date() },
    { id: '2', title: 'Claude Analysis', updatedAt: new Date(Date.now() - 86400000) },
  ];

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

          {/* New chat button */}
          <div className="px-4 py-4">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
              <Plus size={20} />
              New Chat
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-4">
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Recent Conversations
            </h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === `/chat/${conv.id}`
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <MessageSquare size={16} />
                  <span className="flex-1 truncate">{conv.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom section */}
          <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-700">
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
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
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
