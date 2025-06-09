'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, Brain, Zap, Check, Server } from 'lucide-react';
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
  ollama: <Server className="h-4 w-4" />,
};

const providerColors: Record<AIProvider, string> = {
  openai: 'text-green-600 dark:text-green-400',
  anthropic: 'text-orange-600 dark:text-orange-400',
  google: 'text-blue-600 dark:text-blue-400',
  ollama: 'text-purple-600 dark:text-purple-400',
};

const providerBgColors: Record<AIProvider, string> = {
  openai: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  anthropic: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
  google: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
  ollama: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
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
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

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
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute right-0 left-0 z-[9999] mt-2',
              'sm:right-auto sm:left-auto sm:w-[480px]',
              'rounded-xl border bg-white/95 shadow-2xl backdrop-blur-xl',
              'border-gray-200 dark:border-gray-700 dark:bg-gray-900/95',
              'max-h-[70vh] overflow-y-auto'
            )}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/80">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select Model</h3>
            </div>

            {/* Models List */}
            <div className="p-2">
              {Object.entries(groupedModels).map(([provider, models]) => (
                <div key={provider} className="mb-3">
                  {/* Provider Header */}
                  <div className="mb-2 flex items-center gap-2 px-2">
                    <span className={providerColors[provider as AIProvider]}>
                      {providerIcons[provider as AIProvider]}
                    </span>
                    <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      {provider}
                    </span>
                  </div>

                  {/* Compact Model List */}
                  <div className="space-y-1">
                    {models.map((model) => (
                      <div key={model.id} className="relative">
                        <button
                          onClick={() => {
                            onModelChange(model.id);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setHoveredModel(model.id)}
                          onMouseLeave={() => setHoveredModel(null)}
                          className={cn(
                            'group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all',
                            selectedModel === model.id
                              ? cn(
                                  'bg-opacity-20',
                                  providerBgColors[provider as AIProvider].split(' ')[0]
                                )
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}
                        >
                          {/* Left side - Name and specs */}
                          <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                selectedModel === model.id
                                  ? providerColors[provider as AIProvider]
                                  : 'text-gray-900 dark:text-white'
                              )}
                            >
                              {model.name}
                            </span>
                            <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-mono">
                                {formatContextSize(model.contextWindow)}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <span className="font-mono">
                                {formatContextSize(model.maxOutput)}
                              </span>
                            </span>
                          </div>

                          {/* Right side - Features and selection */}
                          <div className="flex shrink-0 items-center gap-2">
                            {model.supportsVision && (
                              <span className="text-[10px] text-purple-600 dark:text-purple-400">
                                Vision
                              </span>
                            )}
                            {model.supportsTools && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                Tools
                              </span>
                            )}
                            {selectedModel === model.id && (
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </button>

                        {/* Hover tooltip for description */}
                        {hoveredModel === model.id && model.description && (
                          <div
                            className={cn(
                              'absolute bottom-full left-0 z-[10000] mb-2 rounded-lg',
                              'hidden w-64 sm:block',
                              'border bg-white p-3 shadow-lg',
                              'border-gray-200 dark:border-gray-700 dark:bg-gray-800',
                              'pointer-events-none'
                            )}
                          >
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {model.description}
                            </p>
                          </div>
                        )}
                      </div>
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
