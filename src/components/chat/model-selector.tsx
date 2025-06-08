'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, Brain, Zap, Check } from 'lucide-react';
import { cn } from '@/utils';
import { AIProvider, AIModel, AI_MODELS } from '@/services/ai';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

const providerIcons: Record<AIProvider, React.ReactNode> = {
  openai: <Sparkles className="h-4 w-4" />,
  anthropic: <Brain className="h-4 w-4" />,
  google: <Zap className="h-4 w-4" />,
};

const providerColors: Record<AIProvider, string> = {
  openai: 'text-green-600 dark:text-green-400',
  anthropic: 'text-orange-600 dark:text-orange-400',
  google: 'text-blue-600 dark:text-blue-400',
};

const providerBgColors: Record<AIProvider, string> = {
  openai: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  anthropic: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
  google: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
};

const providerAccentColors: Record<AIProvider, string> = {
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  google: 'bg-blue-500',
};

const formatContextSize = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  return `${Math.round(tokens / 1000)}k`;
};

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModelInfo, setSelectedModelInfo] = useState<AIModel | undefined>();

  useEffect(() => {
    // Get all models from AI_MODELS constant
    const allModels = Object.values(AI_MODELS).flat();
    setAvailableModels(allModels);

    // Set selected model info
    const modelInfo = allModels.find((model) => model.id === selectedModel);
    setSelectedModelInfo(modelInfo);
  }, [selectedModel]);

  const groupedModels = availableModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<AIProvider, AIModel[]>
  );

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm',
          'hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none',
          'dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
          'transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedModelInfo && (
            <>
              <span className={providerColors[selectedModelInfo.provider]}>
                {providerIcons[selectedModelInfo.provider]}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedModelInfo.name}
              </span>
            </>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-gray-500 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute left-1/2 z-50 mt-2 w-[900px] max-w-[95vw] -translate-x-1/2',
              'rounded-2xl border bg-white/95 shadow-2xl backdrop-blur-xl',
              'border-gray-200 dark:border-gray-700 dark:bg-gray-900/95',
              'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 max-h-[80vh] overflow-y-auto'
            )}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/80">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select AI Model
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose from {availableModels.length} available models
              </p>
            </div>

            {/* Models Grid */}
            <div className="space-y-8 p-6">
              {Object.entries(groupedModels).map(([provider, models]) => (
                <div key={provider}>
                  {/* Provider Header */}
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        providerBgColors[provider as AIProvider].split(' ')[0]
                      )}
                    >
                      <span className={providerColors[provider as AIProvider]}>
                        {providerIcons[provider as AIProvider]}
                      </span>
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold tracking-wider text-gray-900 uppercase dark:text-white">
                        {provider}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {models.length} models available
                      </p>
                    </div>
                  </div>

                  {/* Models Grid */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelChange(model.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'group relative rounded-xl border-2 p-4 text-left transition-all duration-200',
                          'hover:scale-[1.02] hover:shadow-lg',
                          selectedModel === model.id
                            ? cn('border-2', providerBgColors[provider as AIProvider])
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        )}
                      >
                        {/* Selection indicator */}
                        {selectedModel === model.id && (
                          <div
                            className={cn(
                              'absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full',
                              providerAccentColors[provider as AIProvider]
                            )}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}

                        {/* Model Content */}
                        <div className="space-y-3">
                          {/* Name and specs */}
                          <div>
                            <h5
                              className={cn(
                                'text-base font-semibold',
                                selectedModel === model.id
                                  ? providerColors[provider as AIProvider]
                                  : 'text-gray-900 dark:text-white'
                              )}
                            >
                              {model.name}
                            </h5>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <span className="font-mono font-medium">
                                  {formatContextSize(model.contextWindow)}
                                </span>
                                <span>ctx</span>
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="flex items-center gap-1">
                                <span className="font-mono font-medium">
                                  {formatContextSize(model.maxOutput)}
                                </span>
                                <span>out</span>
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {model.description && (
                            <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                              {model.description}
                            </p>
                          )}

                          {/* Features */}
                          <div className="flex items-center gap-2">
                            {model.supportsVision && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                <span className="h-1 w-1 rounded-full bg-purple-500" />
                                Vision
                              </span>
                            )}
                            {model.supportsTools && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                <span className="h-1 w-1 rounded-full bg-amber-500" />
                                Tools
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
