'use client';

import { X, Zap, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useUpgradeBanner } from '@/hooks/use-upgrade-banner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function UpgradeBanner() {
  const { isVisible, isAnimating, dismiss, isFreeTier } = useUpgradeBanner();

  if (!isVisible || !isFreeTier) return null;

  return (
    <div
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transform transition-all duration-300 ease-out',
        isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-white/20 sm:flex">
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-medium sm:text-base">
                  Unlock GPT-4, Claude, and 15+ premium models
                </span>
                <span className="text-xs text-white/90 sm:text-sm">
                  No API keys needed • Instant access
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/pricing" className="hidden sm:block">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 bg-white font-semibold text-purple-600 hover:bg-white/90"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Now
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>

              <Link href="/pricing" className="sm:hidden">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white px-2 text-xs font-semibold text-purple-600 hover:bg-white/90"
                >
                  Upgrade
                </Button>
              </Link>

              <button
                onClick={dismiss}
                className="rounded-full p-1 transition-colors hover:bg-white/20"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle shadow */}
      <div className="h-1 bg-gradient-to-b from-black/10 to-transparent" />
    </div>
  );
}
