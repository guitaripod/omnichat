'use client';

import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Square,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Brain,
  Zap,
  Server,
  GitBranch,
  Globe,
  Fish,
  Image,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIProvider, AIModel, AI_MODELS } from '@/services/ai';
import { FileUpload, FileAttachmentDisplay } from './file-upload';
import { FileAttachment } from '@/types/attachments';

interface MessageInputProps {
  onSendMessage: (message: string, attachments?: FileAttachment[], webSearch?: boolean) => void;
  isLoading: boolean;
  onStop?: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  conversationId: string;
  onToggleBranches?: () => void;
  showBranches?: boolean;
}

const providerIcons: Record<AIProvider, React.ReactNode> = {
  openai: <Sparkles className="h-3.5 w-3.5" />,
  anthropic: <Brain className="h-3.5 w-3.5" />,
  google: <Zap className="h-3.5 w-3.5" />,
  ollama: <Server className="h-3.5 w-3.5" />,
  xai: <Sparkles className="h-3.5 w-3.5" />,
  deepseek: <Fish className="h-3.5 w-3.5" />,
};

const providerColors: Record<AIProvider, string> = {
  openai: 'text-green-600 dark:text-green-400',
  anthropic: 'text-orange-600 dark:text-orange-400',
  google: 'text-blue-600 dark:text-blue-400',
  ollama: 'text-purple-600 dark:text-purple-400',
  xai: 'text-indigo-600 dark:text-indigo-400',
  deepseek: 'text-cyan-600 dark:text-cyan-400',
};

export function MessageInput({
  onSendMessage,
  isLoading,
  onStop,
  selectedModel,
  onModelChange,
  conversationId,
  onToggleBranches,
  showBranches,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<AIProvider>>(new Set());
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if ((message.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(
        message.trim(),
        attachments.length > 0 ? attachments : undefined,
        webSearchEnabled
      );
      setMessage('');
      setAttachments([]);
      setShowFileUpload(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
    };

    if (isModelSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelSelectorOpen]);

  // State for dynamically loaded models
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>('http://localhost:11434');
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);

  // Load Ollama URL from localStorage after mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        if (parsed.ollama) {
          setOllamaBaseUrl(parsed.ollama);
        }
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }
  }, []);

  // Load static models immediately
  useEffect(() => {
    const staticModels = Object.entries(AI_MODELS)
      .filter(([provider]) => provider !== 'ollama')
      .flatMap(([_, models]) => models);
    setAvailableModels(staticModels);
  }, []);

  // Load Ollama models when URL is available
  useEffect(() => {
    if (!ollamaBaseUrl) return;

    const loadOllamaModels = async () => {
      try {
        console.log('MessageInput: Loading Ollama models from:', ollamaBaseUrl);
        const response = await fetch(`${ollamaBaseUrl}/api/tags`);
        if (response.ok) {
          setIsOllamaAvailable(true);
          const data = (await response.json()) as { models?: { name: string }[] };
          const ollamaModelNames = data.models?.map((m: { name: string }) => m.name) || [];
          console.log('MessageInput: Found Ollama models:', ollamaModelNames);

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
        } else {
          setIsOllamaAvailable(false);
        }
      } catch (error) {
        console.error('MessageInput: Failed to load Ollama models:', error);
        setIsOllamaAvailable(false);
      }
    };

    // Try to load immediately
    loadOllamaModels();
  }, [ollamaBaseUrl]);

  // Get current model info
  const currentModel = availableModels.find((model) => model.id === selectedModel);

  // Group models by provider
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
    <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-5xl">
        <div className="relative">
          {/* Integrated Input Box */}
          <div
            ref={modelSelectorRef}
            className={cn(
              'rounded-xl border bg-gray-50 transition-all duration-200 dark:bg-gray-700/50',
              isFocused
                ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400 dark:ring-blue-400/20'
                : 'border-gray-200 dark:border-gray-600'
            )}
          >
            {/* Model Selector Header */}
            <button
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2.5 transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-700/70',
                'border-b border-gray-200 dark:border-gray-600',
                isModelSelectorOpen && 'bg-gray-100 dark:bg-gray-700/70'
              )}
            >
              <div className="flex items-center gap-2">
                {currentModel && (
                  <>
                    <span
                      className={cn(
                        'transition-transform duration-200',
                        providerColors[currentModel.provider]
                      )}
                    >
                      {providerIcons[currentModel.provider]}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentModel.name}
                    </span>
                    {currentModel.supportsImageGeneration ? (
                      <span className="text-xs text-pink-600 dark:text-pink-400">• Image Gen</span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {Math.round(currentModel.contextWindow / 1000)}k context
                      </span>
                    )}
                  </>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-500 transition-transform duration-200',
                  isModelSelectorOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Model Selector Dropdown */}
            <div
              className={cn(
                'grid transition-all duration-200 ease-in-out',
                isModelSelectorOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div className="border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
                  <div className="relative max-h-[500px] overflow-y-auto p-2">
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <div key={provider} className="mb-2 last:mb-0">
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
                          className="mb-1 flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                          <ChevronRight
                            className={cn(
                              'h-3 w-3 text-gray-400 transition-transform duration-300',
                              expandedProviders.has(provider as AIProvider) && 'rotate-90'
                            )}
                          />
                          <span className={providerColors[provider as AIProvider]}>
                            {providerIcons[provider as AIProvider]}
                          </span>
                          <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                            {provider}
                          </span>
                          <span className="text-xs text-gray-400">({models.length})</span>
                        </button>
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-in-out',
                            expandedProviders.has(provider as AIProvider)
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'grid-rows-[0fr] opacity-0'
                          )}
                        >
                          <div className="overflow-hidden transition-opacity duration-300">
                            <div className="space-y-0.5 pb-1 pl-6">
                              {models.map((model) => (
                                <div key={model.id} className="group relative">
                                  <button
                                    onClick={() => {
                                      onModelChange(model.id);
                                      setIsModelSelectorOpen(false);
                                    }}
                                    onMouseEnter={() => setHoveredModel(model.id)}
                                    onMouseLeave={() => setHoveredModel(null)}
                                    className={cn(
                                      'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-all duration-150',
                                      selectedModel === model.id
                                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                                        : hoveredModel === model.id
                                          ? 'bg-gray-100 dark:bg-gray-700/70'
                                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span
                                        className={cn(
                                          'text-sm transition-colors',
                                          selectedModel === model.id
                                            ? 'font-medium'
                                            : 'text-gray-900 dark:text-white'
                                        )}
                                      >
                                        {model.name}
                                      </span>
                                      <span
                                        className={cn(
                                          'truncate text-xs text-gray-500 transition-all duration-200 dark:text-gray-400',
                                          hoveredModel === model.id && model.description
                                            ? 'max-w-xs opacity-100'
                                            : 'max-w-0 opacity-0'
                                        )}
                                      >
                                        {model.description && `• ${model.description}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {model.supportsImageGeneration ? (
                                        <span
                                          className={cn(
                                            'text-xs',
                                            selectedModel === model.id
                                              ? 'text-blue-700 dark:text-blue-300'
                                              : 'text-pink-600 dark:text-pink-400'
                                          )}
                                        >
                                          Image Gen
                                        </span>
                                      ) : (
                                        <>
                                          <span
                                            className={cn(
                                              'text-xs',
                                              selectedModel === model.id
                                                ? 'text-blue-700 dark:text-blue-300'
                                                : 'text-gray-500 dark:text-gray-400'
                                            )}
                                          >
                                            {Math.round(model.contextWindow / 1000)}k
                                          </span>
                                          {model.supportsVision && (
                                            <span
                                              className={cn(
                                                'text-xs',
                                                selectedModel === model.id
                                                  ? 'text-blue-700 dark:text-blue-300'
                                                  : 'text-purple-600 dark:text-purple-400'
                                              )}
                                            >
                                              Vision
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show Ollama section if configured but no models loaded */}
                    {!groupedModels.ollama && ollamaBaseUrl && (
                      <div className="mb-2 last:mb-0">
                        <div className="mb-1 flex items-center gap-2 px-2 py-1">
                          <span className={providerColors.ollama}>{providerIcons.ollama}</span>
                          <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                            ollama
                          </span>
                          <span className="ml-auto text-xs text-yellow-500">
                            {isOllamaAvailable ? 'Loading models...' : 'Not connected'}
                          </span>
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
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            {showFileUpload && (
              <div className="border-b border-gray-200 p-4 dark:border-gray-600">
                <FileUpload
                  conversationId={conversationId}
                  messageId={`temp-${Date.now()}`}
                  onUploadComplete={(attachment) => {
                    setAttachments([...attachments, attachment]);
                    setUploadError(null);
                  }}
                  onError={(error) => {
                    setUploadError(error);
                  }}
                />
                {uploadError && (
                  <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {uploadError}
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Attached files:
                    </p>
                    {attachments.map((attachment, index) => (
                      <FileAttachmentDisplay
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() => {
                          setAttachments(attachments.filter((_, i) => i !== index));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message Input Area */}
            <div className="flex items-end gap-2 p-3">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={cn(
                  'rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                  showFileUpload && 'bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400'
                )}
                aria-label="Attach file"
              >
                <Paperclip size={20} />
              </button>

              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={
                    currentModel?.supportsImageGeneration
                      ? 'Describe the image you want to create...'
                      : 'Type your message...'
                  }
                  className="w-full resize-none bg-transparent px-2 py-1 text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
                  rows={1}
                  style={{
                    minHeight: '24px',
                    maxHeight: '150px',
                  }}
                />
              </div>

              {currentModel?.supportsWebSearch && (
                <button
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={cn(
                    'rounded-lg p-2 transition-all duration-200',
                    webSearchEnabled
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  )}
                  aria-label="Toggle web search"
                  title={webSearchEnabled ? 'Web search enabled' : 'Enable web search'}
                >
                  <Globe size={20} />
                </button>
              )}

              {onToggleBranches && (
                <button
                  onClick={onToggleBranches}
                  className={cn(
                    'rounded-lg p-2 transition-all duration-200',
                    showBranches
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  )}
                  aria-label="Toggle branches"
                >
                  <GitBranch size={20} />
                </button>
              )}

              <button
                onClick={isLoading ? onStop : handleSubmit}
                disabled={!isLoading && !message.trim() && attachments.length === 0}
                className={cn(
                  'rounded-lg p-2 transition-all duration-200',
                  isLoading
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : currentModel?.supportsImageGeneration
                      ? 'text-pink-600 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-pink-400 dark:hover:bg-pink-900/20'
                      : 'text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                )}
                aria-label={
                  isLoading
                    ? 'Stop generation'
                    : currentModel?.supportsImageGeneration
                      ? 'Generate image'
                      : 'Send message'
                }
              >
                {isLoading ? (
                  <Square size={20} className="fill-current" />
                ) : currentModel?.supportsImageGeneration ? (
                  <Palette size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>

          <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            {currentModel?.supportsImageGeneration ? (
              <span className="flex items-center justify-center gap-1">
                <Image className="h-3 w-3 text-pink-500" />
                Press Enter to generate image
              </span>
            ) : (
              'Press Enter to send, Shift+Enter for new line'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
