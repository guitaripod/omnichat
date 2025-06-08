import { User, Sparkles, Brain, Zap } from 'lucide-react';
import type { Message } from '@/types';
import { cn } from '@/utils';
import { AI_MODELS } from '@/services/ai';

interface MessageItemProps {
  message: Message;
}

// Provider icons and colors
const providerIcons = {
  openai: Sparkles,
  anthropic: Brain,
  google: Zap,
};

const providerColors = {
  openai: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
  },
  anthropic: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  google: {
    bg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

function getProviderFromModel(modelId?: string) {
  if (!modelId) return null;

  const allModels = Object.values(AI_MODELS).flat();
  const model = allModels.find((m) => m.id === modelId);
  return model?.provider || null;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const provider = !isUser ? getProviderFromModel(message.model) : null;
  const providerColor = provider ? providerColors[provider] : null;
  const ProviderIcon = provider ? providerIcons[provider] : null;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start', 'px-4 py-3')}>
      <div className={cn('flex max-w-[80%] gap-3 lg:max-w-[70%]', isUser && 'flex-row-reverse')}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm',
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : providerColor?.iconBg || 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            {isUser ? (
              <User size={20} className="text-white" />
            ) : ProviderIcon ? (
              <ProviderIcon size={20} className={providerColor?.icon} />
            ) : (
              <Sparkles size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={cn('group relative overflow-hidden rounded-2xl', isUser && 'order-first')}>
          {/* Glassmorphic background */}
          <div
            className={cn(
              'absolute inset-0',
              isUser
                ? 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-700/20'
                : providerColor?.bg || 'bg-gray-100/50 dark:bg-gray-800/50',
              'backdrop-blur-sm'
            )}
          />

          {/* Border gradient */}
          <div
            className={cn(
              'absolute inset-0 rounded-2xl',
              'bg-gradient-to-br',
              isUser
                ? 'from-blue-500/20 to-indigo-600/20'
                : provider === 'openai'
                  ? 'from-green-500/20 to-emerald-600/20'
                  : provider === 'anthropic'
                    ? 'from-orange-500/20 to-amber-600/20'
                    : provider === 'google'
                      ? 'from-blue-500/20 to-sky-600/20'
                      : 'from-gray-500/10 to-gray-600/10'
            )}
            style={{ padding: '1px' }}
          >
            <div
              className={cn(
                'h-full w-full rounded-2xl',
                isUser ? 'bg-white/90 dark:bg-gray-950/90' : 'bg-white/80 dark:bg-gray-900/80'
              )}
            />
          </div>

          {/* Content */}
          <div className="relative px-4 py-3">
            {/* Timestamp and model info */}
            <div
              className={cn(
                'mb-1 flex items-center gap-2 text-xs',
                isUser ? 'justify-end' : 'justify-start'
              )}
            >
              {!isUser && message.model && (
                <span className="text-gray-500 dark:text-gray-400">
                  {AI_MODELS[provider || 'openai']?.find((m) => m.id === message.model)?.name ||
                    message.model}
                </span>
              )}
              <span className="text-gray-400 dark:text-gray-500">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Message text */}
            <div
              className={cn(
                'prose prose-sm max-w-none',
                isUser ? 'prose-blue dark:prose-invert' : 'prose-gray dark:prose-invert'
              )}
            >
              <p
                className={cn(
                  'text-sm leading-relaxed whitespace-pre-wrap',
                  isUser ? 'text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200'
                )}
              >
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
