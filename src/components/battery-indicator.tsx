'use client';

import { useState } from 'react';
import {
  formatBatteryDisplay,
  estimateRemainingMessages,
  MODEL_BATTERY_USAGE,
} from '@/lib/battery-pricing';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, AlertCircle } from 'lucide-react';

interface BatteryIndicatorProps {
  remainingUnits: number;
  totalUnits: number;
  currentModel?: string;
  onRecharge?: () => void;
}

export function BatteryIndicator({
  remainingUnits,
  totalUnits,
  currentModel,
  onRecharge,
}: BatteryIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const battery = formatBatteryDisplay(remainingUnits, totalUnits);
  const estimates = estimateRemainingMessages(remainingUnits);

  // Show warning if battery is low
  const showWarning = battery.percentage <= 10;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`gap-2 ${showWarning ? 'animate-pulse' : ''}`}>
          <span className={battery.color}>{battery.icon}</span>
          <span className="font-mono text-sm">{battery.text}</span>
          {showWarning && <AlertCircle className="h-4 w-4 text-red-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">Battery Status</h3>
            <Progress value={battery.percentage} className="h-3" />
            <p className="text-muted-foreground mt-1 text-sm">
              {remainingUnits.toLocaleString()} of {totalUnits.toLocaleString()} units remaining
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Estimated Messages Remaining</h4>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {Object.entries(MODEL_BATTERY_USAGE)
                .filter(([_, usage]) => usage.estimatedPerMessage > 0)
                .sort((a, b) => a[1].batteryPerKToken - b[1].batteryPerKToken)
                .map(([model, usage]) => {
                  const messages = estimates[model];
                  const isCurrent = model === currentModel;

                  return (
                    <div
                      key={model}
                      className={`flex items-center justify-between rounded p-2 text-sm ${
                        isCurrent ? 'bg-primary/10 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{usage.emoji}</span>
                        <span>{usage.displayName}</span>
                        {isCurrent && (
                          <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          ~{messages.toLocaleString()} msgs
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {usage.batteryPerKToken} BU/1K
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {showWarning && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ⚠️ Low battery! Your messages may be limited soon.
              </p>
            </div>
          )}

          {onRecharge && (
            <Button
              onClick={onRecharge}
              className="w-full"
              variant={showWarning ? 'default' : 'outline'}
            >
              <Zap className="mr-2 h-4 w-4" />
              Recharge Battery
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact battery indicator for model selector
export function ModelBatteryIndicator({ model }: { model: string }) {
  const usage = MODEL_BATTERY_USAGE[model];
  if (!usage) return null;

  const getBatteryIcon = (batteryPerKToken: number) => {
    if (batteryPerKToken === 0) return '♾️';
    if (batteryPerKToken <= 1) return '🟢';
    if (batteryPerKToken <= 5) return '🟡';
    if (batteryPerKToken <= 20) return '🟠';
    return '🔴';
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <span>{getBatteryIcon(usage.batteryPerKToken)}</span>
      <span className="font-mono">
        {usage.batteryPerKToken === 0 ? 'Free' : `${usage.batteryPerKToken} BU/1K`}
      </span>
      <span className="text-muted-foreground">(~{usage.estimatedPerMessage} per msg)</span>
    </div>
  );
}
