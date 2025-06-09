'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useSync } from '@/hooks/use-sync';
import { useEffect } from 'react';
import { syncService } from '@/services/storage/sync';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Initialize sync
  useSync({ enabled: true, interval: 30000 });

  // Start monitoring online status
  useEffect(() => {
    syncService.startMonitoring();
  }, []);
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
