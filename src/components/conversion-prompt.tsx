'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Gift, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useConversionTracking } from '@/hooks/use-conversion-tracking';
import { Button } from '@/components/ui/button';

const triggerIcons = {
  usage: <TrendingUp className="h-5 w-5" />,
  time: <Gift className="h-5 w-5" />,
  feature: <Sparkles className="h-5 w-5" />,
  milestone: <Zap className="h-5 w-5" />,
};

export function ConversionPrompt() {
  const router = useRouter();
  const { activeTrigger, isVisible, dismiss } = useConversionTracking();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isVisible && !hasInteracted) {
      // Delay animation for smooth entrance
      const timer = setTimeout(() => setIsAnimating(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hasInteracted]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setHasInteracted(true);
    setTimeout(() => {
      dismiss();
    }, 300);
  };

  const handleCTA = () => {
    router.push('/pricing');
    handleDismiss();
  };

  if (!isVisible || !activeTrigger) return null;

  return (
    <div
      className={cn(
        'fixed right-4 bottom-20 z-40 w-96 transform transition-all duration-500 ease-out',
        isAnimating ? 'translate-x-0 scale-100 opacity-100' : 'translate-x-full scale-95 opacity-0'
      )}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10" />

        {/* Content */}
        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon and message */}
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-500 text-white">
              {triggerIcons[activeTrigger.type]}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTrigger.message}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {activeTrigger.type === 'milestone' && "You've reached a milestone!"}
                {activeTrigger.type === 'feature' && 'Unlock the full potential'}
                {activeTrigger.type === 'time' && 'Special offer for loyal users'}
                {activeTrigger.type === 'usage' && 'Based on your usage patterns'}
              </p>
            </div>
          </div>

          {/* Stats or benefits */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-purple-50 p-2 text-center dark:bg-purple-900/30">
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">15+</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">AI Models</div>
            </div>
            <div className="rounded-lg bg-violet-50 p-2 text-center dark:bg-violet-900/30">
              <div className="text-lg font-bold text-violet-700 dark:text-violet-300">10x</div>
              <div className="text-xs text-violet-600 dark:text-violet-400">Faster</div>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 text-center dark:bg-indigo-900/30">
              <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">$50+</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400">Saved/mo</div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCTA}
              className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            >
              {activeTrigger.cta}
            </Button>
            <Button onClick={handleDismiss} variant="ghost" className="px-4">
              Later
            </Button>
          </div>

          {/* Urgency indicator for time-based triggers */}
          {activeTrigger.type === 'time' && (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Limited time offer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
