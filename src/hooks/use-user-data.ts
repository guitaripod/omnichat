'use client';

import { useUserStore } from '@/store/user';
import { UserTier } from '@/lib/tier';

export function useUserData() {
  const { user, subscription, isLoading } = useUserStore();

  const isPremium =
    user?.tier === UserTier.PAID ||
    user?.subscriptionStatus === 'active' ||
    user?.subscriptionStatus === 'trialing';

  const hasPremiumFeatures = isPremium;

  return {
    user,
    subscription,
    isLoading,
    isPremium,
    hasPremiumFeatures,
    tier: user?.tier || UserTier.FREE,
  };
}
