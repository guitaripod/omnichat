import type { Message } from '@/types';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRegenerateMessage?: (index: number) => void;
}

export function MessageList({
  messages,
  isLoading = false,
  onRegenerateMessage,
}: MessageListProps) {
  return (
    <div className="flex flex-col">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
          canRegenerate={
            index === messages.length - 1 && message.role === 'assistant' && !isLoading
          }
          onRegenerate={() => onRegenerateMessage?.(index)}
        />
      ))}
    </div>
  );
}
