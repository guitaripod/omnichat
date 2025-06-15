'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { BatteryDashboard } from '@/components/battery-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import {
  CreditCard,
  TrendingUp,
  Battery as BatteryIcon,
  ArrowRight,
  Sparkles,
  Shield,
  Activity,
  Crown,
  Gauge,
  Clock,
  ChevronRight,
  Check,
  MessageSquare,
  Zap,
  Info,
} from 'lucide-react';
import { BATTERY_PLANS } from '@/lib/battery-pricing-v2';
import { MODEL_BATTERY_USAGE, getTierColor } from '@/lib/battery-pricing';
import { loadStripe } from '@stripe/stripe-js';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  billingInterval?: 'monthly' | 'annual' | null;
}

// Animated background component
function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-float absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
      <div className="animation-delay-2000 animate-float absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
      <div className="animation-delay-4000 animate-float absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
    </div>
  );
}

// Battery visualization component
function BatteryVisualization({
  percentage,
  totalBalance,
}: {
  percentage: number;
  totalBalance: number;
}) {
  const batteryColor = percentage > 50 ? 'green' : percentage > 20 ? 'yellow' : 'red';

  return (
    <div className="relative">
      <svg className="h-32 w-32" viewBox="0 0 100 100">
        {/* Battery outline */}
        <rect
          x="10"
          y="20"
          width="70"
          height="60"
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300 dark:text-gray-600"
        />
        <rect
          x="80"
          y="40"
          width="10"
          height="20"
          rx="2"
          fill="currentColor"
          className="text-gray-300 dark:text-gray-600"
        />

        {/* Battery fill */}
        <rect
          x="14"
          y="24"
          width={(percentage / 100) * 62}
          height="52"
          rx="4"
          className={cn(
            'transition-all duration-1000',
            batteryColor === 'green' && 'fill-green-500 dark:fill-green-600',
            batteryColor === 'yellow' && 'fill-yellow-500 dark:fill-yellow-600',
            batteryColor === 'red' && 'fill-red-500 dark:fill-red-600'
          )}
        />

        {/* Lightning bolt for charging */}
        <path
          d="M45 35 L35 50 L42 50 L37 65 L50 45 L43 45 Z"
          className="fill-white dark:fill-gray-900"
          opacity="0.8"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{percentage}%</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {totalBalance.toLocaleString()} units
        </span>
      </div>
    </div>
  );
}

// Quick stats card component
function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="rounded-2xl border border-gray-200/50 bg-white/80 p-6 backdrop-blur-sm transition-all hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-800/80"
    >
      <div className="flex items-center gap-4">
        <div className={cn('rounded-xl p-3', color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function BillingPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/auth/sign-in?redirect_url=/billing');
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
          returnUrl: `${window.location.origin}/chat`,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create portal session';
        try {
          const errorData = await response.json();
          console.error('Portal error response:', errorData);
          if (errorData && typeof errorData === 'object' && 'error' in errorData) {
            errorMessage = String(errorData.error);
          }
        } catch {
          console.error('Failed to parse error response');
        }
        throw new Error(errorMessage);
      }

      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to open billing portal';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription
    ? BATTERY_PLANS.find((p) => p.name.toLowerCase() === subscription.planId)
    : null;

  // Calculate battery percentage based on plan's total battery, not daily allowance
  const batteryPercentage =
    currentPlan && batteryStatus
      ? Math.min(100, Math.round((batteryStatus.totalBalance / currentPlan.totalBattery) * 100))
      : batteryStatus
        ? Math.min(100, Math.round((batteryStatus.totalBalance / 6000) * 100)) // Free tier has ~6000 units
        : 0;

  return (
    <>
      <PageHeader title="Battery & Billing">
        <Button
          onClick={subscription ? handleManageSubscription : handleUpgrade}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-white shadow-lg transition-all hover:scale-105 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
        >
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">
            {subscription ? 'Manage Subscription' : 'Upgrade Plan'}
          </span>
        </Button>
      </PageHeader>

      <div className="relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <AnimatedBackground />

        <div className="relative container mx-auto max-w-6xl px-4 py-8">
          {/* Main Battery Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative mb-8 overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-2xl dark:from-gray-800 dark:to-gray-900">
              <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent" />

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
                      Battery Life
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {subscription
                        ? `${currentPlan?.name} Plan - ${subscription.status === 'active' ? 'Active' : 'Inactive'}`
                        : 'Free Tier - Limited battery capacity'}
                    </CardDescription>
                  </div>

                  <BatteryVisualization
                    percentage={batteryPercentage}
                    totalBalance={batteryStatus?.totalBalance || 0}
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <QuickStat
                    icon={BatteryIcon}
                    label="Battery Remaining"
                    value={`${batteryStatus?.totalBalance.toLocaleString() || 0} units`}
                    color="bg-gradient-to-br from-green-500 to-emerald-600"
                  />
                  <QuickStat
                    icon={Clock}
                    label="Estimated Days Left"
                    value={
                      batteryStatus && batteryStatus.usageHistory.length > 0
                        ? (() => {
                            const avgDaily =
                              batteryStatus.usageHistory
                                .slice(-7)
                                .reduce((a, b) => a + b.usage, 0) /
                              Math.min(7, batteryStatus.usageHistory.length);
                            const daysLeft =
                              avgDaily > 0
                                ? Math.floor(batteryStatus.totalBalance / avgDaily)
                                : '∞';
                            return `${daysLeft} days`;
                          })()
                        : '∞ days'
                    }
                    color="bg-gradient-to-br from-purple-500 to-pink-600"
                  />
                  <QuickStat
                    icon={Gauge}
                    label="Monthly Usage"
                    value={`${Math.round(
                      batteryStatus?.usageHistory.slice(-30).reduce((a, b) => a + b.usage, 0) ?? 0
                    ).toLocaleString()} units`}
                    color="bg-gradient-to-br from-blue-500 to-cyan-600"
                  />
                  <QuickStat
                    icon={TrendingUp}
                    label="Daily Average"
                    value={`${Math.round(
                      (batteryStatus?.usageHistory.slice(-7).reduce((a, b) => a + b.usage, 0) ??
                        0) / Math.min(7, batteryStatus?.usageHistory.length || 1)
                    ).toLocaleString()} units`}
                    color="bg-gradient-to-br from-orange-500 to-red-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Details */}
          {subscription && currentPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 shadow-xl dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
                <div className="absolute top-0 right-0 p-4">
                  <Crown className="h-12 w-12 text-yellow-500 opacity-30" />
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Shield className="h-6 w-6 text-purple-600" />
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {currentPlan.name} Subscription
                    </span>
                    {subscription.status === 'active' && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                        ACTIVE
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    Premium access to all AI models with priority support
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Plan Benefits */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Plan Benefits</h4>
                      <div className="space-y-2">
                        {currentPlan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Billing Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Billing Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {subscription.billingInterval === 'annual'
                              ? 'Annual Cost'
                              : 'Monthly Cost'}
                          </span>
                          <span className="font-semibold">
                            $
                            {subscription.billingInterval === 'annual'
                              ? Math.round(currentPlan.price * 12 * 0.8).toFixed(2)
                              : currentPlan.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Next Renewal
                          </span>
                          <span className="font-semibold">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {subscription.cancelAtPeriodEnd && (
                          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                            <span className="text-sm text-red-600 dark:text-red-400">
                              ⚠️ Subscription will cancel at period end
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleManageSubscription} variant="outline" className="gap-2">
                      Manage Subscription
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Enhanced Battery Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {batteryStatus && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Detailed Usage Analytics
                  </CardTitle>
                  <CardDescription>
                    Track your battery consumption and optimize your usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Quick Actions */}
          {!subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <Card className="border-0 bg-gradient-to-r from-purple-600 to-pink-600 p-1 shadow-xl">
                <div className="rounded-lg bg-white p-8 dark:bg-gray-900">
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-4 h-12 w-12 text-purple-600" />
                    <h3 className="mb-2 text-2xl font-bold">Unlock Premium Features</h3>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">
                      Get unlimited battery, priority support, and access to all AI models
                    </p>
                    <Button
                      onClick={handleUpgrade}
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 text-white hover:from-purple-700 hover:to-pink-700"
                    >
                      View Plans
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Model Pricing Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  AI Model Pricing
                </CardTitle>
                <CardDescription>
                  Battery consumption per model - lower values mean more messages for your battery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Local Models - FREE */}
                  {Object.entries(MODEL_BATTERY_USAGE)
                    .filter(
                      ([key]) =>
                        key.includes('llama') || key.includes('qwen') || key.startsWith('ollama/')
                    )
                    .map(([modelKey, usage]) => (
                      <motion.div
                        key={modelKey}
                        whileHover={{ scale: 1.02 }}
                        className="group relative rounded-xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 p-4 transition-all hover:shadow-lg dark:border-green-600 dark:from-green-900/20 dark:to-emerald-900/20"
                      >
                        <div className="absolute -top-3 right-4">
                          <Badge className="bg-green-500 text-white dark:bg-green-600 dark:text-green-50">
                            FREE - Local Model
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{usage.emoji}</span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {usage.displayName}
                              </h4>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="py-3 text-center">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              0 BU
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Runs on your device
                            </p>
                          </div>
                          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                            Requires Ollama installed locally
                          </div>
                        </div>
                      </motion.div>
                    ))}

                  {/* Cloud Models - Paid */}
                  {Object.entries(MODEL_BATTERY_USAGE)
                    .filter(
                      ([key]) =>
                        !key.includes('llama') &&
                        !key.includes('qwen') &&
                        !key.startsWith('ollama/') &&
                        !key.includes('-cached')
                    )
                    .sort((a, b) => a[1].batteryPerKToken - b[1].batteryPerKToken)
                    .map(([modelKey, usage]) => {
                      const messagesPerThousand = Math.floor(1000 / usage.estimatedPerMessage);
                      const messagesWithCurrentBattery = batteryStatus
                        ? Math.floor(batteryStatus.totalBalance / usage.estimatedPerMessage)
                        : 0;

                      return (
                        <motion.div
                          key={modelKey}
                          whileHover={{ scale: 1.02 }}
                          className="group relative rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{usage.emoji}</span>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {usage.displayName}
                                </h4>
                              </div>
                              <div className="mt-1">
                                <Badge className={cn('text-xs', getTierColor(usage.tier))}>
                                  {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)} Tier
                                </Badge>
                              </div>
                            </div>
                            <div className="group relative">
                              <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                              <div className="pointer-events-none absolute top-6 right-0 z-10 w-48 rounded-md bg-gray-900 p-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 dark:bg-gray-700">
                                {usage.batteryPerKToken} battery units per 1K tokens
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                <MessageSquare className="mr-1 inline h-3 w-3" />
                                Per message
                              </span>
                              <span className="font-medium">
                                {usage.estimatedPerMessage < 1
                                  ? `${usage.estimatedPerMessage.toFixed(2)} BU`
                                  : `${Math.round(usage.estimatedPerMessage)} BU`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                1,000 BU gets you
                              </span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                ~{messagesPerThousand} messages
                              </span>
                            </div>
                            {batteryStatus && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Your battery
                                </span>
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  ~{messagesWithCurrentBattery.toLocaleString()} messages
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tier indicator bar */}
                          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={cn(
                                'h-full transition-all',
                                usage.tier === 'budget' && 'w-1/4 bg-gray-400 dark:bg-gray-500',
                                usage.tier === 'mid' && 'w-2/4 bg-blue-400 dark:bg-blue-500',
                                usage.tier === 'premium' &&
                                  'w-3/4 bg-purple-400 dark:bg-purple-500',
                                usage.tier === 'ultra' &&
                                  'w-full bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500'
                              )}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>

                {/* Usage tips */}
                <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h5 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                    💡 Battery Tips
                  </h5>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Local models (🏠) run FREE on your device with Ollama</li>
                    <li>• Budget tier models (⚡) give you the most messages per battery unit</li>
                    <li>• Premium models (🟣) offer advanced reasoning and capabilities</li>
                    <li>
                      • Your subscription provides {currentPlan?.dailyBattery || 0} battery units
                      daily
                    </li>
                    <li>• Unused daily battery rolls over to your total balance</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
