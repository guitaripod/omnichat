'use client';

import { useState } from 'react';
import { Battery, Zap, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  calculateDailyStats,
  formatTimeUntilReset,
  getBatteryStatusMessage,
  BATTERY_TOPUPS,
} from '@/lib/battery-pricing-v2';
import { MODEL_BATTERY_USAGE } from '@/lib/battery-pricing';

interface BatteryWidgetProps {
  userId: string;
  subscription: any | null;
  totalBattery: number;
  usageHistory: Array<{ date: string; usage: number; model: string }>;
  currentModel?: string;
  onUpgrade: () => void;
  onTopUp: (units: number, price: number) => void;
}

export function BatteryWidget({
  userId,
  subscription,
  totalBattery,
  usageHistory,
  currentModel,
  onUpgrade,
  onTopUp,
}: BatteryWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = calculateDailyStats(userId, subscription, totalBattery, usageHistory);
  const status = getBatteryStatusMessage(stats);

  // Calculate display values
  const dailyPercent =
    stats.dailyAllowance > 0
      ? Math.round((stats.remainingToday / stats.dailyAllowance) * 100)
      : 100;

  const batteryIcon =
    dailyPercent > 50 ? '🔋' : dailyPercent > 20 ? '🔋' : dailyPercent > 0 ? '🪫' : '🪫';

  const batteryColor =
    dailyPercent > 50 ? 'text-green-600' : dailyPercent > 20 ? 'text-yellow-600' : 'text-red-600';

  // Estimate remaining for current model
  const currentModelUsage = currentModel ? MODEL_BATTERY_USAGE[currentModel] : null;
  const messagesRemaining =
    currentModelUsage && currentModelUsage.estimatedPerMessage > 0
      ? Math.floor(stats.remainingToday / currentModelUsage.estimatedPerMessage)
      : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 font-mono', status.type === 'danger' && 'animate-pulse')}
        >
          <span className={batteryColor}>{batteryIcon}</span>
          <div className="flex flex-col items-start">
            <span className="text-xs leading-none">
              {subscription ? `${dailyPercent}% today` : 'Pay as you go'}
            </span>
            <span className="text-muted-foreground text-xs leading-none">
              {stats.totalRemaining.toLocaleString()} BU total
            </span>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Battery Status</h4>
            {subscription && (
              <Badge variant="secondary" className="text-xs">
                {subscription.name}
              </Badge>
            )}
          </div>

          {/* Daily Battery */}
          {subscription && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Today's Battery
                </span>
                <span className="text-muted-foreground text-xs">
                  Resets in {formatTimeUntilReset(stats.resetTime)}
                </span>
              </div>
              <Progress value={100 - dailyPercent} className="h-2" />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>{stats.usedToday} BU used</span>
                <span>
                  {stats.remainingToday} / {stats.dailyAllowance} BU
                </span>
              </div>
            </div>
          )}

          <Separator />

          {/* Total Battery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Battery className="h-3 w-3" />
                Total Battery Bank
              </span>
              <span className="font-mono font-medium">
                {stats.totalRemaining.toLocaleString()} BU
              </span>
            </div>
            {stats.daysRemaining !== Infinity && (
              <p className="text-muted-foreground text-xs">
                ~{stats.daysRemaining} days left at current usage
              </p>
            )}
          </div>

          {/* Current Model Usage */}
          {currentModel && currentModelUsage && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span>{currentModelUsage.emoji}</span>
                  <span className="font-medium">{currentModelUsage.displayName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-secondary rounded p-2">
                    <p className="text-muted-foreground">Cost per message</p>
                    <p className="font-mono font-medium">
                      ~{currentModelUsage.estimatedPerMessage} BU
                    </p>
                  </div>
                  <div className="bg-secondary rounded p-2">
                    <p className="text-muted-foreground">Messages left</p>
                    <p className="font-mono font-medium">
                      ~{messagesRemaining?.toLocaleString() || '∞'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Status Alert */}
          {status.type !== 'success' && (
            <>
              <Separator />
              <div
                className={cn(
                  'rounded p-2 text-xs',
                  status.type === 'danger' &&
                    'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
                  status.type === 'warning' &&
                    'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                )}
              >
                {status.message}
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {!subscription ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsOpen(false);
                    onTopUp(BATTERY_TOPUPS[0].units, BATTERY_TOPUPS[0].price);
                  }}
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Quick Top-up
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setIsOpen(false);
                    onUpgrade();
                  }}
                >
                  View Plans
                </Button>
              </>
            ) : (
              <>
                {stats.totalRemaining < subscription.dailyBattery * 7 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsOpen(false);
                      onTopUp(BATTERY_TOPUPS[2].units, BATTERY_TOPUPS[2].price);
                    }}
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    Add Battery
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setIsOpen(false);
                    onUpgrade();
                  }}
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Usage Stats
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
