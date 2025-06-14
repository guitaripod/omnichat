import { User, Sparkles, Brain, Zap, Server, Copy, Check, RefreshCw, Fish } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/types';
import { cn } from '@/utils';
import { AI_MODELS } from '@/services/ai';
import { MarkdownRenderer } from './markdown-renderer';
import { StreamingIndicator } from './streaming-indicator';
import { AttachmentPreview } from './attachment-preview';
import { BranchSelector } from './branch-selector';
import { ImageGenerationLoading } from './image-generation-loading';
import { useUser } from '@clerk/nextjs';

interface MessageItemProps {
  message: Message;
  messages: Message[];
  isStreaming?: boolean;
  isImageGeneration?: boolean;
  imageGenerationOptions?: {
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
    background?: string;
    outputFormat?: string;
    outputCompression?: number;
  };
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  onBranchSwitch?: (messageId: string) => void;
  onCreateBranch?: (fromMessageId: string) => void;
}

// Provider icons and colors
const providerIcons = {
  openai: Sparkles,
  anthropic: Brain,
  google: Zap,
  ollama: Server,
  xai: Sparkles,
  deepseek: Fish,
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
  ollama: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  xai: {
    bg: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  deepseek: {
    bg: 'bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
};

function getProviderFromModel(modelId?: string) {
  if (!modelId) return null;

  const allModels = Object.values(AI_MODELS).flat();
  const model = allModels.find((m) => m.id === modelId);
  return model?.provider || null;
}

export function MessageItem({
  message,
  messages,
  isStreaming = false,
  isImageGeneration = false,
  imageGenerationOptions,
  onRegenerate,
  canRegenerate = false,
  onBranchSwitch,
  onCreateBranch,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useUser();
  const isUser = message.role === 'user';
  const provider = !isUser ? getProviderFromModel(message.model) : null;
  const providerColor = provider ? providerColors[provider] : null;
  const ProviderIcon = provider ? providerIcons[provider] : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start',
        'mx-auto w-full max-w-5xl px-4 py-2'
      )}
    >
      <div className={cn('flex max-w-[85%] gap-3', isUser && 'flex-row-reverse')}>
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
              user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="You"
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )
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
            {/* Timestamp, model info, and branch selector */}
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
              {/* Branch selector for assistant messages */}
              {!isUser && onBranchSwitch && onCreateBranch && (
                <BranchSelector
                  message={message}
                  messages={messages}
                  onBranchSwitch={onBranchSwitch}
                  onCreateBranch={() => onCreateBranch(message.id)}
                />
              )}
            </div>

            {/* Message text */}
            <div
              className={cn(
                'text-sm leading-relaxed',
                isUser ? 'text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200'
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <>
                  {isImageGeneration &&
                  (!message.content ||
                    (isStreaming && !message.content.includes('![Generated Image]'))) ? (
                    <ImageGenerationLoading size={imageGenerationOptions?.size} />
                  ) : (
                    <>
                      {message.content && <MarkdownRenderer content={message.content} />}
                      {isStreaming && !message.content && !isImageGeneration && (
                        <StreamingIndicator className="mt-2" />
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment) => (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}

            {/* Message Actions */}
            {!isStreaming && message.content && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  title="Copy message"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
                {!isUser && canRegenerate && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    title="Regenerate response"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
