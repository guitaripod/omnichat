'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, Brain, Zap } from 'lucide-react';
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
  openai: 'bg-green-50 dark:bg-green-900/10',
  anthropic: 'bg-orange-50 dark:bg-orange-900/10',
  google: 'bg-blue-50 dark:bg-blue-900/10',
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
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute right-0 left-0 z-20 mt-2 max-h-[600px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl',
              'dark:border-gray-700 dark:bg-gray-800',
              'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600'
            )}
          >
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider}>
                <div
                  className={cn(
                    'sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-2',
                    'bg-gray-50/95 backdrop-blur-sm dark:bg-gray-900/95',
                    'border-gray-200 dark:border-gray-700'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded',
                      providerBgColors[provider as AIProvider]
                    )}
                  >
                    <span className={providerColors[provider as AIProvider]}>
                      {providerIcons[provider as AIProvider]}
                    </span>
                  </span>
                  <span className="text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    {provider}
                  </span>
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'group relative flex w-full items-start gap-3 px-4 py-3 text-left',
                      'hover:bg-gray-50 dark:hover:bg-gray-700/30',
                      'transition-colors duration-150',
                      selectedModel === model.id && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    {/* Selection indicator */}
                    {selectedModel === model.id && (
                      <div className="absolute top-0 left-0 h-full w-1 bg-blue-500" />
                    )}

                    {/* Model info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'font-medium',
                            selectedModel === model.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-900 dark:text-white'
                          )}
                        >
                          {model.name}
                        </span>
                        {/* Context and output inline */}
                        <span className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="font-mono">
                              {formatContextSize(model.contextWindow)}
                            </span>
                            <span className="text-gray-400">context</span>
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="flex items-center gap-1">
                            <span className="font-mono">{formatContextSize(model.maxOutput)}</span>
                            <span className="text-gray-400">output</span>
                          </span>
                        </span>
                      </div>

                      {model.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {model.description}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {model.supportsVision && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          Vision
                        </span>
                      )}
                      {model.supportsTools && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Tools
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
