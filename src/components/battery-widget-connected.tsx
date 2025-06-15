'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';
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
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-1.5 backdrop-blur-sm transition-all hover:scale-105 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-lg dark:from-purple-500/20 dark:to-pink-500/20 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30"
      >
        {/* Background animation */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />

        <div className="flex items-center gap-3">
          {/* Modern battery icon with fill */}
          <div className="relative">
            <svg width="32" height="16" viewBox="0 0 32 16" className="overflow-visible">
              {/* Battery outline */}
              <rect
                x="1"
                y="3"
                width="26"
                height="10"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-600 dark:text-gray-400"
              />
              {/* Battery tip */}
              <rect
                x="27"
                y="6"
                width="3"
                height="4"
                rx="1"
                fill="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              {/* Battery fill */}
              <rect
                x="3"
                y="5"
                width={Math.max(0, Math.min(22, (22 * batteryPercentage) / 100))}
                height="6"
                rx="0.5"
                className={cn(
                  'transition-all duration-500',
                  batteryPercentage > 50
                    ? 'fill-green-500 dark:fill-green-400'
                    : batteryPercentage > 20
                      ? 'fill-yellow-500 dark:fill-yellow-400'
                      : 'fill-red-500 dark:fill-red-400'
                )}
              />
              {/* Lightning bolt for high charge */}
              {batteryPercentage > 90 && (
                <path
                  d="M15 2 L11 8 L14 8 L12 14 L17 6 L14 6 Z"
                  fill="white"
                  className="animate-pulse"
                  opacity="0.9"
                />
              )}
            </svg>
          </div>

          {/* Text info */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                {batteryPercentage}%
              </span>
              <PremiumBadge size="xs" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {plan?.name || 'Premium'} • {batteryBalance.toLocaleString()} BU
            </span>
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
      className="group relative overflow-hidden rounded-2xl bg-gray-100/80 px-3 py-1.5 backdrop-blur-sm transition-all hover:scale-105 hover:bg-gray-200/80 hover:shadow-md dark:bg-gray-800/80 dark:hover:bg-gray-700/80"
    >
      <div className="flex items-center gap-3">
        {/* Modern battery icon */}
        <div className="relative">
          <svg width="32" height="16" viewBox="0 0 32 16" className="overflow-visible">
            {/* Battery outline */}
            <rect
              x="1"
              y="3"
              width="26"
              height="10"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-600 dark:text-gray-400"
            />
            {/* Battery tip */}
            <rect
              x="27"
              y="6"
              width="3"
              height="4"
              rx="1"
              fill="currentColor"
              className="text-gray-600 dark:text-gray-400"
            />
            {/* Battery fill */}
            <rect
              x="3"
              y="5"
              width={Math.max(0, Math.min(22, (22 * freePercentage) / 100))}
              height="6"
              rx="0.5"
              className={cn(
                'transition-all duration-500',
                freePercentage > 50
                  ? 'fill-green-500 dark:fill-green-400'
                  : freePercentage > 20
                    ? 'fill-yellow-500 dark:fill-yellow-400'
                    : 'fill-red-500 dark:fill-red-400'
              )}
            />
          </svg>
        </div>

        {/* Text info */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
            {freePercentage}%
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Free • {batteryBalance} BU
          </span>
        </div>

        <span className="ml-1 text-xs font-medium text-purple-600 transition-colors group-hover:text-purple-700 dark:text-purple-400 dark:group-hover:text-purple-300">
          Upgrade →
        </span>
      </div>
    </button>
  );
}
