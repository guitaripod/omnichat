'use client';

import { useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MODEL_BATTERY_USAGE, getTierColor } from '@/lib/battery-pricing';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  remainingBattery?: number;
  disabled?: boolean;
}

export function ModelSelectorWithBattery({
  value,
  onValueChange,
  remainingBattery,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentModel = MODEL_BATTERY_USAGE[value];

  // Group models by tier
  const modelsByTier = Object.entries(MODEL_BATTERY_USAGE).reduce(
    (acc, [key, model]) => {
      if (!acc[model.tier]) acc[model.tier] = [];
      acc[model.tier].push({ key, ...model });
      return acc;
    },
    {} as Record<string, Array<{ key: string } & (typeof MODEL_BATTERY_USAGE)[string]>>
  );

  const tierOrder = ['budget', 'mid', 'premium', 'ultra'];
  const tierLabels = {
    budget: 'Budget Models',
    mid: 'Balanced Models',
    premium: 'Premium Models',
    ultra: 'Ultra Premium',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('min-w-[300px] justify-between', !currentModel && 'text-muted-foreground')}
        >
          {currentModel ? (
            <div className="flex items-center gap-2">
              <span>{currentModel.emoji}</span>
              <span>{currentModel.displayName}</span>
              <Badge variant="secondary" className="ml-2">
                {currentModel.batteryPerKToken === 0
                  ? 'Free'
                  : `${currentModel.batteryPerKToken} BU/1K`}
              </Badge>
            </div>
          ) : (
            'Select a model...'
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No model found.</CommandEmpty>
          {tierOrder.map((tier) => {
            const models = modelsByTier[tier];
            if (!models || models.length === 0) return null;

            return (
              <CommandGroup key={tier} heading={tierLabels[tier as keyof typeof tierLabels]}>
                {models.map((model) => {
                  const estimatedMessages = remainingBattery
                    ? Math.floor(remainingBattery / model.estimatedPerMessage)
                    : null;
                  const isAffordable =
                    !remainingBattery || remainingBattery >= model.estimatedPerMessage;

                  return (
                    <CommandItem
                      key={model.key}
                      value={model.key}
                      onSelect={(currentValue) => {
                        if (typeof currentValue === 'string') {
                          onValueChange(currentValue);
                          setOpen(false);
                        }
                      }}
                      disabled={!isAffordable}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{model.emoji}</span>
                          <span className={cn(!isAffordable && 'opacity-50')}>
                            {model.displayName}
                          </span>
                          {value === model.key && <Check className="h-4 w-4" />}
                        </div>
                        <Badge className={cn(getTierColor(model.tier), 'text-xs')}>
                          {model.tier}
                        </Badge>
                      </div>

                      <div className="text-muted-foreground flex w-full items-center justify-between text-xs">
                        <span>
                          {model.batteryPerKToken === 0
                            ? '♾️ Free (Local)'
                            : `🔋 ${model.batteryPerKToken} BU/1K tokens`}
                        </span>
                        {estimatedMessages !== null && (
                          <span className={cn(!isAffordable && 'text-red-500')}>
                            {isAffordable
                              ? `~${estimatedMessages.toLocaleString()} msgs left`
                              : 'Not enough battery'}
                          </span>
                        )}
                      </div>

                      {model.tier === 'ultra' && (
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                          <Sparkles className="h-3 w-3" />
                          <span>Most advanced capabilities</span>
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
