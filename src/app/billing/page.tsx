'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { BatteryDashboard } from '@/components/battery-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  CreditCard,
  Zap,
  Calendar,
  TrendingUp,
  Battery as BatteryIcon,
  ArrowRight,
  Sparkles,
  Shield,
  Activity,
  Package,
  Crown,
} from 'lucide-react';
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
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
        <div className="animation-delay-2000 absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
      </div>

      <div className="relative container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:to-gray-300">
              Billing & Usage
            </h1>
            <Button
              onClick={subscription ? handleManageSubscription : handleUpgrade}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-white shadow-lg transition-all hover:scale-105 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
            >
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">
                {subscription ? 'Manage Subscription' : 'View Plans'}
              </span>
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your battery usage and manage your subscription
          </p>
        </div>

        {/* Subscription Status */}
        {subscription && currentPlan && (
          <Card className="relative mb-6 overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 shadow-xl dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
            <div className="absolute top-0 right-0 p-4">
              <Crown className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {currentPlan.name} Plan
                </span>
                {subscription.status === 'active' && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    ACTIVE
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Premium access to all AI models
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-6">
                {/* Plan Details */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-purple-200/50 bg-white/80 p-4 backdrop-blur-sm dark:border-purple-700/50 dark:bg-gray-800/80">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 p-2 text-white">
                        <BatteryIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Daily Battery
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentPlan.dailyBattery.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">units per day</p>
                  </div>

                  <div className="rounded-xl border border-blue-200/50 bg-white/80 p-4 backdrop-blur-sm dark:border-blue-700/50 dark:bg-gray-800/80">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2 text-white">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Monthly Total
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentPlan.totalBattery.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">battery units</p>
                  </div>

                  <div className="rounded-xl border border-green-200/50 bg-white/80 p-4 backdrop-blur-sm dark:border-green-700/50 dark:bg-gray-800/80">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-2 text-white">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Next Renewal
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {subscription.cancelAtPeriodEnd ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Cancels at period end
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ${currentPlan.price}/month
                      </p>
                    )}
                  </div>
                </div>

                {/* Plan Features */}
                <div className="grid grid-cols-2 gap-3">
                  {currentPlan.features.slice(0, 4).map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battery Dashboard with Enhanced Styling */}
        {batteryStatus && (
          <div className="mb-6">
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
          </div>
        )}

        {/* Quick Actions for Free Users */}
        {!subscription && (
          <Card className="relative mt-6 overflow-hidden border-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 shadow-xl dark:from-orange-900/20 dark:via-yellow-900/20 dark:to-amber-900/20">
            <div className="absolute top-0 right-0 p-6">
              <Sparkles className="h-12 w-12 text-orange-400 opacity-20" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                Unlock Premium Features
              </CardTitle>
              <CardDescription className="text-base">
                Get daily battery allowances and access to all AI models
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Access to 20+ premium AI models
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Daily battery allowance that rolls over
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Advanced features and priority support
                  </span>
                </div>
              </div>
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 py-6 text-lg shadow-lg transition-all hover:scale-105 hover:from-orange-700 hover:to-amber-700 hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  View Subscription Plans
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips */}
        <Card className="mt-6 border-0 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg dark:from-gray-800 dark:to-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Battery Usage Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400">💡</span>
                <span className="text-gray-600 dark:text-gray-300">
                  Use Ollama models for unlimited free local AI - no battery required!
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400">🔋</span>
                <span className="text-gray-600 dark:text-gray-300">
                  Your unused daily battery automatically rolls over to your battery bank
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-600 dark:text-purple-400">🎯</span>
                <span className="text-gray-600 dark:text-gray-300">
                  Different models use different amounts of battery - choose wisely!
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
