import { useUserStore } from '@/store/user';
import type { User, Subscription } from '@/types';

export async function refreshUserData() {
  const { setUser, setSubscription, setLoading } = useUserStore.getState();

  setLoading(true);

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

      // We need the Clerk user ID - get it from the current user if available
      const currentUser = useUserStore.getState().user;
      if (!currentUser) {
        console.error('No current user to refresh');
        return;
      }

      const user: User = {
        ...currentUser,
        email: data.email || currentUser.email,
        tier: data.tier || 'free',
        subscriptionStatus: data.subscriptionStatus,
        stripeCustomerId: data.stripeCustomerId,
        updatedAt: new Date(),
      };

      setUser(user);

      if (data.subscriptionStatus && data.subscriptionStatus !== 'canceled') {
        const subscription: Subscription = {
          id: data.stripeCustomerId || '',
          userId: currentUser.id,
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
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  } finally {
    setLoading(false);
  }
}
