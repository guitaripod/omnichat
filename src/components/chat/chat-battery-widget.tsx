'use client';

import { useState, useEffect } from 'react';
import { Battery, Zap, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/use-user-data';
import { useBatteryData } from '@/hooks/use-battery-data';
import { useRouter } from 'next/navigation';
import { PremiumBadge } from '@/components/premium-badge';
import { calculateBatteryUsage } from '@/lib/battery-pricing';

interface ChatBatteryWidgetProps {
  currentModel?: string;
  isStreaming?: boolean;
  tokensUsed?: number;
}

export function ChatBatteryWidget({
  currentModel,
  isStreaming,
  tokensUsed = 0,
}: ChatBatteryWidgetProps) {
  const router = useRouter();
  const { user, isPremium, subscription } = useUserData();
  const { battery } = useBatteryData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedTokens, setAnimatedTokens] = useState(0);

  // Animate token counter when streaming
  useEffect(() => {
    if (isStreaming && tokensUsed > animatedTokens) {
      const timer = setTimeout(() => {
        setAnimatedTokens((prev) => Math.min(prev + 10, tokensUsed));
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      setAnimatedTokens(tokensUsed);
    }
  }, [tokensUsed, animatedTokens, isStreaming]);

  if (!user) return null;

  // Calculate battery data
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursRemaining = Math.max(0, (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
  const timeRemainingText =
    hoursRemaining > 1
      ? `${Math.floor(hoursRemaining)} hours left today`
      : `${Math.floor(hoursRemaining * 60)} minutes left today`;

  // Calculate battery percentage and usage
  const dailyLimit = battery?.dailyAllowance || 10000;
  const todayUsage = battery?.todayUsage || 0;
  const totalBalance = battery?.totalBalance || 0;
  const batteryPercentage = dailyLimit > 0 ? Math.round((totalBalance / dailyLimit) * 100) : 0;

  // Estimate cost for current streaming
  const estimatedBatteryUsage =
    currentModel && animatedTokens > 0
      ? calculateBatteryUsage(
          currentModel,
          Math.floor(animatedTokens / 2),
          Math.floor(animatedTokens / 2),
          false
        )
      : 0;

  // Free users see upgrade prompt
  if (!isPremium) {
    return (
      <button
        onClick={() => router.push('/billing')}
        className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title="Click to view billing and upgrade"
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Upgrade for unlimited battery</span>
        <Zap className="h-4 w-4 animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-40">
      <div
        className={cn(
          'rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 dark:border-gray-700 dark:bg-gray-800',
          isExpanded ? 'w-80' : 'w-auto'
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
          title="Click to expand battery details"
        >
          <div className="relative">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                batteryPercentage > 50
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : batteryPercentage > 20
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
              )}
            >
              <Battery
                className={cn(
                  'h-6 w-6',
                  batteryPercentage > 50
                    ? 'text-green-600 dark:text-green-400'
                    : batteryPercentage > 20
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                )}
              />
            </div>
            {isStreaming && (
              <div className="absolute -top-1 -right-1">
                <div className="h-3 w-3 animate-pulse rounded-full bg-purple-500" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {totalBalance.toLocaleString()} Battery
              </span>
              <PremiumBadge size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {isStreaming ? (
                <>
                  <Zap className="h-3 w-3 animate-pulse text-purple-500" />
                  <span className="font-mono">{animatedTokens} tokens</span>
                </>
              ) : (
                <span>{timeRemainingText}</span>
              )}
            </div>
          </div>

          <TrendingDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}
          />
        </button>

        {/* Expanded Details */}
        <div
          className={cn(
            'grid transition-all duration-300',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 p-3 pt-0">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      batteryPercentage > 50
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : batteryPercentage > 20
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          : 'bg-gradient-to-r from-red-500 to-orange-500'
                    )}
                    style={{ width: `${batteryPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{todayUsage.toLocaleString()} used today</span>
                  <span>{totalBalance.toLocaleString()} balance</span>
                </div>
              </div>

              {/* Current Session Stats */}
              {isStreaming && (
                <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
                  <p className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                    Current Stream
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                      <span className="ml-1 font-mono font-medium text-purple-600 dark:text-purple-400">
                        {animatedTokens}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Est. Battery:</span>
                      <span className="ml-1 font-mono font-medium text-purple-600 dark:text-purple-400">
                        {estimatedBatteryUsage}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Info */}
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {subscription?.tier === 'pro' ? 'Pro' : 'Premium'} Plan
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/billing');
                    }}
                    className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    View Billing →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
