'use client';

import { Battery, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/use-user-data';
import { useBatteryData } from '@/hooks/use-battery-data';
import Link from 'next/link';

interface SidebarBatteryWidgetProps {
  isCollapsed?: boolean;
}

export function SidebarBatteryWidget({ isCollapsed }: SidebarBatteryWidgetProps) {
  const { user, isPremium } = useUserData();
  const { battery } = useBatteryData();

  if (!user) return null;

  // Calculate battery data
  const totalBalance = battery?.totalBalance || 0;
  const dailyLimit = battery?.dailyAllowance || 10000;
  const batteryPercentage = dailyLimit > 0 ? Math.round((totalBalance / dailyLimit) * 100) : 0;

  // Free users see upgrade prompt
  if (!isPremium) {
    return (
      <Link
        href="/pricing"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-orange-600 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
        title="Upgrade for premium features"
      >
        <Zap size={16} className={cn('animate-pulse', isCollapsed && 'md:mx-auto')} />
        <span className={cn(isCollapsed && 'md:hidden')}>Upgrade</span>
      </Link>
    );
  }

  return (
    <Link
      href="/billing"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
      title={`Battery: ${totalBalance.toLocaleString()} units`}
    >
      <div className="relative">
        <Battery
          size={16}
          className={cn(
            isCollapsed && 'md:mx-auto',
            batteryPercentage > 50
              ? 'text-green-600 dark:text-green-400'
              : batteryPercentage > 20
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
          )}
        />
      </div>
      <div className={cn('flex flex-col', isCollapsed && 'md:hidden')}>
        <span className="font-medium text-gray-900 dark:text-white">
          {totalBalance.toLocaleString()}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Battery</span>
      </div>
    </Link>
  );
}
