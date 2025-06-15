'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  ArrowRight,
  Zap,
  Crown,
  Rocket,
  X,
  Star,
  Sparkles as SparklesIcon,
  Battery,
  TrendingUp,
  Infinity,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { getStripePublishableKey } from '@/lib/client-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SIMPLE_BATTERY_PLANS, SIMPLE_BATTERY_TOPUPS } from '@/lib/battery-pricing-simple';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Stripe promise holder
let stripePromise: Promise<Stripe | null> | null = null;

// Plan data with enhanced features
const planData = {
  starter: {
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    popular: false,
    features: [
      'Access to all AI models',
      '200 battery units daily',
      'Standard processing speed',
      'Email support',
    ],
  },
  daily: {
    icon: SparklesIcon,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    popular: true,
    features: [
      'Access to all AI models',
      '600 battery units daily',
      'Priority processing',
      'Priority email support',
    ],
  },
  power: {
    icon: Rocket,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    popular: false,
    features: [
      'Access to all AI models',
      '1,500 battery units daily',
      'Priority processing',
      'Priority support',
      'Battery rollover',
    ],
  },
  ultimate: {
    icon: Crown,
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    popular: false,
    features: [
      'Access to all AI models',
      '3,000 battery units daily',
      'Priority processing',
      'Dedicated support',
      'Battery rollover',
      'Custom integrations',
    ],
  },
};

// Animated background
function PricingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/2 -left-1/2 h-[100vh] w-[100vh] rounded-full bg-gradient-to-br from-purple-300 to-pink-300 opacity-20 blur-3xl dark:from-purple-700 dark:to-pink-700 dark:opacity-10" />
      <div className="absolute -right-1/2 -bottom-1/2 h-[100vh] w-[100vh] rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 opacity-20 blur-3xl dark:from-blue-700 dark:to-cyan-700 dark:opacity-10" />
    </div>
  );
}

// Feature comparison data
const featureCategories = [
  {
    name: 'AI Models',
    features: [
      { name: 'GPT-4 Access', starter: true, daily: true, power: true, ultimate: true },
      { name: 'Claude 3.5 Access', starter: true, daily: true, power: true, ultimate: true },
      { name: 'Image Generation', starter: true, daily: true, power: true, ultimate: true },
      { name: 'Priority Processing', starter: false, daily: true, power: true, ultimate: true },
    ],
  },
  {
    name: 'Usage Limits',
    features: [
      {
        name: 'Daily Battery Refresh',
        starter: '200',
        daily: '600',
        power: '1,500',
        ultimate: '5,000',
      },
      {
        name: 'Monthly Total',
        starter: '6,000',
        daily: '18,000',
        power: '45,000',
        ultimate: '150,000',
      },
      { name: 'Rollover Credits', starter: false, daily: false, power: true, ultimate: true },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: 'Email Support', starter: true, daily: true, power: true, ultimate: true },
      { name: 'Priority Support', starter: false, daily: false, power: true, ultimate: true },
      {
        name: 'Dedicated Account Manager',
        starter: false,
        daily: false,
        power: false,
        ultimate: true,
      },
    ],
  },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  // Load Stripe SDK
  useEffect(() => {
    const initStripe = async () => {
      const publishableKey = await getStripePublishableKey();
      if (publishableKey) {
        stripePromise = loadStripe(publishableKey);
        const stripe = await stripePromise;
        setStripeReady(!!stripe);
      }
    };
    initStripe();
  }, []);

  const getStripe = async () => {
    if (!stripePromise) {
      const publishableKey = await getStripePublishableKey();
      if (!publishableKey) {
        throw new Error('Stripe publishable key not found');
      }
      stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
  };

  const handleSubscribe = async (planName: string) => {
    if (!isSignedIn) {
      toast.error('Please sign in to subscribe');
      router.push('/auth/sign-in?redirect_url=/pricing');
      return;
    }

    setSelectedPlan(planName);
    setIsLoading(true);

    try {
      if (!stripeReady) {
        toast.error('Payment system is initializing. Please try again in a moment.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          planId: planName.toLowerCase(),
          isAnnual,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }

      const data = (await response.json()) as { sessionId: string };
      const sessionId = data.sessionId;
      const stripe = await getStripe();

      if (!stripe) {
        throw new Error('Payment system unavailable');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Checkout failed: ${errorMessage}`);
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleBuyBattery = async (units: number, _price: number) => {
    if (!isSignedIn) {
      toast.error('Please sign in to purchase');
      router.push('/auth/sign-in?redirect_url=/pricing');
      return;
    }

    setIsLoading(true);

    try {
      if (!stripeReady) {
        toast.error('Payment system is initializing. Please try again in a moment.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: units,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }

      const data = (await response.json()) as { sessionId: string };
      const sessionId = data.sessionId;
      const stripe = await getStripe();

      if (!stripe) {
        throw new Error('Payment system unavailable');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Battery checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Checkout failed: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Choose Your Plan" />

      <div className="relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <PricingBackground />

        <div className="relative container mx-auto max-w-7xl px-4 py-16 lg:py-24">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h1 className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent lg:text-6xl">
              Power Your AI Experience
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 lg:text-xl dark:text-gray-400">
              Choose the perfect battery plan for your needs. Upgrade anytime, cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="mt-10 inline-flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
              <button
                className={cn(
                  'rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200',
                  !isAnnual
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                )}
                onClick={() => setIsAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={cn(
                  'flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200',
                  isAnnual
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                )}
                onClick={() => setIsAnnual(true)}
              >
                Annual
                <Badge className="border-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  Save 20%
                </Badge>
              </button>
            </div>
          </motion.div>

          {/* Battery Explanation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16"
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Battery className="h-6 w-6 text-blue-600" />
                  How Battery Units Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 md:grid-cols-3">
                  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Battery className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Simple Pricing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      1 Battery Unit = $0.001
                      <br />
                      Easy to understand costs
                    </p>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Usage Based</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Different models use different
                      <br />
                      amounts of battery per message
                    </p>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Infinity className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Never Expire</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Unused battery units roll over
                      <br />
                      No waste, full flexibility
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing Cards */}
          <div className="mb-16 grid gap-8 lg:grid-cols-4">
            {SIMPLE_BATTERY_PLANS.map((plan, index) => {
              const config = planData[plan.name.toLowerCase() as keyof typeof planData];
              const Icon = config.icon;
              const monthlyPrice = plan.price;
              const annualPrice = Math.round(plan.price * 12 * 0.8);
              const displayPrice = isAnnual ? Math.round(annualPrice / 12) : monthlyPrice;

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                  onMouseEnter={() => setHoveredPlan(plan.name)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className="relative"
                >
                  {config.popular && (
                    <div className="absolute -top-4 right-0 left-0 z-10 flex justify-center">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 text-sm text-white">
                        <Star className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <Card
                    className={cn(
                      'relative h-full transition-all duration-300',
                      config.popular
                        ? 'scale-105 border-2 border-purple-500 shadow-2xl'
                        : 'border-0 shadow-lg',
                      hoveredPlan === plan.name && '-translate-y-2 transform shadow-2xl'
                    )}
                  >
                    <div
                      className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', config.color)}
                    />

                    <CardHeader className="pb-6 text-center">
                      <div
                        className={cn(
                          'mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br',
                          config.color,
                          'text-white shadow-lg'
                        )}
                      >
                        <Icon className="h-8 w-8" />
                      </div>

                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {plan.name === 'Starter' && 'Perfect for getting started'}
                        {plan.name === 'Daily' && 'Most popular for regular users'}
                        {plan.name === 'Power' && 'For power users and teams'}
                        {plan.name === 'Ultimate' && 'Maximum power, no limits'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-8">
                      <div className="mb-6 text-center">
                        <div className="flex items-baseline justify-center">
                          <span className="text-5xl font-bold">${displayPrice}</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
                        </div>
                        {isAnnual && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Billed ${annualPrice} annually
                          </p>
                        )}
                      </div>

                      <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Daily Battery</span>
                          <span className="font-bold text-purple-600">
                            {plan.dailyBattery.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Monthly Total</span>
                          <span className="font-bold text-purple-600">
                            {plan.totalBattery.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <ul className="mb-8 space-y-3">
                        {config.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <Check className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscribe(plan.name)}
                        disabled={isLoading && selectedPlan === plan.name}
                        className={cn(
                          'w-full gap-2 font-semibold transition-all',
                          config.popular
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                        )}
                        size="lg"
                      >
                        {isLoading && selectedPlan === plan.name ? (
                          <>Processing...</>
                        ) : (
                          <>
                            Get Started
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* One-Time Battery Purchases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-16"
          >
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold">Need More Battery?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Top up anytime with one-time battery purchases
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              {SIMPLE_BATTERY_TOPUPS.map((topup, _index) => (
                <motion.div
                  key={topup.units}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
                    <CardHeader className="relative pb-4">
                      <CardTitle className="text-xl">
                        {topup.units.toLocaleString()} Units
                      </CardTitle>
                      <CardDescription>${topup.price}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        ≈ {Math.round(topup.units / 2.5).toLocaleString()} messages
                      </p>
                      <Button
                        onClick={() => handleBuyBattery(topup.units, topup.price)}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                      >
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Feature Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold">Detailed Feature Comparison</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Everything included in each plan
              </p>
            </div>

            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800">
                      <th className="px-6 py-4 text-left text-sm font-semibold">Features</th>
                      {SIMPLE_BATTERY_PLANS.map((plan) => (
                        <th key={plan.name} className="px-6 py-4 text-center text-sm font-semibold">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureCategories.map((category) => (
                      <>
                        <tr
                          key={category.name}
                          className="border-b bg-gray-50/50 dark:bg-gray-800/50"
                        >
                          <td
                            colSpan={5}
                            className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
                          >
                            {category.name}
                          </td>
                        </tr>
                        {category.features.map((feature) => (
                          <tr key={feature.name} className="border-b">
                            <td className="px-6 py-4 text-sm">{feature.name}</td>
                            {['starter', 'daily', 'power', 'ultimate'].map((planKey) => (
                              <td key={planKey} className="px-6 py-4 text-center">
                                {typeof feature[planKey as keyof typeof feature] === 'boolean' ? (
                                  feature[planKey as keyof typeof feature] ? (
                                    <Check className="mx-auto h-5 w-5 text-green-600" />
                                  ) : (
                                    <X className="mx-auto h-5 w-5 text-gray-300" />
                                  )
                                ) : (
                                  <span className="text-sm font-medium">
                                    {feature[planKey as keyof typeof feature]}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-24 text-center"
          >
            <Card className="border-0 bg-gradient-to-br from-purple-600 to-pink-600 p-1 shadow-2xl">
              <div className="rounded-lg bg-white p-12 dark:bg-gray-900">
                <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
                <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
                  Join thousands of users powering their AI workflows with OmniChat
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Button
                    size="lg"
                    onClick={() => handleSubscribe('Daily')}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 text-white hover:from-purple-700 hover:to-pink-700"
                  >
                    Start with Daily Plan
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push('/chat')}>
                    Try Free First
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
