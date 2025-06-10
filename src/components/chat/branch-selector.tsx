'use client';

import { useState, useRef, useEffect } from 'react';
import { GitBranch, Plus, ChevronDown } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

interface BranchSelectorProps {
  message: Message;
  messages: Message[];
  onBranchSwitch: (messageId: string) => void;
  onCreateBranch: () => void;
}

export function BranchSelector({
  message,
  messages,
  onBranchSwitch,
  onCreateBranch,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find alternative branches from this message
  const alternatives = messages.filter(
    (m) => m.parentId === message.parentId && m.id !== message.id && m.role === 'assistant'
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't show selector if there are no alternatives and we can't create branches
  if (alternatives.length === 0 && !onCreateBranch) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors',
          isOpen
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        )}
      >
        <GitBranch className="h-3 w-3" />
        {alternatives.length > 0 && <span>{alternatives.length + 1}</span>}
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-1">
            {/* Current branch */}
            <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              Current response
            </div>

            {/* Alternative branches */}
            {alternatives.length > 0 && (
              <>
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Alternative responses
                </div>
                {alternatives.map((alt, index) => (
                  <button
                    key={alt.id}
                    onClick={() => {
                      console.log('[BranchSelector] Switching to alternative:', alt.id);
                      onBranchSwitch(alt.id);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="text-gray-600 dark:text-gray-300">
                      Alternative {index + 1}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Create new branch option */}
            {onCreateBranch && (
              <>
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    console.log('[BranchSelector] Creating new branch');
                    onCreateBranch();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create new branch</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
