'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';

export function BatteryWidgetConnected() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const subscription = useUserStore((state) => state.subscription);

  if (!user) return null;

  const isPremium = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  // Simplified battery display for header
  if (isPremium && subscription) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5',
              'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
              'border border-purple-200 dark:border-purple-800'
            )}
          >
            <span className="text-2xl">🔋</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {subscription.tier === 'pro'
                  ? 'Pro'
                  : subscription.tier === 'enterprise'
                    ? 'Enterprise'
                    : 'Premium'}{' '}
                Plan
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400">Premium Access</span>
            </div>
            <PremiumBadge size="xs" />
          </div>
        </div>
      </div>
    );
  }

  // Free user - show upgrade prompt
  return (
    <button
      onClick={() => router.push('/pricing')}
      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <span className="text-sm">🪫</span>
      <span className="text-xs text-gray-600 dark:text-gray-400">Free Tier</span>
      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Upgrade →</span>
    </button>
  );
}
