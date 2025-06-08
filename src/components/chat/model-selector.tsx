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
              'absolute right-0 left-0 z-20 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg',
              'dark:border-gray-700 dark:bg-gray-800'
            )}
          >
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider}>
                <div className="sticky top-0 flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
                  <span className={providerColors[provider as AIProvider]}>
                    {providerIcons[provider as AIProvider]}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
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
                      'flex w-full flex-col items-start gap-1 px-4 py-3 text-left',
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      'transition-colors',
                      selectedModel === model.id && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
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
                    {model.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {model.description}
                      </span>
                    )}
                    <div className="mt-1 flex gap-4 text-xs text-gray-400 dark:text-gray-500">
                      <span>Context: {(model.contextWindow / 1000).toFixed(0)}k</span>
                      <span>Max output: {(model.maxOutput / 1000).toFixed(0)}k</span>
                      {model.supportsVision && <span>Vision</span>}
                      {model.supportsTools && <span>Tools</span>}
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
