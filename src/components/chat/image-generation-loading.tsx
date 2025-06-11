'use client';

import { useEffect, useState } from 'react';
import { Palette, Sparkles, Brush, Wand2 } from 'lucide-react';
import { cn } from '@/utils';

interface ImageGenerationLoadingProps {
  prompt?: string;
}

export function ImageGenerationLoading({ prompt }: ImageGenerationLoadingProps) {
  const [stage, setStage] = useState(0);
  const stages = [
    { icon: Wand2, text: 'Understanding your vision...', color: 'text-purple-500' },
    { icon: Palette, text: 'Mixing colors...', color: 'text-pink-500' },
    { icon: Brush, text: 'Painting details...', color: 'text-blue-500' },
    { icon: Sparkles, text: 'Adding finishing touches...', color: 'text-yellow-500' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [stages.length]);

  const currentStage = stages[stage];
  const Icon = currentStage.icon;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      {/* Animated Canvas */}
      <div className="relative h-64 w-64">
        {/* Background blur effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-20 blur-3xl" />

        {/* Main canvas */}
        <div className="relative h-full w-full rounded-2xl border-2 border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 rounded-2xl opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 20px, #000 21px),
                               repeating-linear-gradient(90deg, #000 0px, transparent 1px, transparent 20px, #000 21px)`,
            }}
          />

          {/* Animated paint strokes */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'absolute h-2 animate-pulse rounded-full',
                  i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-pink-400' : 'bg-blue-400'
                )}
                style={{
                  width: `${Math.random() * 60 + 40}%`,
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 40 - 20}%`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.3 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'rounded-full bg-white p-6 shadow-lg transition-all duration-500 dark:bg-gray-700',
                currentStage.color
              )}
            >
              <Icon className="h-12 w-12 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stage text */}
      <div className="space-y-2 text-center">
        <p className={cn('text-lg font-medium transition-colors duration-500', currentStage.color)}>
          {currentStage.text}
        </p>
        {prompt && (
          <p className="mx-auto line-clamp-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            "{prompt}"
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex space-x-2">
        {stages.map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-500',
              index === stage
                ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        ))}
      </div>
    </div>
  );
}
