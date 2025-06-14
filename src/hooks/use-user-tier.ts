'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { UserTier } from '@/lib/tier';

interface UserTierData {
  tier: UserTier;
  isLoading: boolean;
  isPaidUser: boolean;
}

export function useUserTier(): UserTierData {
  const { user, isLoaded } = useUser();
  const [tierData, setTierData] = useState<UserTierData>({
    tier: UserTier.FREE,
    isLoading: true,
    isPaidUser: false,
  });

  useEffect(() => {
    const fetchUserTier = async () => {
      if (!isLoaded) return;

      if (!user) {
        setTierData({ tier: UserTier.FREE, isLoading: false, isPaidUser: false });
        return;
      }

      try {
        // Fetch user tier from API
        const response = await fetch('/api/user/tier');
        if (response.ok) {
          const data = (await response.json()) as { tier: string };
          const tier = data.tier as UserTier;
          const isPaidUser = tier !== UserTier.FREE;
          setTierData({ tier, isLoading: false, isPaidUser });
        } else {
          setTierData({ tier: UserTier.FREE, isLoading: false, isPaidUser: false });
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        setTierData({ tier: UserTier.FREE, isLoading: false, isPaidUser: false });
      }
    };

    fetchUserTier();
  }, [user, isLoaded]);

  return tierData;
}
