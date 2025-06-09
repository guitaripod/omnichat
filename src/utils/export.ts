import type { Conversation, Message } from '@/types';

export interface ExportData {
  conversation: Conversation;
  messages: Message[];
  exportedAt: Date;
  version: string;
}

export class ChatExporter {
  static exportToJSON(conversation: Conversation, messages: Message[]): string {
    const exportData: ExportData = {
      conversation: {
        ...conversation,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt,
      })),
      exportedAt: new Date(),
      version: '1.0.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportToMarkdown(conversation: Conversation, messages: Message[]): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${conversation.title}`);
    lines.push('');
    lines.push(`**Model:** ${conversation.model}`);
    lines.push(`**Created:** ${new Date(conversation.createdAt).toLocaleString()}`);
    lines.push(`**Last Updated:** ${new Date(conversation.updatedAt).toLocaleString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Messages
    messages.forEach((message, index) => {
      const timestamp = new Date(message.createdAt).toLocaleString();

      if (message.role === 'user') {
        lines.push(`## User (${timestamp})`);
        lines.push('');
        lines.push(message.content);
        lines.push('');
      } else if (message.role === 'assistant') {
        lines.push(`## Assistant (${timestamp})`);
        if (message.model) {
          lines.push(`*Model: ${message.model}*`);
        }
        lines.push('');
        lines.push(message.content);
        lines.push('');
      } else if (message.role === 'system') {
        lines.push(`## System (${timestamp})`);
        lines.push('');
        lines.push(`*${message.content}*`);
        lines.push('');
      }

      // Add separator between messages (except last)
      if (index < messages.length - 1) {
        lines.push('---');
        lines.push('');
      }
    });

    // Footer
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*Exported from OmniChat on ${new Date().toLocaleString()}*`);

    return lines.join('\n');
  }

  static downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static generateFilename(conversation: Conversation, format: 'json' | 'md'): string {
    const date = new Date().toISOString().split('T')[0];
    const safeTitle = conversation.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
    return `omnichat_${safeTitle}_${date}.${format}`;
  }
}
