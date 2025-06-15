'use client';

import { useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/user';
import { toast } from 'sonner';

interface BatteryResponse {
  totalBalance: number;
  dailyAllowance: number;
  lastDailyReset: string;
  todayUsage: number;
  usageHistory?: any[];
}

export function useBatteryData() {
  const { battery, setBattery, user } = useUserStore();

  const fetchBatteryData = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/battery');
      if (!response.ok) {
        throw new Error('Failed to fetch battery data');
      }

      const data: BatteryResponse = await response.json();
      setBattery({
        ...data,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Battery fetch error:', error);
      // Don't show error toast on every fetch failure
    }
  }, [user, setBattery]);

  // Fetch battery data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchBatteryData();
    }
  }, [user, fetchBatteryData]);

  // Refresh battery data periodically (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchBatteryData, 30000);
    return () => clearInterval(interval);
  }, [user, fetchBatteryData]);

  const trackUsage = useCallback(
    async (params: {
      conversationId: string;
      messageId: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      cached?: boolean;
    }) => {
      try {
        const response = await fetch('/api/usage/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to track usage';
          try {
            const error = (await response.json()) as { error?: string };
            if (response.status === 402) {
              toast.error('Insufficient battery balance');
            }
            errorMessage = error.error || errorMessage;
          } catch {
            console.error('Failed to parse error response');
          }
          throw new Error(errorMessage);
        }

        const result = (await response.json()) as {
          success: boolean;
          batteryUsed: number;
          newBalance: number;
        };

        // Update battery state optimistically
        const store = useUserStore.getState();
        store.updateBatteryBalance(result.newBalance, result.batteryUsed);

        // Fetch fresh data to ensure accuracy
        setTimeout(fetchBatteryData, 1000);

        return result;
      } catch (error) {
        console.error('Usage tracking error:', error);
        throw error;
      }
    },
    [fetchBatteryData]
  );

  return {
    battery,
    fetchBatteryData,
    trackUsage,
    isLoading: !battery && !!user,
  };
}
