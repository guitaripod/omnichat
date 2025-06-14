'use client';

import { useState, useEffect } from 'react';
import { Check, ArrowRight, Zap, Crown, Rocket, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { getStripePublishableKey } from '@/lib/client-config';

// Stripe promise holder
let stripePromise: Promise<Stripe | null> | null = null;
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SIMPLE_BATTERY_PLANS, SIMPLE_BATTERY_TOPUPS } from '@/lib/battery-pricing-simple';
import { cn } from '@/lib/utils';
import { Battery as BatteryIcon, Sparkles } from 'lucide-react';
import { StripeDiagnostic } from '@/components/stripe-diagnostic';

// Plan icons
const planIcons = {
  Starter: Zap,
  Daily: Sparkles,
  Power: Rocket,
  Ultimate: Crown,
};

// Model display configuration
const getModelDisplayData = () =>
  [
    // Budget Tier
    {
      name: 'DeepSeek Chat',
      provider: 'DeepSeek',
      tier: 'budget' as const,
      batteryPerKToken: 1.4,
      estimatedPerMessage: 0.35,
      emoji: '⚡',
    },
    {
      name: 'GPT-4 Nano',
      provider: 'OpenAI',
      tier: 'budget' as const,
      batteryPerKToken: 0.5,
      estimatedPerMessage: 0.125,
      emoji: '🔵',
    },
    {
      name: 'Gemini Flash',
      provider: 'Google',
      tier: 'budget' as const,
      batteryPerKToken: 0.5,
      estimatedPerMessage: 0.125,
      emoji: '✨',
    },
    // Mid Tier
    {
      name: 'GPT-4 Mini',
      provider: 'OpenAI',
      tier: 'mid' as const,
      batteryPerKToken: 2.0,
      estimatedPerMessage: 0.5,
      emoji: '🟢',
    },
    {
      name: 'Claude Haiku',
      provider: 'Anthropic',
      tier: 'mid' as const,
      batteryPerKToken: 4.8,
      estimatedPerMessage: 1.2,
      emoji: '🎋',
    },
    {
      name: 'Grok Mini',
      provider: 'xAI',
      tier: 'mid' as const,
      batteryPerKToken: 1.6,
      estimatedPerMessage: 0.4,
      emoji: '🤖',
    },
    // Premium Tier
    {
      name: 'GPT-4',
      provider: 'OpenAI',
      tier: 'premium' as const,
      batteryPerKToken: 10.0,
      estimatedPerMessage: 2.5,
      emoji: '🟣',
    },
    {
      name: 'Claude Sonnet',
      provider: 'Anthropic',
      tier: 'premium' as const,
      batteryPerKToken: 18.0,
      estimatedPerMessage: 4.5,
      emoji: '🎭',
    },
    {
      name: 'Gemini Pro',
      provider: 'Google',
      tier: 'premium' as const,
      batteryPerKToken: 7.5,
      estimatedPerMessage: 1.875,
      emoji: '💎',
    },
    {
      name: 'Grok',
      provider: 'xAI',
      tier: 'premium' as const,
      batteryPerKToken: 18.0,
      estimatedPerMessage: 4.5,
      emoji: '🚀',
    },
    {
      name: 'Claude Opus',
      provider: 'Anthropic',
      tier: 'premium' as const,
      batteryPerKToken: 120.0,
      estimatedPerMessage: 30.0,
      emoji: '👑',
    },
    {
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      tier: 'premium' as const,
      batteryPerKToken: 20.0,
      estimatedPerMessage: 5.0,
      emoji: '⚡',
    },
  ].sort((a, b) => a.batteryPerKToken - b.batteryPerKToken);

// Initialize Stripe on demand
async function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = (async () => {
      try {
        const publishableKey = await getStripePublishableKey();
        console.log('Stripe publishable key loaded:', !!publishableKey);

        if (!publishableKey) {
          console.error('No Stripe publishable key available');
          return null;
        }

        console.log('Initializing Stripe SDK...');
        const stripe = await loadStripe(publishableKey);
        console.log('Stripe SDK initialized:', !!stripe);
        return stripe;
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        return null;
      }
    })();
  }

  return stripePromise;
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Pre-load Stripe on component mount
  useEffect(() => {
    getStripe().then((stripe) => {
      setStripeReady(!!stripe);
      if (!stripe) {
        console.error('Stripe failed to initialize on mount');
      }
    });
  }, []);

  const discount = 0.2; // 20% annual discount

  const handleSelectPlan = async (planName: string) => {
    console.log('Starting checkout for plan:', planName, 'Annual:', isAnnual);

    if (!isSignedIn) {
      console.log('User not signed in, redirecting to sign-in');
      toast.error('Please sign in to subscribe');
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    setSelectedPlan(planName);
    setIsLoading(true);

    try {
      // Check if Stripe is ready
      if (!stripeReady) {
        console.error('Stripe SDK not ready');
        toast.error('Payment system is initializing. Please try again in a moment.');
        setIsLoading(false);
        return;
      }

      console.log('Creating checkout session...');
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          planId: planName.toLowerCase(),
          isAnnual,
        }),
      });

      console.log('Checkout API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Checkout API error:', errorData);
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }

      const data = await response.json();
      console.log('Checkout session created:', data);

      const { sessionId } = data as { sessionId: string };

      // Get Stripe instance
      console.log('Getting Stripe instance...');
      const stripe = await getStripe();

      if (!stripe) {
        console.error('Stripe SDK not available');
        throw new Error('Payment system unavailable');
      }

      console.log('Redirecting to Stripe checkout...');
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Checkout error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Checkout failed: ${errorMessage}`);
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleBuyBattery = async (units: number, _price: number) => {
    console.log('Starting battery purchase for units:', units);

    if (!isSignedIn) {
      console.log('User not signed in, redirecting to sign-in');
      toast.error('Please sign in to purchase');
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    setIsLoading(true);

    try {
      // Check if Stripe is ready
      if (!stripeReady) {
        console.error('Stripe SDK not ready');
        toast.error('Payment system is initializing. Please try again in a moment.');
        setIsLoading(false);
        return;
      }

      console.log('Creating battery checkout session...');
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: units,
        }),
      });

      console.log('Battery checkout API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Battery checkout API error:', errorData);
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }

      const data = await response.json();
      console.log('Battery checkout session created:', data);

      const { sessionId } = data as { sessionId: string };

      // Get Stripe instance
      console.log('Getting Stripe instance for battery purchase...');
      const stripe = await getStripe();

      if (!stripe) {
        console.error('Stripe SDK not available');
        throw new Error('Payment system unavailable');
      }

      console.log('Redirecting to Stripe checkout for battery purchase...');
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Battery checkout error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Checkout failed: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Pricing Plans" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto max-w-7xl px-4 py-16 lg:py-24">
          {/* Stripe Diagnostic - Remove this in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8">
              <StripeDiagnostic />
            </div>
          )}

          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg lg:text-xl">
              Pay only for the battery units you need. No hidden fees, no complicated features.
            </p>

            {/* Annual Toggle */}
            <div className="mt-10 inline-flex items-center gap-4 rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
              <button
                className={cn(
                  'rounded-full px-6 py-2 text-sm font-medium transition-all',
                  !isAnnual
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
                onClick={() => setIsAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={cn(
                  'flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all',
                  isAnnual
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
                onClick={() => setIsAnnual(true)}
              >
                Annual
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>

          {/* How Battery Works */}
          <Card className="mb-16 border-2 bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BatteryIcon className="h-5 w-5 text-blue-600" />
                How Battery Units Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
                <div className="text-center">
                  <div className="mb-3 text-3xl">🔋</div>
                  <h3 className="mb-2 text-lg font-semibold">Simple Pricing</h3>
                  <p className="text-muted-foreground text-sm">1 Battery Unit = $0.001</p>
                </div>
                <div className="text-center">
                  <div className="mb-3 text-3xl">📊</div>
                  <h3 className="mb-2 text-lg font-semibold">Usage Based</h3>
                  <p className="text-muted-foreground text-sm">
                    Different models use different amounts
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-3 text-3xl">💰</div>
                  <h3 className="mb-2 text-lg font-semibold">No Waste</h3>
                  <p className="text-muted-foreground text-sm">Unused daily units roll over</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="subscription" className="mb-20">
            <TabsList className="bg-muted/50 sr-only mx-auto mb-12 grid h-14 w-full max-w-md grid-cols-2">
              <TabsTrigger
                value="subscription"
                className="data-[state=active]:bg-background font-semibold data-[state=active]:shadow-sm"
              >
                Subscription Plans
              </TabsTrigger>
              <TabsTrigger
                value="paygo"
                className="data-[state=active]:bg-background font-semibold data-[state=active]:shadow-sm"
              >
                Pay As You Go
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-12">
              {/* Free Tier + Subscription Plans Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-8">
                {/* Free Tier */}
                <Card className="relative border-2 border-green-200 transition-all hover:shadow-lg dark:border-green-800">
                  <CardHeader className="pt-6 pb-6">
                    <div className="bg-muted mx-auto mb-4 w-fit rounded-xl p-3">
                      <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-center text-2xl">Free</CardTitle>
                    <CardDescription className="text-center">
                      Start with your own API keys
                    </CardDescription>
                    <div className="mt-6 text-center">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground">/forever</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>Use your own API keys</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>Local AI models (Ollama)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>Basic chat features</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => router.push('/chat')}
                    >
                      Start Free
                    </Button>
                  </CardFooter>
                </Card>

                {/* Paid Plans */}
                {SIMPLE_BATTERY_PLANS.map((plan) => {
                  const monthlyPrice = isAnnual ? plan.price * (1 - discount) : plan.price;
                  const isPopular = plan.name === 'Daily';
                  const PlanIcon = planIcons[plan.name as keyof typeof planIcons] || Zap;

                  return (
                    <Card
                      key={plan.name}
                      className={cn(
                        'relative border-2 transition-all hover:shadow-lg',
                        isPopular
                          ? 'border-purple-300 shadow-md dark:border-purple-700'
                          : 'border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-purple-600 px-3 py-1 text-white">MOST POPULAR</Badge>
                        </div>
                      )}
                      <CardHeader className="pt-6 pb-6">
                        <div className="bg-muted mx-auto mb-4 w-fit rounded-xl p-3">
                          <PlanIcon
                            className={cn(
                              'h-6 w-6',
                              isPopular
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <CardTitle className="text-center text-2xl">{plan.name}</CardTitle>
                        <CardDescription className="text-center">
                          {plan.description}
                        </CardDescription>
                        <div className="mt-6 text-center">
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold">${monthlyPrice.toFixed(2)}</span>
                            <span className="text-muted-foreground ml-1">/month</span>
                          </div>
                          {isAnnual && (
                            <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                              Save ${(plan.price * 12 * discount).toFixed(2)}/year
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Daily Battery Display */}
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-3xl font-bold">{plan.dailyBattery.toLocaleString()}</p>
                          <p className="text-muted-foreground text-xs">battery units per day</p>
                        </div>

                        {/* Estimated Usage */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Budget AI:</span>
                            <span className="font-medium">
                              ~{plan.estimatedChats.budget} chats/day
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Premium AI:</span>
                            <span className="font-medium">
                              ~{plan.estimatedChats.premium} chats/day
                            </span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter>
                        <Button
                          className={cn('w-full', isPopular && 'bg-purple-600 hover:bg-purple-700')}
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={() => handleSelectPlan(plan.name)}
                          disabled={isLoading}
                        >
                          {isLoading && selectedPlan === plan.name ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Processing...
                            </>
                          ) : (
                            'Subscribe'
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              {/* Simple Comparison Table */}
              <div className="mt-20">
                <h3 className="mb-10 text-center text-3xl font-bold">Compare Plans</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 bg-gray-50 dark:bg-gray-800">
                        <th className="p-4 text-left font-semibold">Feature</th>
                        <th className="p-4 text-center font-semibold">Free</th>
                        {SIMPLE_BATTERY_PLANS.map((plan) => (
                          <th key={plan.name} className="p-4 text-center font-semibold">
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 font-medium">Own API Keys</td>
                        <td className="p-4 text-center">
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        </td>
                        {SIMPLE_BATTERY_PLANS.map((plan) => (
                          <td key={plan.name} className="p-4 text-center">
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 font-medium">Premium AI Models</td>
                        <td className="p-4 text-center">
                          <X className="mx-auto h-5 w-5 text-gray-400" />
                        </td>
                        {SIMPLE_BATTERY_PLANS.map((plan) => (
                          <td key={plan.name} className="p-4 text-center">
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 font-medium">Daily Battery Units</td>
                        <td className="p-4 text-center text-gray-500">0</td>
                        {SIMPLE_BATTERY_PLANS.map((plan) => (
                          <td
                            key={plan.name}
                            className="p-4 text-center text-lg font-bold text-purple-600 dark:text-purple-400"
                          >
                            {plan.dailyBattery.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 font-medium">Monthly Battery Total</td>
                        <td className="p-4 text-center text-gray-500">0</td>
                        {SIMPLE_BATTERY_PLANS.map((plan) => (
                          <td key={plan.name} className="p-4 text-center font-medium">
                            {plan.totalBattery.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="paygo" className="mt-12">
              <div className="mx-auto max-w-4xl">
                <div className="mb-12 text-center">
                  <h2 className="mb-4 text-3xl font-bold">Pay As You Go</h2>
                  <p className="text-muted-foreground text-lg">
                    Perfect for occasional users or trying out premium models
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {SIMPLE_BATTERY_TOPUPS.map((topup) => (
                    <Card
                      key={topup.units}
                      className={cn(
                        'relative cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg',
                        topup.popular &&
                          'border-2 border-purple-300 shadow-md dark:border-purple-700'
                      )}
                      onClick={() => handleBuyBattery(topup.units, topup.price)}
                    >
                      {topup.popular && (
                        <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 bg-purple-600 px-4 py-1 text-white">
                          BEST VALUE
                        </Badge>
                      )}
                      <CardContent className="p-6 pt-8">
                        <div className="text-center">
                          <h4 className="text-xl font-bold">{topup.label}</h4>
                          <p className="text-muted-foreground mt-1">
                            {topup.units.toLocaleString()} battery units
                          </p>
                          <div className="mt-3">
                            <span className="text-3xl font-bold">${topup.price}</span>
                            <p className="text-muted-foreground text-sm">
                              ${((topup.price / topup.units) * 1000).toFixed(2)}/1K units
                            </p>
                          </div>
                          <p className="text-muted-foreground mt-4 text-sm">{topup.description}</p>
                        </div>
                        <Button
                          className="mt-4 w-full"
                          variant={topup.popular ? 'default' : 'outline'}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Processing...' : 'Buy Now'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-12 rounded-xl border-2 border-blue-200 bg-blue-50 p-8 dark:border-blue-800 dark:bg-blue-950/20">
                  <h4 className="mb-3 text-lg font-semibold">💡 Save with Subscriptions</h4>
                  <p className="text-muted-foreground">
                    Subscriptions offer up to 40% savings compared to pay-as-you-go pricing, plus
                    your unused daily battery rolls over.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Model Battery Usage */}
          <Card className="mt-20 overflow-hidden border-2">
            <CardHeader className="pb-8 text-center">
              <CardTitle className="text-3xl">Battery Usage by Model</CardTitle>
              <CardDescription className="text-lg">
                See how much each AI model costs in battery units
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getModelDisplayData().map((model) => (
                  <div
                    key={model.name}
                    className={cn(
                      'relative rounded-xl border-2 p-5 transition-all hover:shadow-lg',
                      model.tier === 'budget' &&
                        'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
                      model.tier === 'mid' &&
                        'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
                      model.tier === 'premium' &&
                        'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            model.tier === 'budget' && 'bg-green-100 dark:bg-green-900/30',
                            model.tier === 'mid' && 'bg-blue-100 dark:bg-blue-900/30',
                            model.tier === 'premium' && 'bg-purple-100 dark:bg-purple-900/30'
                          )}
                        >
                          <span className="text-2xl">{model.emoji}</span>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{model.name}</p>
                          <p className="text-muted-foreground text-sm">{model.provider}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          model.tier === 'budget' &&
                            'border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300',
                          model.tier === 'mid' &&
                            'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                          model.tier === 'premium' &&
                            'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        )}
                      >
                        {model.tier}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-muted-foreground text-sm">Cost per 1K tokens:</span>
                        <span
                          className={cn(
                            'font-bold',
                            model.tier === 'budget' && 'text-green-600 dark:text-green-400',
                            model.tier === 'mid' && 'text-blue-600 dark:text-blue-400',
                            model.tier === 'premium' && 'text-purple-600 dark:text-purple-400'
                          )}
                        >
                          {model.batteryPerKToken} BU
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-muted-foreground text-sm">Per message:</span>
                        <span className="text-sm font-medium">~{model.estimatedPerMessage} BU</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
