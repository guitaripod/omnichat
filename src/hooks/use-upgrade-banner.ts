import { useState, useEffect } from 'react';
import { useUserTier } from '@/hooks/use-user-tier';
import { UserTier } from '@/lib/tier';

const BANNER_DISMISS_KEY = 'upgrade-banner-dismissed';
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function useUpgradeBanner() {
  const { tier, isLoading } = useUserTier();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Only show for free users
    if (tier === UserTier.PAID) {
      setIsVisible(false);
      return;
    }

    // Check if banner was previously dismissed
    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();

      // If still within dismiss duration, don't show
      if (now - dismissedTime < BANNER_DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }

    // Show banner with animation
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 100);
  }, [tier, isLoading]);

  const dismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString());
    }, 300); // Match animation duration
  };

  return {
    isVisible,
    isAnimating,
    dismiss,
    isFreeTier: tier === UserTier.FREE,
  };
}
