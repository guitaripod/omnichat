'use client';

import { cn } from '@/lib/utils';
import { Zap, Gauge, Brain, Search, Image, Wrench } from 'lucide-react';
import { UPGRADE_MESSAGES } from '@/lib/subscription-plans';

interface ModelTooltipProps {
  model: {
    name: string;
    description?: string;
    contextWindow: number;
    maxOutput: number;
    supportsVision?: boolean;
    supportsTools?: boolean;
    supportsWebSearch?: boolean;
    supportsImageGeneration?: boolean;
  };
  isLocked: boolean;
  accessReason?: string;
  className?: string;
}

export function ModelTooltip({ model, isLocked, accessReason, className }: ModelTooltipProps) {
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
    return tokens.toString();
  };

  return (
    <div
      className={cn(
        'absolute bottom-full left-0 z-[10000] mb-2 w-80 rounded-xl',
        'border bg-white p-4 shadow-2xl',
        'border-gray-200 dark:border-gray-700 dark:bg-gray-800',
        'pointer-events-none',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{model.name}</h4>
        {isLocked && (
          <p className="mt-1 text-xs font-medium text-orange-600 dark:text-orange-400">
            {accessReason || UPGRADE_MESSAGES.apiKey}
          </p>
        )}
      </div>

      {/* Description */}
      {model.description && (
        <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">{model.description}</p>
      )}

      {/* Specs Grid */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-900">
          <Gauge className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Context</p>
            <p className="font-mono text-xs font-medium text-gray-900 dark:text-white">
              {formatTokens(model.contextWindow)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-900">
          <Zap className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Output</p>
            <p className="font-mono text-xs font-medium text-gray-900 dark:text-white">
              {formatTokens(model.maxOutput)}
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2">
        {model.supportsVision && (
          <div className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 dark:bg-purple-900/30">
            <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300">
              Vision
            </span>
          </div>
        )}
        {model.supportsTools && (
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/30">
            <Wrench className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
              Tools
            </span>
          </div>
        )}
        {model.supportsWebSearch && (
          <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 dark:bg-blue-900/30">
            <Search className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
              Web Search
            </span>
          </div>
        )}
        {model.supportsImageGeneration && (
          <div className="flex items-center gap-1 rounded-full bg-pink-100 px-2 py-1 dark:bg-pink-900/30">
            <Image
              className="h-3 w-3 text-pink-600 dark:text-pink-400"
              aria-label="Image generation"
            />
            <span className="text-[10px] font-medium text-pink-700 dark:text-pink-300">
              Image Gen
            </span>
          </div>
        )}
      </div>

      {/* CTA for locked models */}
      {isLocked && (
        <div className="mt-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 p-3 dark:from-orange-900/20 dark:to-amber-900/20">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
            🚀 Unlock this model and save hours
          </p>
          <p className="mt-1 text-[10px] text-orange-600 dark:text-orange-400">
            Subscribers save an average of $50/month on API costs
          </p>
        </div>
      )}
    </div>
  );
}
