'use client';

import { User } from 'lucide-react';

export function MockUserButton() {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <User size={16} className="text-gray-600 dark:text-gray-400" />
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">Guest User</span>
    </div>
  );
}
