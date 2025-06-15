'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';
import { Battery, Zap } from 'lucide-react';
import { BATTERY_PLANS } from '@/lib/battery-pricing-v2';

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
    const planId = subscription.planId || subscription.tier;
    const plan = BATTERY_PLANS.find((p) => p.name.toLowerCase() === planId?.toLowerCase());
    const totalBattery = plan?.totalBattery || 20000; // Default to Plus plan if not found
    const batteryPercentage = Math.min(100, Math.round((batteryBalance / totalBattery) * 100));

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
              <div className="relative">
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
                {batteryPercentage > 90 && (
                  <Zap className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {batteryPercentage}% ({batteryBalance.toLocaleString()} BU)
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400">
                  {plan?.name || 'Premium'} Plan
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
  const freePercentage = Math.min(100, Math.round((batteryBalance / 6000) * 100)); // Free tier ~6000 units

  return (
    <button
      onClick={() => router.push('/pricing')}
      className="group flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 transition-all hover:scale-105 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <Battery
        className={cn(
          'h-4 w-4',
          freePercentage > 50
            ? 'text-green-500'
            : freePercentage > 20
              ? 'text-yellow-500'
              : 'text-red-500'
        )}
      />
      <div className="flex flex-col text-left">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {freePercentage}% ({batteryBalance} BU)
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Free Tier</span>
      </div>
      <span className="text-xs font-medium text-purple-600 group-hover:text-purple-700 dark:text-purple-400">
        Upgrade →
      </span>
    </button>
  );
}
