'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Sparkles,
  Brain,
  Zap,
  Check,
  Server,
  Lock,
  CreditCard,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { cn } from '@/utils';
import { useRouter } from 'next/navigation';
import { useUserTier } from '@/hooks/use-user-tier';
import { UserTier } from '@/lib/tier';
import { ModelTooltip } from './model-tooltip';
import { PremiumBadge } from '@/components/premium-badge';

interface ModelSelectorEnhancedProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

// Mock model data for demonstration
const MOCK_MODELS = [
  // Free Ollama models
  {
    id: 'ollama/llama3.3',
    name: 'Llama 3.3',
    provider: 'ollama',
    contextWindow: 8192,
    maxOutput: 4096,
    isFree: true,
    description: 'Fast local model for general tasks',
  },
  // Premium models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsVision: true,
    supportsTools: true,
    description: 'Most capable OpenAI model with vision and tools',
    popularity: 95,
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    supportsVision: true,
    supportsTools: true,
    description: 'Best for code and complex reasoning',
    popularity: 90,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    contextWindow: 1048576,
    maxOutput: 8192,
    supportsVision: true,
    supportsWebSearch: true,
    description: 'Fastest model with 1M+ context window',
    popularity: 85,
  },
];

export function ModelSelectorEnhanced({
  selectedModel,
  onModelChange,
  className,
}: ModelSelectorEnhancedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const router = useRouter();
  const { tier } = useUserTier();
  const isPremium = tier === UserTier.PAID;

  const selectedModelInfo = MOCK_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-4 py-2.5',
          'transition-all duration-200',
          isPremium
            ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 dark:border-purple-800 dark:from-purple-900/20 dark:to-violet-900/20'
            : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
        )}
      >
        <div className="flex items-center gap-3">
          {selectedModelInfo && (
            <>
              <span
                className={cn(
                  selectedModelInfo.provider === 'openai' && 'text-green-600',
                  selectedModelInfo.provider === 'anthropic' && 'text-orange-600',
                  selectedModelInfo.provider === 'google' && 'text-blue-600',
                  selectedModelInfo.provider === 'ollama' && 'text-purple-600'
                )}
              >
                {selectedModelInfo.provider === 'openai' && <Sparkles className="h-4 w-4" />}
                {selectedModelInfo.provider === 'anthropic' && <Brain className="h-4 w-4" />}
                {selectedModelInfo.provider === 'google' && <Zap className="h-4 w-4" />}
                {selectedModelInfo.provider === 'ollama' && <Server className="h-4 w-4" />}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedModelInfo.name}
              </span>
              {isPremium && !selectedModelInfo.isFree && <PremiumBadge size="xs" />}
            </>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-gray-500 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute right-0 left-0 z-[9999] mt-2',
              'sm:right-auto sm:left-auto sm:w-[520px]',
              'rounded-xl border bg-white shadow-2xl',
              'border-gray-200 dark:border-gray-700 dark:bg-gray-900',
              'max-h-[80vh] overflow-y-auto'
            )}
          >
            {/* Header with CTA */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Select AI Model
                </h3>
                {!isPremium && (
                  <button
                    onClick={() => {
                      router.push('/pricing');
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-3 py-1 text-xs font-medium text-white transition-all hover:from-purple-700 hover:to-violet-700"
                  >
                    <Crown className="h-3 w-3" />
                    Unlock All Models
                  </button>
                )}
              </div>
            </div>

            <div className="p-3">
              {/* Free Tier Notice */}
              {!isPremium && (
                <div className="mb-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-3 dark:from-amber-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      You're using the free tier
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    Upgrade to Pro to access GPT-4, Claude, and 15+ premium models without API keys
                  </p>
                </div>
              )}

              {/* Local Models Section */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Free Local Models
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    No Limits
                  </span>
                </div>
                <div className="space-y-1">
                  {MOCK_MODELS.filter((m) => m.isFree).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all',
                        selectedModel === model.id
                          ? 'bg-green-50 ring-2 ring-green-500 dark:bg-green-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Server className="h-4 w-4 text-purple-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </span>
                          <p className="text-xs text-gray-500">{model.description}</p>
                        </div>
                      </div>
                      {selectedModel === model.id && <Check className="h-4 w-4 text-green-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Premium Models Section */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Premium Models
                  </span>
                  {isPremium ? (
                    <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <CreditCard className="h-3 w-3" />
                      Unlimited Access
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      <Lock className="h-3 w-3" />
                      Requires Pro
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {MOCK_MODELS.filter((m) => !m.isFree).map((model) => {
                    const isLocked = !isPremium;
                    return (
                      <div key={model.id} className="relative">
                        <button
                          onClick={() => {
                            if (isLocked) {
                              router.push('/pricing');
                            } else {
                              onModelChange(model.id);
                              setIsOpen(false);
                            }
                          }}
                          onMouseEnter={() => setHoveredModel(model.id)}
                          onMouseLeave={() => setHoveredModel(null)}
                          className={cn(
                            'relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all',
                            isLocked
                              ? 'cursor-pointer opacity-75 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                              : selectedModel === model.id
                                ? 'bg-purple-50 ring-2 ring-purple-500 dark:bg-purple-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                model.provider === 'openai' && 'text-green-600',
                                model.provider === 'anthropic' && 'text-orange-600',
                                model.provider === 'google' && 'text-blue-600'
                              )}
                            >
                              {model.provider === 'openai' && <Sparkles className="h-4 w-4" />}
                              {model.provider === 'anthropic' && <Brain className="h-4 w-4" />}
                              {model.provider === 'google' && <Zap className="h-4 w-4" />}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {model.name}
                                </span>
                                {model.popularity && (
                                  <span className="text-[10px] text-gray-500">
                                    {model.popularity}% use this
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{model.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLocked ? (
                              <div className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-orange-500" />
                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                  Upgrade
                                </span>
                              </div>
                            ) : (
                              <>
                                {isPremium && (
                                  <span className="text-[10px] text-purple-600 dark:text-purple-400">
                                    Using OmniChat credits
                                  </span>
                                )}
                                {selectedModel === model.id && (
                                  <Check className="h-4 w-4 text-purple-600" />
                                )}
                              </>
                            )}
                          </div>
                        </button>

                        {/* Enhanced Tooltip */}
                        {hoveredModel === model.id && (
                          <ModelTooltip
                            model={model}
                            isLocked={isLocked}
                            accessReason={
                              isLocked ? 'Upgrade to Pro or add your API key' : undefined
                            }
                            className="hidden sm:block"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom CTA */}
              {!isPremium && (
                <div className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 p-4">
                  <h4 className="text-sm font-semibold text-white">
                    🎉 Limited Time: 20% off all plans
                  </h4>
                  <p className="mt-1 text-xs text-purple-100">
                    Join 10,000+ users saving time and money with Pro
                  </p>
                  <button
                    onClick={() => {
                      router.push('/pricing');
                      setIsOpen(false);
                    }}
                    className="mt-3 w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-all hover:bg-gray-100"
                  >
                    View Plans & Pricing
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
