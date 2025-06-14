'use client';

import { Settings2, Moon, Sun, Download, Monitor, Check } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { useState } from 'react';
import { useConversationStore } from '@/store/conversations';
import { ExportDialog } from '@/components/chat/export-dialog';
import { PremiumExportDialog } from '@/components/export/premium-export-dialog';
import { BatteryWidgetConnected } from '@/components/battery-widget-connected';
import { useUserData } from '@/hooks/use-user-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function Header() {
  const { theme, mounted, setTheme } = useTheme();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { currentConversationId, messages } = useConversationStore();
  const { isPremium } = useUserData();

  const hasMessages = currentConversationId && messages[currentConversationId]?.length > 0;

  if (!mounted) return null;

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor size={20} />;
    if (theme === 'dark') return <Moon size={20} />;
    return <Sun size={20} />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System theme';
    if (theme === 'dark') return 'Dark mode';
    return 'Light mode';
  };

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark' as const, label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system' as const, label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h1>
        <AdvancedSearch />
      </div>

      <div className="flex items-center gap-4">
        {/* Battery Widget - positioned prominently in header */}
        <BatteryWidgetConnected />

        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              onClick={() => setShowExportDialog(true)}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Export conversation"
              title="Export conversation"
            >
              <Download size={20} />
            </button>
          )}

          <Popover open={themeMenuOpen} onOpenChange={setThemeMenuOpen}>
            <PopoverTrigger asChild>
              <button
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label={getThemeLabel()}
                title={getThemeLabel()}
              >
                {getThemeIcon()}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36" align="end">
              <div className="space-y-1">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                      setThemeMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                    {theme === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Settings"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog &&
        (isPremium ? (
          <PremiumExportDialog
            isOpen={true}
            onClose={() => setShowExportDialog(false)}
            conversationId={currentConversationId || undefined}
          />
        ) : (
          currentConversationId && (
            <ExportDialog
              isOpen={true}
              onClose={() => setShowExportDialog(false)}
              conversationId={currentConversationId}
            />
          )
        ))}
    </header>
  );
}
