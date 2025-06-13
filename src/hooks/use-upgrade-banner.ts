import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/user';

const BANNER_DISMISS_KEY = 'upgrade-banner-dismissed';
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function useUpgradeBanner() {
  const user = useUserStore((state) => state.user);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Only show for free users (check subscription status)
    const isPaid = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
    if (isPaid) {
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
  }, [user]);

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
    isFreeTier: user
      ? !(user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')
      : true,
  };
}
