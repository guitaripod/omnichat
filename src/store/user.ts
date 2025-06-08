import { create } from 'zustand';
import type { User, Subscription } from '@/types';

interface UserState {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  subscription: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
