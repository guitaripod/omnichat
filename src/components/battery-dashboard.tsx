'use client';

import { Battery, Zap, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateDailyStats,
  formatTimeUntilReset,
  getBatteryStatusMessage,
  estimateDailyChats,
  BATTERY_PLANS,
  BATTERY_TOPUPS,
} from '@/lib/battery-pricing-v2';
import { MODEL_BATTERY_USAGE } from '@/lib/battery-pricing';
import { cn } from '@/lib/utils';

interface BatteryDashboardProps {
  userId: string;
  subscription: (typeof BATTERY_PLANS)[0] | null;
  totalBattery: number;
  usageHistory: Array<{ date: string; usage: number; model: string }>;
  onUpgrade: () => void;
  onTopUp: (units: number, price: number) => void;
}

export function BatteryDashboard({
  userId,
  subscription,
  totalBattery,
  usageHistory,
  onUpgrade,
  onTopUp,
}: BatteryDashboardProps) {
  const stats = calculateDailyStats(userId, subscription, totalBattery, usageHistory);
  const status = getBatteryStatusMessage(stats);

  // Calculate percentages
  const dailyUsedPercent =
    stats.dailyAllowance > 0 ? (stats.usedToday / stats.dailyAllowance) * 100 : 0;
  const totalPercent = subscription
    ? (stats.totalRemaining / subscription.totalBattery) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Status Alert - Only show for critical battery depletion */}
      {status.type === 'danger' && stats.totalRemaining <= 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Battery depleted! Top up to continue.</span>
          <Button size="sm" variant="destructive" onClick={onUpgrade} className="ml-auto">
            Top Up Now
          </Button>
        </div>
      )}

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="total">Total Battery</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Daily Battery Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Battery</CardTitle>
                  <CardDescription>
                    {subscription
                      ? `Resets in ${formatTimeUntilReset(stats.resetTime)}`
                      : 'Pay-as-you-go mode'}
                  </CardDescription>
                </div>
                <Battery
                  className={cn(
                    'h-8 w-8',
                    dailyUsedPercent > 80 && 'text-orange-500',
                    dailyUsedPercent > 95 && 'text-red-500',
                    dailyUsedPercent <= 80 && 'text-green-500'
                  )}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Used: {stats.usedToday.toLocaleString()} BU</span>
                  <span>
                    {subscription
                      ? `${stats.remainingToday.toLocaleString()} / ${stats.dailyAllowance.toLocaleString()} BU`
                      : 'No daily limit'}
                  </span>
                </div>
                <Progress value={dailyUsedPercent} className="h-3" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{stats.averageDailyUsage}</p>
                  <p className="text-muted-foreground text-xs">Avg daily usage (BU)</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {stats.daysRemaining === Infinity ? '∞' : stats.daysRemaining}
                  </p>
                  <p className="text-muted-foreground text-xs">Days remaining</p>
                </div>
              </div>

              {/* Model Estimator */}
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">Chats remaining today:</p>
                <div className="space-y-2">
                  {['gpt-4.1-mini', 'claude-haiku-3.5', 'gpt-4.1'].map((model) => {
                    const chats = estimateDailyChats(stats.remainingToday, model);
                    const modelInfo = MODEL_BATTERY_USAGE[model];
                    return (
                      <div key={model} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{modelInfo.emoji}</span>
                          <span>{modelInfo.displayName}</span>
                        </div>
                        <span className="font-mono">~{chats === Infinity ? '∞' : chats} chats</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Top-up Options */}
          {!subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Top-up</CardTitle>
                <CardDescription>Add battery units instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {BATTERY_TOPUPS.map((topup) => (
                    <Button
                      key={topup.units}
                      variant={topup.popular ? 'default' : 'outline'}
                      className="flex h-auto flex-col items-start px-4 py-3"
                      onClick={() => onTopUp(topup.units, topup.price)}
                    >
                      <div className="mb-1 flex w-full items-center justify-between">
                        <span className="font-semibold">{topup.label}</span>
                        <span className="text-sm">${topup.price}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{topup.description}</span>
                      {topup.popular && (
                        <Badge variant="secondary" className="mt-1">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Popular
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="total" className="space-y-4">
          {/* Total Battery Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Total Battery Bank</CardTitle>
                  <CardDescription>
                    {subscription ? subscription.name : 'Pay-as-you-go'} plan
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.totalRemaining.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">Battery units</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription && (
                <>
                  <Progress value={totalPercent} className="h-3" />
                  <div className="text-muted-foreground flex justify-between text-sm">
                    <span>
                      {(subscription.totalBattery - stats.totalRemaining).toLocaleString()} BU used
                    </span>
                    <span>{subscription.totalBattery.toLocaleString()} BU total</span>
                  </div>
                </>
              )}

              {/* Usage Trend */}
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="text-muted-foreground h-4 w-4" />
                  <p className="text-sm font-medium">Usage Insights</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">This month</p>
                    <p className="font-medium">
                      {usageHistory.reduce((sum, u) => sum + u.usage, 0).toLocaleString()} BU
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily average</p>
                    <p className="font-medium">{stats.averageDailyUsage} BU</p>
                  </div>
                </div>
              </div>

              {/* Upgrade Prompt */}
              {!subscription && (
                <div className="border-t pt-4">
                  <Button onClick={onUpgrade} className="w-full" variant="default">
                    <Zap className="mr-2 h-4 w-4" />
                    View Subscription Plans
                  </Button>
                  <p className="text-muted-foreground mt-2 text-center text-xs">
                    Save up to 40% with a monthly plan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          {!subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Subscribe?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Daily battery allowance</p>
                      <p className="text-muted-foreground text-xs">
                        Unused battery rolls over to your total bank
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Save up to 40%</p>
                      <p className="text-muted-foreground text-xs">
                        Compared to pay-as-you-go pricing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Premium features</p>
                      <p className="text-muted-foreground text-xs">
                        File uploads, image generation, API access
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
