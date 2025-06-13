'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserStore } from '@/store/user';
import type { User, Subscription } from '@/types';

export function useUserSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const { setUser, setSubscription } = useUserStore();
  const lastSyncRef = useRef<Date>(new Date());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncUserData = useCallback(async () => {
    if (!clerkUser) return;

    try {
      const response = await fetch('/api/user/upgrade-status');
      if (response.ok) {
        const data = (await response.json()) as {
          email: string;
          tier: 'free' | 'paid';
          subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
          stripeCustomerId: string | null;
          hasPaidAccess: boolean;
        };

        const user: User = {
          id: clerkUser.id,
          email: data.email || clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.fullName || null,
          imageUrl: clerkUser.imageUrl || null,
          clerkId: clerkUser.id,
          tier: data.tier || 'free',
          subscriptionStatus: data.subscriptionStatus,
          stripeCustomerId: data.stripeCustomerId,
          subscriptionId: null,
          createdAt: new Date(clerkUser.createdAt || Date.now()),
          updatedAt: new Date(),
        };

        setUser(user);

        if (data.subscriptionStatus && data.subscriptionStatus !== 'canceled') {
          const subscription: Subscription = {
            id: data.stripeCustomerId || '',
            userId: clerkUser.id,
            stripeCustomerId: data.stripeCustomerId || '',
            stripeSubscriptionId: '',
            stripePriceId: '',
            status: data.subscriptionStatus,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            tier: data.tier === 'paid' ? 'pro' : 'free',
          };
          setSubscription(subscription);
        } else {
          setSubscription(null);
        }

        lastSyncRef.current = new Date();
      }
    } catch (error) {
      console.error('Failed to sync user data:', error);
    }
  }, [clerkUser, setUser, setSubscription]);

  // Sync on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && clerkUser) {
        const timeSinceLastSync = Date.now() - lastSyncRef.current.getTime();
        // Only sync if it's been more than 30 seconds
        if (timeSinceLastSync > 30000) {
          syncUserData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clerkUser]);

  // Periodic sync every 5 minutes
  useEffect(() => {
    if (clerkUser && isLoaded) {
      // Clear any existing interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      // Set up new interval
      syncIntervalRef.current = setInterval(syncUserData, 5 * 60 * 1000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [clerkUser, isLoaded, syncUserData]);

  return { syncUserData };
}
