'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';
import { Battery } from 'lucide-react';

export function BatteryWidgetConnected() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const subscription = useUserStore((state) => state.subscription);
  const battery = useUserStore((state) => state.battery);

  if (!user) return null;

  const isPremium = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  // Simplified battery display for header
  if (isPremium && subscription) {
    const batteryBalance = battery?.totalBalance || 0;
    const dailyAllowance = battery?.dailyAllowance || 0;
    const batteryPercentage =
      dailyAllowance > 0 ? Math.round((batteryBalance / dailyAllowance) * 100) : 0;

    return (
      <button onClick={() => router.push('/billing')} className="group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5',
                'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
                'border border-purple-200 dark:border-purple-800',
                'transition-all group-hover:scale-105 group-hover:shadow-md'
              )}
            >
              <Battery
                className={cn(
                  'h-5 w-5',
                  batteryPercentage > 50
                    ? 'text-green-600 dark:text-green-400'
                    : batteryPercentage > 20
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                )}
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {batteryBalance.toLocaleString()} Units
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  {subscription.tier === 'pro' ? 'Pro' : 'Premium'} Plan
                </span>
              </div>
              <PremiumBadge size="xs" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Free user - show battery balance and upgrade prompt
  const batteryBalance = battery?.totalBalance || 0;

  return (
    <button
      onClick={() => router.push('/pricing')}
      className="group flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 transition-all hover:scale-105 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <Battery className="h-4 w-4 text-gray-500" />
      <div className="flex flex-col text-left">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {batteryBalance} Units
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Free Tier</span>
      </div>
      <span className="text-xs font-medium text-purple-600 group-hover:text-purple-700 dark:text-purple-400">
        Upgrade →
      </span>
    </button>
  );
}
