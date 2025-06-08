import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size], className)} />;
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading size="lg" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <Loading size="lg" />
    </div>
  );
}
