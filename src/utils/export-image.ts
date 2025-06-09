import type { Conversation, Message } from '@/types';

export class ChatImageExporter {
  private static readonly CARD_WIDTH = 800;
  private static readonly CARD_PADDING = 40;
  private static readonly LINE_HEIGHT = 24;
  private static readonly TITLE_SIZE = 28;
  private static readonly TEXT_SIZE = 16;
  private static readonly SMALL_TEXT_SIZE = 14;
  private static readonly MAX_MESSAGES = 5;
  private static readonly MAX_MESSAGE_LENGTH = 200;

  static async exportToImage(
    conversation: Conversation,
    messages: Message[],
    theme: 'light' | 'dark' = 'light'
  ): Promise<Blob> {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Calculate dimensions
    const summaryMessages = messages.slice(-this.MAX_MESSAGES);
    const contentHeight = this.calculateHeight(conversation, summaryMessages);

    canvas.width = this.CARD_WIDTH;
    canvas.height = contentHeight;

    // Set colors based on theme
    const colors =
      theme === 'dark'
        ? {
            background: '#1f2937',
            cardBg: '#111827',
            text: '#f3f4f6',
            subtext: '#9ca3af',
            border: '#374151',
            userBg: '#1e40af',
            assistantBg: '#059669',
            accent: '#3b82f6',
          }
        : {
            background: '#f9fafb',
            cardBg: '#ffffff',
            text: '#111827',
            subtext: '#6b7280',
            border: '#e5e7eb',
            userBg: '#dbeafe',
            assistantBg: '#d1fae5',
            accent: '#3b82f6',
          };

    // Fill background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw card background with rounded corners
    this.drawRoundedRect(ctx, 20, 20, canvas.width - 40, canvas.height - 40, 16, colors.cardBg);

    // Draw border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, 20, 20, canvas.width - 40, canvas.height - 40, 16);

    let y = this.CARD_PADDING + 20;

    // Draw header
    ctx.font = `bold ${this.TITLE_SIZE}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = colors.text;
    ctx.fillText(conversation.title, this.CARD_PADDING, y);
    y += this.TITLE_SIZE + 10;

    // Draw metadata
    ctx.font = `${this.SMALL_TEXT_SIZE}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = colors.subtext;
    const date = new Date(conversation.createdAt).toLocaleDateString();
    const messageCount = messages.length;
    ctx.fillText(
      `${date} • ${messageCount} messages • ${conversation.model}`,
      this.CARD_PADDING,
      y
    );
    y += this.LINE_HEIGHT + 20;

    // Draw separator
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.CARD_PADDING, y);
    ctx.lineTo(canvas.width - this.CARD_PADDING, y);
    ctx.stroke();
    y += 20;

    // Draw messages summary
    ctx.font = `${this.TEXT_SIZE}px system-ui, -apple-system, sans-serif`;

    summaryMessages.forEach((message) => {
      const isUser = message.role === 'user';
      const bgColor = isUser ? colors.userBg : colors.assistantBg;
      const textColor = theme === 'dark' ? colors.text : colors.text;

      // Draw message background
      const messageHeight = this.calculateMessageHeight(ctx, message.content);
      this.drawRoundedRect(
        ctx,
        this.CARD_PADDING,
        y,
        canvas.width - this.CARD_PADDING * 2,
        messageHeight + 20,
        8,
        bgColor
      );

      // Draw role label
      ctx.font = `bold ${this.SMALL_TEXT_SIZE}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = colors.accent;
      ctx.fillText(isUser ? 'You' : 'Assistant', this.CARD_PADDING + 15, y + 20);

      // Draw message content
      ctx.font = `${this.TEXT_SIZE}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = textColor;

      const truncatedContent = this.truncateText(message.content);
      const lines = this.wrapText(ctx, truncatedContent, canvas.width - this.CARD_PADDING * 2 - 30);

      lines.forEach((line, lineIndex) => {
        ctx.fillText(
          line,
          this.CARD_PADDING + 15,
          y + 20 + this.SMALL_TEXT_SIZE + 10 + lineIndex * this.LINE_HEIGHT
        );
      });

      y += messageHeight + 30;
    });

    // Draw footer
    y += 10;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.CARD_PADDING, y);
    ctx.lineTo(canvas.width - this.CARD_PADDING, y);
    ctx.stroke();
    y += 20;

    ctx.font = `${this.SMALL_TEXT_SIZE}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = colors.subtext;
    ctx.fillText('Generated with OmniChat', this.CARD_PADDING, y);

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor?: string
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  private static truncateText(text: string): string {
    if (text.length <= this.MAX_MESSAGE_LENGTH) return text;
    return text.substring(0, this.MAX_MESSAGE_LENGTH) + '...';
  }

  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private static calculateMessageHeight(ctx: CanvasRenderingContext2D, content: string): number {
    const truncated = this.truncateText(content);
    const lines = this.wrapText(ctx, truncated, this.CARD_WIDTH - this.CARD_PADDING * 2 - 30);
    return this.SMALL_TEXT_SIZE + 10 + lines.length * this.LINE_HEIGHT + 10;
  }

  private static calculateHeight(conversation: Conversation, messages: Message[]): number {
    // Base height for header, metadata, and footer
    let height = 200;

    // Create temporary canvas for text measurements
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return 800; // fallback

    tempCtx.font = `${this.TEXT_SIZE}px system-ui, -apple-system, sans-serif`;

    // Add height for each message
    messages.forEach((message) => {
      height += this.calculateMessageHeight(tempCtx, message.content) + 30;
    });

    return Math.min(height, 1200); // Max height cap
  }

  static downloadImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async copyImageToClipboard(blob: Blob): Promise<void> {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
    } catch {
      throw new Error('Failed to copy image to clipboard');
    }
  }
}
