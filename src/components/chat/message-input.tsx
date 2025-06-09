'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send, Paperclip, Square, ChevronDown, Sparkles, Brain, Zap } from 'lucide-react';
import { cn } from '@/utils';
import { AIProvider, AIModel, AI_MODELS } from '@/services/ai';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const providerIcons: Record<AIProvider, React.ReactNode> = {
  openai: <Sparkles className="h-3.5 w-3.5" />,
  anthropic: <Brain className="h-3.5 w-3.5" />,
  google: <Zap className="h-3.5 w-3.5" />,
};

const providerColors: Record<AIProvider, string> = {
  openai: 'text-green-600 dark:text-green-400',
  anthropic: 'text-orange-600 dark:text-orange-400',
  google: 'text-blue-600 dark:text-blue-400',
};

export function MessageInput({
  onSendMessage,
  isLoading,
  onStop,
  selectedModel,
  onModelChange,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
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

  // Get all models and find current model info
  const allModels = Object.values(AI_MODELS).flat();
  const currentModel = allModels.find((model) => model.id === selectedModel);

  // Group models by provider
  const groupedModels = allModels.reduce(
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
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-4xl">
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      • {Math.round(currentModel.contextWindow / 1000)}k context
                    </span>
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
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <div key={provider} className="mb-2 last:mb-0">
                        <div className="mb-1 flex items-center gap-2 px-2 py-1">
                          <span className={providerColors[provider as AIProvider]}>
                            {providerIcons[provider as AIProvider]}
                          </span>
                          <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                            {provider}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {models.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                onModelChange(model.id);
                                setIsModelSelectorOpen(false);
                              }}
                              className={cn(
                                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors',
                                selectedModel === model.id
                                  ? 'bg-gray-100 dark:bg-gray-700'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              )}
                            >
                              <span className="text-sm text-gray-900 dark:text-white">
                                {model.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.round(model.contextWindow / 1000)}k
                                </span>
                                {model.supportsVision && (
                                  <span className="text-xs text-purple-600 dark:text-purple-400">
                                    Vision
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Input Area */}
            <div className="flex items-end gap-2 p-3">
              <button
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
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
                  placeholder="Type your message..."
                  className="w-full resize-none bg-transparent px-2 py-1 text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
                  rows={1}
                  style={{
                    minHeight: '24px',
                    maxHeight: '150px',
                  }}
                />
              </div>

              <button
                onClick={isLoading ? onStop : handleSubmit}
                disabled={!isLoading && !message.trim()}
                className={cn(
                  'rounded-lg p-2 transition-all duration-200',
                  isLoading
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                )}
                aria-label={isLoading ? 'Stop generation' : 'Send message'}
              >
                {isLoading ? <Square size={20} className="fill-current" /> : <Send size={20} />}
              </button>
            </div>
          </div>

          <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
