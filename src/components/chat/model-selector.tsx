'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Brain,
  Zap,
  Check,
  Server,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils';
import { AIProvider, AIModel } from '@/services/ai';
import { useModels } from '@/hooks/use-models';

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
  xai: <Sparkles className="h-4 w-4" />,
};

const providerColors: Record<AIProvider, string> = {
  openai: 'text-green-600 dark:text-green-400',
  anthropic: 'text-orange-600 dark:text-orange-400',
  google: 'text-blue-600 dark:text-blue-400',
  ollama: 'text-purple-600 dark:text-purple-400',
  xai: 'text-indigo-600 dark:text-indigo-400',
};

const providerBgColors: Record<AIProvider, string> = {
  openai: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  anthropic: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
  google: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
  ollama: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
  xai: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800',
};

const formatContextSize = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  return `${Math.round(tokens / 1000)}k`;
};

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModelInfo, setSelectedModelInfo] = useState<AIModel | undefined>();
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<AIProvider>>(new Set());
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>('http://localhost:11434');
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);

  // Use the models hook
  const { models: fetchedModels, isLoading, error, refetch } = useModels();
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  // Load Ollama URL from localStorage after mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        if (parsed.ollama) {
          setOllamaBaseUrl(parsed.ollama);
          // Check if Ollama is available
          fetch(`${parsed.ollama}/api/tags`)
            .then((res) => res.ok && setIsOllamaAvailable(true))
            .catch(() => setIsOllamaAvailable(false));
        }
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }
  }, []);

  // Combine fetched models with Ollama models
  useEffect(() => {
    const allModels = Object.values(fetchedModels).flat();
    setAvailableModels(allModels);

    // Auto-expand provider of selected model
    const selectedModelProvider = allModels.find((m) => m.id === selectedModel)?.provider;
    if (selectedModelProvider) {
      setExpandedProviders(new Set([selectedModelProvider]));
    }
  }, [fetchedModels, selectedModel]);

  // Load Ollama models when URL is available
  useEffect(() => {
    if (!ollamaBaseUrl) return;

    const loadOllamaModels = async () => {
      try {
        const response = await fetch(`${ollamaBaseUrl}/api/tags`);
        if (response.ok) {
          const data = (await response.json()) as { models?: { name: string }[] };
          const ollamaModelNames = data.models?.map((m: { name: string }) => m.name) || [];

          // Convert to AIModel format
          const ollamaModels: AIModel[] = ollamaModelNames.map((name: string) => ({
            id: `ollama/${name}`,
            name: name,
            provider: 'ollama' as AIProvider,
            contextWindow: 4096,
            maxOutput: 4096,
            supportsVision: false,
            supportsTools: false,
            supportsWebSearch: false,
            description: `Local Ollama model: ${name}`,
          }));

          // Add Ollama models to existing models
          setAvailableModels((prev) => {
            const nonOllamaModels = prev.filter((m) => m.provider !== 'ollama');
            return [...nonOllamaModels, ...ollamaModels];
          });
        }
      } catch {
        // Silently fail - Ollama might not be running
      }
    };

    // Try to load immediately
    loadOllamaModels();
  }, [ollamaBaseUrl]); // Only depend on URL, not availability status

  useEffect(() => {
    // Set selected model info
    const modelInfo = availableModels.find((model) => model.id === selectedModel);
    setSelectedModelInfo(modelInfo);
  }, [selectedModel, availableModels]);

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

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading models...</span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="m-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <p>Failed to load models: {error}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-xs underline hover:text-red-600"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Models List */}
            {!isLoading && !error && (
              <div className="p-2">
                {Object.entries(groupedModels).map(([provider, models]) => (
                  <div key={provider} className="mb-3">
                    {/* Provider Header - Now Clickable */}
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedProviders);
                        if (newExpanded.has(provider as AIProvider)) {
                          newExpanded.delete(provider as AIProvider);
                        } else {
                          newExpanded.add(provider as AIProvider);
                        }
                        setExpandedProviders(newExpanded);
                      }}
                      className="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ChevronRight
                        className={cn(
                          'h-3 w-3 text-gray-400 transition-transform',
                          expandedProviders.has(provider as AIProvider) && 'rotate-90'
                        )}
                      />
                      <span className={providerColors[provider as AIProvider]}>
                        {providerIcons[provider as AIProvider]}
                      </span>
                      <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        {provider}
                      </span>
                      <span className="text-xs text-gray-400">({models.length})</span>
                      {provider === 'ollama' && (
                        <span className="ml-auto flex items-center gap-1">
                          {isOllamaAvailable ? (
                            <>
                              <Wifi className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-500">Connected</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-500">Not available</span>
                            </>
                          )}
                        </span>
                      )}
                    </button>

                    {/* Compact Model List - Collapsible */}
                    {expandedProviders.has(provider as AIProvider) && (
                      <div className="space-y-1 pl-6">
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
                                {model.supportsWebSearch && (
                                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
                                    Search
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
                    )}
                  </div>
                ))}

                {/* Show Ollama loading state if needed */}
                {!isLoading && !groupedModels.ollama && ollamaBaseUrl && isOllamaAvailable && (
                  <div className="mb-3 px-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading Ollama models...</span>
                    </div>
                  </div>
                )}

                {/* Ollama Help Text */}
                {!isOllamaAvailable && ollamaBaseUrl && (
                  <div className="mx-2 mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    <p className="mb-1 font-medium">Ollama not connected</p>
                    <p className="mb-2">To use local AI models:</p>
                    <ol className="ml-3 list-decimal space-y-0.5">
                      <li>
                        Install Ollama from{' '}
                        <a
                          href="https://ollama.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          ollama.com
                        </a>
                      </li>
                      <li>
                        Run:{' '}
                        <code className="rounded bg-amber-100 px-1 dark:bg-amber-800">
                          OLLAMA_ORIGINS="*" ollama serve
                        </code>
                      </li>
                      <li>
                        Pull a model:{' '}
                        <code className="rounded bg-amber-100 px-1 dark:bg-amber-800">
                          ollama pull llama3.2
                        </code>
                      </li>
                    </ol>
                    <p className="mt-2">
                      <a
                        href="/profile"
                        className="underline hover:text-amber-600 dark:hover:text-amber-300"
                      >
                        Configure in Settings →
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
