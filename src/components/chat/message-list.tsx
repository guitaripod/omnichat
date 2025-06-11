import type { Message } from '@/types';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  currentModel?: string;
  onRegenerateMessage?: (index: number) => void;
  onBranchSwitch?: (messageId: string) => void;
  onCreateBranch?: (fromMessageId: string) => void;
}

export function MessageList({
  messages,
  isLoading = false,
  currentModel,
  onRegenerateMessage,
  onBranchSwitch,
  onCreateBranch,
}: MessageListProps) {
  return (
    <div className="flex flex-col">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          messages={messages}
          isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
          isImageGeneration={
            isLoading &&
            index === messages.length - 1 &&
            message.role === 'assistant' &&
            ['gpt-image-1', 'dall-e-3', 'dall-e-2'].includes(currentModel || '')
          }
          canRegenerate={
            index === messages.length - 1 && message.role === 'assistant' && !isLoading
          }
          onRegenerate={() => onRegenerateMessage?.(index)}
          onBranchSwitch={onBranchSwitch}
          onCreateBranch={onCreateBranch}
        />
      ))}
    </div>
  );
}
