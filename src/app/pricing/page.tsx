'use client';

import { useState } from 'react';
import { Check, ArrowRight, Zap, Crown, Rocket, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
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
import { MODEL_BATTERY_USAGE } from '@/lib/battery-pricing';
import { cn } from '@/lib/utils';
import { Battery as BatteryIcon, Sparkles } from 'lucide-react';

// Plan icons
const planIcons = {
  Starter: Zap,
  Daily: Sparkles,
  Power: Rocket,
  Ultimate: Crown,
};

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const discount = 0.2; // 20% annual discount

  const handleSelectPlan = async (planName: string) => {
    if (!isSignedIn) {
      toast.error('Please sign in to subscribe');
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    setSelectedPlan(planName);
    setIsLoading(true);

    try {
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

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = (await response.json()) as { sessionId: string };

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (_error) {
      console.error('Checkout error:', _error);
      toast.error('Failed to start checkout');
      setIsLoading(false);
    }
  };

  const handleBuyBattery = async (units: number, _price: number) => {
    if (!isSignedIn) {
      toast.error('Please sign in to purchase');
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: units,
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Pay only for the battery units you need. No hidden fees, no complicated features.
          </p>

          {/* Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
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
        <Card className="mb-12 border bg-white dark:bg-gray-900">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BatteryIcon className="h-5 w-5 text-blue-600" />
              How Battery Units Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 text-2xl">🔋</div>
                <h3 className="mb-1 font-semibold">Simple Pricing</h3>
                <p className="text-muted-foreground text-sm">1 Battery Unit = $0.001</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">📊</div>
                <h3 className="mb-1 font-semibold">Usage Based</h3>
                <p className="text-muted-foreground text-sm">
                  Different models use different amounts
                </p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">💰</div>
                <h3 className="mb-1 font-semibold">No Waste</h3>
                <p className="text-muted-foreground text-sm">Unused daily units roll over</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="subscription" className="mb-12">
          <TabsList className="mx-auto mb-8 grid h-12 w-full max-w-md grid-cols-2">
            <TabsTrigger value="subscription">
              <Sparkles className="mr-2 h-4 w-4" />
              Subscription Plans
            </TabsTrigger>
            <TabsTrigger value="paygo">
              <BatteryIcon className="mr-2 h-4 w-4" />
              Pay As You Go
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-8">
            {/* Free Tier + Subscription Plans Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {/* Free Tier */}
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <div className="mx-auto mb-3 w-fit rounded-xl bg-green-600 p-2 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-center text-xl">Free</CardTitle>
                  <CardDescription className="text-center">
                    Start with your own API keys
                  </CardDescription>
                  <div className="mt-4 text-center">
                    <span className="text-3xl font-bold">$0</span>
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
                  <Button className="w-full" variant="outline" onClick={() => router.push('/chat')}>
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
                      'relative border-2',
                      isPopular
                        ? 'border-purple-300 dark:border-purple-700'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white">
                        MOST POPULAR
                      </Badge>
                    )}

                    <CardHeader className={isPopular ? 'pt-6' : ''}>
                      <div
                        className={cn(
                          'mx-auto mb-3 w-fit rounded-xl p-2 text-white',
                          isPopular ? 'bg-purple-600' : 'bg-gray-600'
                        )}
                      >
                        <PlanIcon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-center text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-center">{plan.description}</CardDescription>
                      <div className="mt-4 text-center">
                        <span className="text-3xl font-bold">${monthlyPrice.toFixed(2)}</span>
                        <span className="text-muted-foreground">/month</span>
                        {isAnnual && (
                          <p className="mt-1 text-sm text-green-600">
                            Save ${(plan.price * 12 * discount).toFixed(2)}/year
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Daily Battery Display */}
                      <div className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-800">
                        <p className="text-2xl font-bold">{plan.dailyBattery.toLocaleString()}</p>
                        <p className="text-muted-foreground text-xs">battery units per day</p>
                      </div>

                      {/* Estimated Usage */}
                      <div className="space-y-1 text-sm">
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
            <div className="mt-12">
              <h3 className="mb-6 text-center text-2xl font-bold">Compare Plans</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left">Feature</th>
                      <th className="p-3 text-center">Free</th>
                      {SIMPLE_BATTERY_PLANS.map((plan) => (
                        <th key={plan.name} className="p-3 text-center">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">Own API Keys</td>
                      <td className="p-3 text-center">
                        <Check className="mx-auto h-5 w-5 text-green-600" />
                      </td>
                      {SIMPLE_BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-3 text-center">
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Premium AI Models</td>
                      <td className="p-3 text-center">
                        <X className="mx-auto h-5 w-5 text-gray-400" />
                      </td>
                      {SIMPLE_BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-3 text-center">
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Daily Battery Units</td>
                      <td className="p-3 text-center">0</td>
                      {SIMPLE_BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-3 text-center font-semibold">
                          {plan.dailyBattery.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Monthly Battery Total</td>
                      <td className="p-3 text-center">0</td>
                      {SIMPLE_BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-3 text-center">
                          {plan.totalBattery.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paygo">
            {/* Pay As You Go */}
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-bold">Pay As You Go</h2>
                <p className="text-muted-foreground">
                  Perfect for occasional users or trying out premium models
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {SIMPLE_BATTERY_TOPUPS.map((topup) => (
                  <Card
                    key={topup.units}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-lg',
                      topup.popular && 'border-2 border-purple-300 dark:border-purple-700'
                    )}
                    onClick={() => handleBuyBattery(topup.units, topup.price)}
                  >
                    {topup.popular && (
                      <Badge className="absolute -top-2 right-4 bg-purple-600 text-white">
                        BEST VALUE
                      </Badge>
                    )}
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-bold">{topup.label}</h4>
                          <p className="text-muted-foreground text-sm">
                            {topup.units.toLocaleString()} battery units
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${topup.price}</span>
                          <p className="text-muted-foreground text-xs">
                            ${((topup.price / topup.units) * 1000).toFixed(2)}/1K units
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 text-sm">{topup.description}</p>
                      <Button
                        className="w-full"
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

              <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-950/20">
                <h4 className="mb-2 font-semibold">Save with Subscriptions</h4>
                <p className="text-muted-foreground text-sm">
                  Subscriptions offer up to 40% savings compared to pay-as-you-go pricing, plus your
                  unused daily battery rolls over.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Model Battery Usage */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Battery Usage by Model</CardTitle>
            <CardDescription>See how much each AI model costs in battery units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(MODEL_BATTERY_USAGE)
                .filter(([_, model]) => model.estimatedPerMessage > 0)
                .sort((a, b) => a[1].batteryPerKToken - b[1].batteryPerKToken)
                .slice(0, 9)
                .map(([key, model]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{model.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{model.displayName}</p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {model.tier} tier
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {model.batteryPerKToken} BU/1K
                      </p>
                      <p className="text-muted-foreground text-xs">
                        ~{model.estimatedPerMessage}/msg
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
