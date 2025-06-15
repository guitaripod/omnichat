import { create } from 'zustand';
import type { User, Subscription } from '@/types';

interface BatteryData {
  totalBalance: number;
  dailyAllowance: number;
  lastDailyReset: string;
  todayUsage: number;
  lastUpdated: Date;
}

interface UserState {
  user: User | null;
  subscription: Subscription | null;
  battery: BatteryData | null;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setBattery: (battery: BatteryData | null) => void;
  updateBatteryBalance: (newBalance: number, usageAdded: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  subscription: null,
  battery: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSubscription: (subscription) => set({ subscription }),
  setBattery: (battery) => set({ battery }),
  updateBatteryBalance: (newBalance, usageAdded) =>
    set((state) => ({
      battery: state.battery
        ? {
            ...state.battery,
            totalBalance: newBalance,
            todayUsage: state.battery.todayUsage + usageAdded,
            lastUpdated: new Date(),
          }
        : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
