'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { BatteryDashboard } from '@/components/battery-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard, Zap, Calendar } from 'lucide-react';
import { BATTERY_PLANS } from '@/lib/battery-pricing-v2';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface BatteryStatus {
  totalBalance: number;
  dailyAllowance: number;
  lastDailyReset: string;
  todayUsage: number;
  usageHistory: Array<{
    date: string;
    usage: number;
    messages: number;
    models: Array<{ model: string; count: number }>;
  }>;
}

interface Subscription {
  id: string;
  status: string;
  planId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/billing');
      return;
    }

    loadBillingData();
  }, [isSignedIn, router]);

  const loadBillingData = async () => {
    try {
      // Load battery status
      const batteryRes = await fetch('/api/battery');
      if (batteryRes.ok) {
        const data = (await batteryRes.json()) as BatteryStatus;
        setBatteryStatus(data);
      }

      // Load subscription status
      const subRes = await fetch('/api/stripe/checkout');
      if (subRes.ok) {
        const data = (await subRes.json()) as { subscription: Subscription | null };
        setSubscription(data.subscription);
      }
    } catch (_error) {
      console.error('Failed to load billing data:', _error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleTopUp = async (units: number, _price: number) => {
    if (!stripePromise) {
      toast.error('Stripe is not configured');
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: units,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = (await response.json()) as { sessionId: string };
      const stripe = await stripePromise;

      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (_error) {
      console.error('Checkout error:', _error);
      toast.error('Failed to start checkout');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } catch (_error) {
      console.error('Portal error:', _error);
      toast.error('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription
    ? BATTERY_PLANS.find((p) => p.name.toLowerCase() === subscription.planId)
    : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing & Usage</h1>
        {subscription && (
          <Button variant="outline" onClick={handleManageSubscription} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Subscription Status */}
      {subscription && currentPlan && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Manage your subscription and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentPlan.name} Plan</h3>
                  <p className="text-muted-foreground text-sm">${currentPlan.price}/month</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-red-600">Cancels at period end</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>{currentPlan.dailyBattery} BU daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>{currentPlan.totalBattery.toLocaleString()} BU total/month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Battery Dashboard */}
      {batteryStatus && (
        <BatteryDashboard
          userId={userId!}
          subscription={currentPlan || null}
          totalBattery={batteryStatus.totalBalance}
          usageHistory={batteryStatus.usageHistory.map((h) => ({
            date: h.date,
            usage: h.usage,
            model: h.models[0]?.model || 'unknown',
          }))}
          onUpgrade={handleUpgrade}
          onTopUp={handleTopUp}
        />
      )}

      {/* Quick Actions */}
      {!subscription && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Choose a subscription plan to get daily battery allowances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleUpgrade} className="w-full">
              View Subscription Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
