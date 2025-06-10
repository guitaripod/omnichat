import type { Message } from '@/types';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRegenerateMessage?: (index: number) => void;
  onBranchSwitch?: (messageId: string) => void;
  onCreateBranch?: (fromMessageId: string) => void;
}

export function MessageList({
  messages,
  isLoading = false,
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
