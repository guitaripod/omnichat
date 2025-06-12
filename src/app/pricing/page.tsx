'use client';

import { useState } from 'react';
import {
  Check,
  ArrowRight,
  HelpCircle,
  Server,
  Sparkles,
  Zap,
  Crown,
  Rocket,
  Shield,
  Users,
  BarChart3,
  FileText,
  Globe,
  X,
} from 'lucide-react';
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
import { BATTERY_PLANS, BATTERY_TOPUPS } from '@/lib/battery-pricing-v2';
import { MODEL_BATTERY_USAGE } from '@/lib/battery-pricing';
import { cn } from '@/lib/utils';
import { Battery as BatteryIcon } from 'lucide-react';

// Plan icons
const planIcons = {
  Free: Server,
  Starter: Zap,
  Daily: Sparkles,
  Power: Rocket,
  Ultimate: Crown,
};

// Feature icons
const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Unlimited Ollama models': Server,
  'Add your own API keys': Shield,
  '7-day chat history': FileText,
  '30-day chat history': FileText,
  'Unlimited chat history': FileText,
  'Basic export': FileText,
  'File attachments (10MB)': FileText,
  'File attachments (50MB)': FileText,
  'Image generation': Sparkles,
  'Unlimited images': Sparkles,
  'API access': Globe,
  'Usage analytics': BarChart3,
  'Team seats (5)': Users,
  'Advanced integrations': Globe,
  'Priority support': Shield,
  'SLA support': Shield,
  'Custom models': Rocket,
  'Custom prompts': Rocket,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-300 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300 opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300 opacity-10 mix-blend-multiply blur-3xl filter dark:opacity-5" />
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <Badge className="mb-4 border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            TRANSPARENT PRICING
          </Badge>
          <h1 className="mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-5xl font-bold tracking-tight text-transparent dark:from-white dark:to-gray-300">
            Choose Your AI Journey
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
            Start free with unlimited local AI. Upgrade anytime for instant access to the world's
            best AI models.
          </p>

          {/* Annual Toggle */}
          <div className="mb-8 inline-flex items-center gap-4 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
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
        <Card className="mb-16 overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-xl dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-2 text-white">
                <BatteryIcon className="h-6 w-6" />
              </div>
              How the Battery System Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="group">
                <div className="mb-4 rounded-2xl border border-white/20 bg-white/50 p-3 backdrop-blur-sm transition-all group-hover:scale-105 group-hover:shadow-lg dark:border-gray-700/20 dark:bg-gray-800/50">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <span className="text-2xl">🔋</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Simple Unit Pricing</h3>
                  <p className="text-muted-foreground text-sm">
                    1 Battery Unit = $0.001
                    <br />
                    Easy to understand costs
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="mb-4 rounded-2xl border border-white/20 bg-white/50 p-3 backdrop-blur-sm transition-all group-hover:scale-105 group-hover:shadow-lg dark:border-gray-700/20 dark:bg-gray-800/50">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Transparent Usage</h3>
                  <p className="text-muted-foreground text-sm">
                    See exact costs per model
                    <br />
                    No hidden fees
                  </p>
                </div>
              </div>
              <div className="group">
                <div className="mb-4 rounded-2xl border border-white/20 bg-white/50 p-3 backdrop-blur-sm transition-all group-hover:scale-105 group-hover:shadow-lg dark:border-gray-700/20 dark:bg-gray-800/50">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Never Waste Battery</h3>
                  <p className="text-muted-foreground text-sm">
                    Unused daily allowance
                    <br />
                    rolls over to your bank
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="subscription" className="mb-16">
          <TabsList className="mx-auto mb-12 grid h-14 w-full max-w-md grid-cols-2 p-1">
            <TabsTrigger
              value="subscription"
              className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Subscription Plans
            </TabsTrigger>
            <TabsTrigger
              value="paygo"
              className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <BatteryIcon className="mr-2 h-4 w-4" />
              Pay As You Go
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-8">
            {/* Free Tier Hero */}
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold">Start Your Journey</h2>
              <p className="text-muted-foreground">Choose the plan that fits your needs</p>
            </div>

            {/* Subscription Plans Grid */}
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Free Tier */}
              <Card className="relative overflow-hidden border-2 border-green-200 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-green-800">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-1 text-white">
                  FOREVER FREE
                </Badge>
                <CardHeader className="relative pt-8">
                  <div className="mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-3 text-white">
                    <Server className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <CardDescription className="text-base">Perfect to get started</CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/forever</span>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {/* Local Models Display */}
                  <div className="rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 p-4 text-center dark:from-green-900/30 dark:to-emerald-900/30">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      UNLIMITED LOCAL AI
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                      Run AI models on your computer
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {[
                      'Unlimited Ollama models',
                      'Add your own API keys',
                      '7-day chat history',
                      'Basic export',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-green-100 p-1 dark:bg-green-900/30">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="relative">
                  <Button
                    className="h-12 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-base hover:from-green-700 hover:to-emerald-700"
                    onClick={() => router.push('/chat')}
                  >
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Paid Plans */}
              {BATTERY_PLANS.map((plan) => {
                const monthlyPrice = isAnnual ? plan.price * (1 - discount) : plan.price;
                const isPopular = plan.name === 'Daily';
                const PlanIcon = planIcons[plan.name as keyof typeof planIcons] || Zap;

                const gradients = {
                  Starter: 'from-blue-500 to-cyan-600',
                  Daily: 'from-purple-500 to-pink-600',
                  Power: 'from-orange-500 to-red-600',
                  Ultimate: 'from-yellow-500 to-orange-600',
                };

                return (
                  <Card
                    key={plan.name}
                    className={cn(
                      'relative overflow-hidden border-2 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                      isPopular
                        ? 'scale-105 border-purple-300 lg:scale-110 dark:border-purple-700'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {isPopular && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 text-white">
                          MOST POPULAR
                        </Badge>
                      </>
                    )}

                    <CardHeader className="relative pt-8">
                      <div
                        className={cn(
                          'mx-auto mb-4 w-fit rounded-2xl bg-gradient-to-br p-3 text-white',
                          gradients[plan.name as keyof typeof gradients]
                        )}
                      >
                        <PlanIcon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-base">{plan.popularUseCase}</CardDescription>
                      <div className="mt-6">
                        <span className="text-4xl font-bold">${monthlyPrice.toFixed(2)}</span>
                        <span className="text-muted-foreground">/month</span>
                        {isAnnual && (
                          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                            Save ${(plan.price * 12 * discount).toFixed(2)}/year
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="relative space-y-6">
                      {/* Daily Battery Display */}
                      <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 p-4 text-center dark:from-gray-800 dark:to-gray-700">
                        <p className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300">
                          {plan.dailyBattery.toLocaleString()}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">Battery units per day</p>
                      </div>

                      {/* Estimated Chats */}
                      <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <p className="text-muted-foreground text-xs font-medium">DAILY CAPACITY</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Budget AI:</span>
                            <span className="text-sm font-medium">
                              ~{plan.estimatedChats.budget} chats
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Premium AI:</span>
                            <span className="text-sm font-medium">
                              ~{plan.estimatedChats.premium} chats
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 border-b border-gray-200 pb-2 dark:border-gray-700">
                          <div className="mt-0.5 rounded-full bg-orange-100 p-1 dark:bg-orange-900/30">
                            <Sparkles className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-sm font-semibold">All Premium AI Models</span>
                        </div>
                        {plan.features.map((feature, i) => {
                          const Icon = featureIcons[feature] || Check;
                          return (
                            <div key={i} className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-full bg-green-100 p-1 dark:bg-green-900/30">
                                <Icon className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="text-sm">{feature}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>

                    <CardFooter className="relative">
                      <Button
                        className={cn(
                          'h-12 w-full text-base',
                          isPopular
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                            : ''
                        )}
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
                          <>
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="mt-16">
              <h3 className="mb-8 text-center text-2xl font-bold">Compare Plans</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Feature</th>
                      <th className="p-4 text-center">Free</th>
                      {BATTERY_PLANS.map((plan) => (
                        <th key={plan.name} className="p-4 text-center">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Local AI Models</td>
                      <td className="p-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-green-600" />
                      </td>
                      {BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-4 text-center">
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Premium AI Models</td>
                      <td className="p-4 text-center">
                        <X className="mx-auto h-5 w-5 text-gray-400" />
                      </td>
                      {BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-4 text-center">
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Daily Battery</td>
                      <td className="p-4 text-center">-</td>
                      {BATTERY_PLANS.map((plan) => (
                        <td key={plan.name} className="p-4 text-center font-semibold">
                          {plan.dailyBattery.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Chat History</td>
                      <td className="p-4 text-center">7 days</td>
                      <td className="p-4 text-center">30 days</td>
                      <td className="p-4 text-center">Unlimited</td>
                      <td className="p-4 text-center">Unlimited</td>
                      <td className="p-4 text-center">Unlimited</td>
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
                <h2 className="mb-2 text-3xl font-bold">Pay As You Go</h2>
                <p className="text-muted-foreground">
                  Perfect for occasional users or trying out premium models
                </p>
              </div>

              <Card className="mb-8 border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    {BATTERY_TOPUPS.map((topup) => (
                      <Card
                        key={topup.units}
                        className={cn(
                          'relative cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg',
                          topup.popular && 'border-2 border-purple-300 dark:border-purple-700'
                        )}
                        onClick={() => handleBuyBattery(topup.units, topup.price)}
                      >
                        {topup.popular && (
                          <Badge className="absolute top-3 right-3 border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                            BEST VALUE
                          </Badge>
                        )}
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <h4 className="text-xl font-bold">{topup.label}</h4>
                              <p className="text-muted-foreground mt-1 text-sm">
                                {topup.units.toLocaleString()} battery units
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-3xl font-bold">${topup.price}</span>
                              <p className="text-muted-foreground mt-1 text-xs">
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

                  <div className="mt-8 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:from-purple-950/20 dark:to-pink-950/20">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold">
                      <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Why choose a subscription?
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        'Save up to 40% compared to pay-as-you-go',
                        'Daily battery allowance that rolls over',
                        'Access to premium features like file attachments',
                        'Priority support and faster response times',
                      ].map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Model Comparison */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <CardTitle className="text-2xl">Battery Usage by Model</CardTitle>
            <CardDescription>See exactly how much each AI model costs</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(MODEL_BATTERY_USAGE)
                .filter(([_, model]) => model.estimatedPerMessage > 0)
                .sort((a, b) => a[1].batteryPerKToken - b[1].batteryPerKToken)
                .slice(0, 12)
                .map(([key, model]) => (
                  <div
                    key={key}
                    className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-gray-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:from-gray-800 dark:to-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{model.emoji}</span>
                        <div>
                          <p className="font-medium">{model.displayName}</p>
                          <p className="text-muted-foreground text-xs capitalize">
                            {model.tier} tier
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                          {model.batteryPerKToken} BU/1K
                        </p>
                        <p className="text-muted-foreground text-xs">
                          ~{model.estimatedPerMessage} per msg
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-2 text-sm">
                See all models and their costs in the chat interface
              </p>
              <Button variant="outline" onClick={() => router.push('/chat')}>
                Try Models Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-20 text-center">
          <h2 className="mb-4 text-3xl font-bold">Still Have Questions?</h2>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl">
            Our pricing is designed to be transparent and fair. No hidden fees, no surprises. Every
            battery unit spent is tracked and visible in your dashboard.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" onClick={() => router.push('/docs')}>
              View Documentation
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Contact Support
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
