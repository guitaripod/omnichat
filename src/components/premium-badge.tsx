'use client';

import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    badge: 'h-5 px-1.5',
    gap: 'gap-0.5',
  },
  sm: {
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
    badge: 'h-6 px-2',
    gap: 'gap-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    badge: 'h-7 px-2.5',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    badge: 'h-8 px-3',
    gap: 'gap-2',
  },
};

export function PremiumBadge({ size = 'sm', showText = false, className }: PremiumBadgeProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-sm',
        config.badge,
        config.gap,
        className
      )}
    >
      <Crown className={cn(config.icon, 'text-yellow-300')} />
      {showText && <span className={cn(config.text, 'font-medium')}>Pro</span>}
    </div>
  );
}
