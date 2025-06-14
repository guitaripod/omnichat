'use client';

import { useEffect, useState } from 'react';
import type { Message } from '@/types';
import { MessageList } from './message-list';

interface SafeMessageListProps {
  messages: Message[];
  isLoading?: boolean;
  currentModel?: string;
  imageGenerationOptions?: {
    size?: string;
    quality?: string;
    style?: string;
    n?: number;
    background?: string;
    outputFormat?: string;
    outputCompression?: number;
  };
  onRegenerateMessage?: (index: number) => void;
  onBranchSwitch?: (messageId: string) => void;
  onCreateBranch?: (fromMessageId: string) => void;
}

// Ensure all message fields have valid values
function sanitizeMessage(message: any): Message {
  return {
    id: message?.id || 'unknown',
    conversationId: message?.conversationId || 'unknown',
    role: message?.role || 'user',
    content: message?.content || '',
    model: message?.model || undefined,
    parentId: message?.parentId || undefined,
    createdAt: message?.createdAt ? new Date(message.createdAt) : new Date(),
    attachments: Array.isArray(message?.attachments) ? message.attachments : [],
  };
}

export function SafeMessageList(props: SafeMessageListProps) {
  const [mounted, setMounted] = useState(false);
  const [safeMessages, setSafeMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Sanitize messages to ensure they have all required fields
    const sanitized = props.messages?.map(sanitizeMessage) || [];
    setSafeMessages(sanitized);
  }, [props.messages]);

  // Don't render until client-side to avoid hydration issues
  if (!mounted) {
    return null; // Return nothing to prevent flash
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <MessageList {...props} messages={safeMessages} />
    </div>
  );
}
