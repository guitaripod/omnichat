'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { UpgradeBanner } from '@/components/upgrade-banner';
import { ConversionPrompt } from '@/components/conversion-prompt';
import { useSync } from '@/hooks/use-sync';
import { useEffect } from 'react';
import { syncService } from '@/services/storage/sync';
import { useUpgradeBanner } from '@/hooks/use-upgrade-banner';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Initialize sync
  useSync({ enabled: true, interval: 30000 });
  const { isVisible, isAnimating } = useUpgradeBanner();

  // Start monitoring online status
  useEffect(() => {
    syncService.startMonitoring();
  }, []);

  // Calculate top offset when banner is visible
  const topOffset = isVisible && isAnimating ? 'top-[52px]' : 'top-0';

  return (
    <>
      <UpgradeBanner />
      <div
        className={`flex h-screen bg-gray-50 transition-all duration-300 dark:bg-gray-900 ${topOffset}`}
      >
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
      <ConversionPrompt />
    </>
  );
}
