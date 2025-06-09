import type { Message } from '@/types';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  return (
    <div className="flex flex-col">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
        />
      ))}
    </div>
  );
}
