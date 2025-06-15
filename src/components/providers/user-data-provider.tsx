'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserStore } from '@/store/user';
import { useUserTier } from '@/hooks/use-user-tier';
import { useDevMode } from '@/hooks/use-dev-mode';
// import { useUserSync } from '@/hooks/use-user-sync';
import type { User, Subscription } from '@/types';

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const isDevMode = useDevMode();
  const { user: clerkUser, isLoaded } = useUser();
  const { setUser, setSubscription, setLoading, setBattery } = useUserStore();
  const { tier, isLoading: tierLoading } = useUserTier();
  // const { syncUserData } = useUserSync();

  useEffect(() => {
    const fetchUserData = async () => {
      // In dev mode, use mock data
      if (isDevMode) {
        const mockUser: User = {
          id: 'dev-user',
          email: 'dev@example.com',
          name: 'Dev User',
          imageUrl: null,
          clerkId: 'dev-user',
          tier: 'free',
          subscriptionStatus: null,
          stripeCustomerId: null,
          subscriptionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUser(mockUser);
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Wait for Clerk to load
      if (!isLoaded) return;

      setLoading(true);

      try {
        if (!clerkUser) {
          setUser(null);
          setSubscription(null);
          setLoading(false);
          return;
        }

        // Fetch full user data from our API
        const response = await fetch('/api/user/upgrade-status');
        if (response.ok) {
          const data = (await response.json()) as {
            email: string;
            tier: 'free' | 'paid';
            subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
            stripeCustomerId: string | null;
            hasPaidAccess: boolean;
            subscription?: {
              planId: string;
              status: 'active' | 'canceled' | 'past_due' | 'trialing';
              billingInterval: 'monthly' | 'annual';
              currentPeriodEnd: string;
            } | null;
          };

          // Map the API response to our User type
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

          // If user has a subscription, create subscription object
          if (data.subscription) {
            const subscription: Subscription = {
              id: data.stripeCustomerId || '',
              userId: clerkUser.id,
              stripeCustomerId: data.stripeCustomerId || '',
              stripeSubscriptionId: '',
              stripePriceId: '',
              status: data.subscription.status,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
              cancelAtPeriodEnd: false,
              tier: data.tier === 'paid' ? 'pro' : 'free',
              planId: data.subscription.planId,
              billingInterval: data.subscription.billingInterval,
            };
            setSubscription(subscription);
          } else if (data.subscriptionStatus && data.subscriptionStatus !== 'canceled') {
            // Fallback for backward compatibility
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

          // Fetch battery data
          try {
            const batteryResponse = await fetch('/api/battery');
            if (batteryResponse.ok) {
              const batteryData = (await batteryResponse.json()) as {
                totalBalance?: number;
                dailyAllowance?: number;
                lastDailyReset?: string;
                todayUsage?: number;
              };
              setBattery({
                totalBalance: batteryData.totalBalance || 0,
                dailyAllowance: batteryData.dailyAllowance || 0,
                lastDailyReset:
                  batteryData.lastDailyReset || new Date().toISOString().split('T')[0],
                todayUsage: batteryData.todayUsage || 0,
                lastUpdated: new Date(),
              });
            }
          } catch (error) {
            console.error('Failed to fetch battery data:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clerkUser, isLoaded, setUser, setSubscription, setLoading, setBattery, isDevMode]);

  // Also sync when tier changes (from useUserTier hook)
  useEffect(() => {
    if (!tierLoading && tier && clerkUser) {
      const currentUser = useUserStore.getState().user;
      if (currentUser && currentUser.tier !== tier) {
        setUser({
          ...currentUser,
          tier: tier as 'free' | 'paid',
        });
      }
    }
  }, [tier, tierLoading, clerkUser, setUser]);

  return <>{children}</>;
}
