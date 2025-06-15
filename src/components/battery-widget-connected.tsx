'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
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
      <button
        onClick={() => router.push('/billing')}
        className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 transition-all hover:scale-105 hover:shadow-lg dark:from-purple-900/30 dark:to-pink-900/30"
      >
        {/* Background shimmer effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />

        {/* Battery visualization */}
        <div className="relative flex h-8 w-20 items-center rounded-full bg-gray-200 p-0.5 dark:bg-gray-700">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              batteryPercentage > 50
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : batteryPercentage > 20
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-red-400 to-red-500'
            )}
            style={{ width: `${batteryPercentage}%` }}
          >
            {batteryPercentage > 90 && (
              <Zap className="absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 animate-pulse text-white" />
            )}
          </div>
        </div>

        {/* Text info */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {batteryPercentage}%
            </span>
            <PremiumBadge size="xs" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {batteryBalance.toLocaleString()} BU • {plan?.name || 'Premium'}
          </span>
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
      className="group relative flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 transition-all hover:scale-105 hover:bg-gray-200 hover:shadow-md dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {/* Battery visualization */}
      <div className="relative flex h-8 w-20 items-center rounded-full bg-gray-300 p-0.5 dark:bg-gray-600">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            freePercentage > 50
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : freePercentage > 20
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                : 'bg-gradient-to-r from-red-400 to-red-500'
          )}
          style={{ width: `${freePercentage}%` }}
        />
      </div>

      {/* Text info */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {freePercentage}%
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">{batteryBalance} BU • Free</span>
      </div>

      <span className="ml-1 text-xs font-medium text-purple-600 transition-colors group-hover:text-purple-700 dark:text-purple-400">
        Upgrade →
      </span>
    </button>
  );
}
