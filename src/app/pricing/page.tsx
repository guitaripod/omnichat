'use client';

import { useState } from 'react';
import { Check, ArrowRight, HelpCircle, Server, Sparkles } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BATTERY_PLANS, BATTERY_TOPUPS } from '@/lib/battery-pricing-v2';
import { MODEL_BATTERY_USAGE } from '@/lib/battery-pricing';
import { cn } from '@/lib/utils';
import { Battery as BatteryIcon } from 'lucide-react';

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
    <div className="container mx-auto max-w-7xl px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground mb-8 text-xl">
          Start free with local AI models, upgrade for premium cloud access
        </p>

        {/* Annual Toggle */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <Label htmlFor="annual-toggle" className="text-base">
            Monthly
          </Label>
          <Switch id="annual-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} />
          <Label htmlFor="annual-toggle" className="text-base">
            Annual
            <Badge variant="secondary" className="ml-2">
              Save 20%
            </Badge>
          </Label>
        </div>
      </div>

      {/* How Battery Works */}
      <Card className="mb-12 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BatteryIcon className="h-5 w-5" />
            How the Battery System Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <span className="text-2xl">🔋</span>
              </div>
              <h3 className="mb-2 font-semibold">1 Battery Unit = $0.001</h3>
              <p className="text-muted-foreground text-sm">
                Simple unit-based pricing that's easy to understand
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="mb-2 font-semibold">See Usage Per Model</h3>
              <p className="text-muted-foreground text-sm">
                Each AI model shows its battery consumption rate
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mb-2 font-semibold">Never Overpay</h3>
              <p className="text-muted-foreground text-sm">
                Unused daily battery rolls over to your total bank
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subscription" className="mb-12">
        <TabsList className="mb-8 grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="paygo">Pay As You Go</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          {/* Subscription Plans */}
          <div className="grid gap-6 md:grid-cols-5">
            {/* Free Tier */}
            <Card className="relative border-green-200 dark:border-green-800">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                100% Free
              </Badge>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Local Models Display */}
                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
                  <Server className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium">Unlimited Local AI</p>
                  <p className="text-muted-foreground text-xs">Ollama models</p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm">Unlimited Ollama models</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm">Add your own API keys</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm">7-day chat history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm">Basic export</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => router.push('/chat')}>
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            {BATTERY_PLANS.map((plan) => {
              const monthlyPrice = isAnnual ? plan.price * (1 - discount) : plan.price;
              const isPopular = plan.name === 'Daily';

              return (
                <Card
                  key={plan.name}
                  className={cn('relative', isPopular && 'border-primary scale-105 shadow-lg')}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.popularUseCase}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${monthlyPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground">/month</span>
                      {isAnnual && (
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                          Save ${(plan.price * 12 * discount).toFixed(2)}/year
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Daily Battery Display */}
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{plan.dailyBattery}</p>
                      <p className="text-muted-foreground text-xs">Battery units per day</p>
                    </div>

                    {/* Estimated Chats */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Daily capacity:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Budget models:</span>
                          <span>~{plan.estimatedChats.budget} chats</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Premium models:</span>
                          <span>~{plan.estimatedChats.premium} chats</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <div className="mb-2 flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium">All Premium AI Models</span>
                      </div>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.name)}
                      disabled={isLoading}
                    >
                      {isLoading && selectedPlan === plan.name ? 'Loading...' : 'Choose Plan'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="paygo">
          {/* Pay As You Go */}
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Pay As You Go</CardTitle>
                <CardDescription>Perfect for occasional users or getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  {BATTERY_TOPUPS.map((topup) => (
                    <Card
                      key={topup.units}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        topup.popular && 'border-primary'
                      )}
                    >
                      <CardContent className="p-4">
                        {topup.popular && <Badge className="mb-2">Most Popular</Badge>}
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{topup.label}</h4>
                            <p className="text-muted-foreground text-sm">
                              {topup.units.toLocaleString()} battery units
                            </p>
                          </div>
                          <span className="text-2xl font-bold">${topup.price}</span>
                        </div>
                        <p className="text-muted-foreground text-xs">{topup.description}</p>
                        <Button
                          className="mt-3 w-full"
                          variant="outline"
                          size="sm"
                          onClick={() => handleBuyBattery(topup.units, topup.price)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Loading...' : 'Buy Now'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <HelpCircle className="h-4 w-4" />
                    Why choose a subscription?
                  </h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Save up to 40% compared to pay-as-you-go</li>
                    <li>• Daily battery allowance that rolls over</li>
                    <li>• Access to premium features</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Battery Usage by Model</CardTitle>
          <CardDescription>See how much battery each AI model consumes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(MODEL_BATTERY_USAGE)
              .filter(([_, model]) => model.estimatedPerMessage > 0)
              .sort((a, b) => a[1].batteryPerKToken - b[1].batteryPerKToken)
              .map(([key, model]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{model.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{model.displayName}</p>
                      <p className="text-muted-foreground text-xs">
                        {model.tier.charAt(0).toUpperCase() + model.tier.slice(1)} tier
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium">{model.batteryPerKToken} BU/1K</p>
                    <p className="text-muted-foreground text-xs">
                      ~{model.estimatedPerMessage} per msg
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="mt-12 text-center">
        <h2 className="mb-4 text-2xl font-bold">Questions?</h2>
        <p className="text-muted-foreground mb-4">
          Our pricing is designed to be transparent and fair. No hidden fees, no surprises.
        </p>
        <Button variant="outline">Contact Support</Button>
      </div>
    </div>
  );
}
