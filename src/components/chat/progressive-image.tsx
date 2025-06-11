'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  skipLoadingState?: boolean;
}

export function ProgressiveImage({
  src,
  alt,
  className,
  skipLoadingState = false,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);

  useEffect(() => {
    // Preload the image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
      // Start the reveal animation
      setTimeout(() => {
        setRevealing(true);
        // Animate the reveal progress
        const duration = 2000; // 2 seconds
        const steps = 20;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          setRevealProgress((currentStep / steps) * 100);

          if (currentStep >= steps) {
            clearInterval(interval);
          }
        }, stepDuration);
      }, 100);
    };
  }, [src]);

  if (!loaded && !skipLoadingState) {
    // Show placeholder while loading
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 dark:border-gray-600 dark:border-t-blue-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading image...</p>
          </div>
        </div>
        <div className="aspect-square" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Background blur placeholder */}
      <img
        src={src}
        alt={alt}
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-all duration-500',
          revealing ? 'scale-110 blur-xl' : 'scale-125 blur-3xl'
        )}
      />

      {/* Progressive reveal mask */}
      <div
        className="relative overflow-hidden"
        style={{
          clipPath: revealing
            ? `polygon(0 0, 100% 0, 100% ${revealProgress}%, 0 ${revealProgress}%)`
            : 'polygon(0 0, 0 0, 0 0, 0 0)',
        }}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>

      {/* Scan line effect */}
      {revealing && revealProgress < 100 && (
        <div
          className="absolute right-0 left-0 h-1 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-80"
          style={{
            top: `${revealProgress}%`,
            transform: 'translateY(-50%)',
            filter: 'blur(2px)',
          }}
        />
      )}

      {/* Shimmer effect at the reveal edge */}
      {revealing && revealProgress < 100 && (
        <div
          className="absolute right-0 left-0 h-32 bg-gradient-to-b from-white/20 to-transparent"
          style={{
            top: `${revealProgress}%`,
            transform: 'translateY(-100%)',
          }}
        />
      )}
    </div>
  );
}
