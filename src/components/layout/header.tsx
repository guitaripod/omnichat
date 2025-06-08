'use client';

import { useState } from 'react';
import { Settings2, Moon, Sun } from 'lucide-react';
import { MODELS } from '@/lib/constants';
import { useTheme } from '@/hooks/use-theme';
import type { ModelType } from '@/types';

export function Header() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt-4o');
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 md:hidden dark:text-white">OmniChat</h1>

        {/* Model selector */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as ModelType)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {Object.entries(MODELS).map(([key, model]) => (
            <option key={key} value={key}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Settings"
        >
          <Settings2 size={20} />
        </button>
      </div>
    </header>
  );
}
