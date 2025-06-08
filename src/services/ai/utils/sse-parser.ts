export interface SSEMessage {
  id?: string;
  event?: string;
  data?: string;
  retry?: number;
}

export class SSEParser {
  private buffer = '';

  parse(chunk: string): SSEMessage[] {
    this.buffer += chunk;
    const messages: SSEMessage[] = [];
    const lines = this.buffer.split('\n');

    let i = 0;
    while (i < lines.length - 1) {
      const line = lines[i];
      const nextLine = lines[i + 1];

      if (line === '' && nextLine !== undefined) {
        const message = this.parseMessage(lines.slice(0, i));
        if (message.data !== undefined) {
          messages.push(message);
        }
        lines.splice(0, i + 1);
        i = 0;
        continue;
      }
      i++;
    }

    this.buffer = lines.join('\n');
    return messages;
  }

  private parseMessage(lines: string[]): SSEMessage {
    const message: SSEMessage = {};

    for (const line of lines) {
      if (line.startsWith('id:')) {
        message.id = line.slice(3).trim();
      } else if (line.startsWith('event:')) {
        message.event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        message.data = message.data ? `${message.data}\n${data}` : data;
      } else if (line.startsWith('retry:')) {
        message.retry = parseInt(line.slice(6).trim(), 10);
      }
    }

    return message;
  }

  reset() {
    this.buffer = '';
  }
}

export function createSSEStream(
  response: Response,
  onMessage: (data: string) => string | null
): ReadableStream<Uint8Array> {
  const reader = response.body?.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const parser = new SSEParser();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const messages = parser.parse(chunk);

          for (const message of messages) {
            if (message.data === '[DONE]') {
              controller.close();
              return;
            }

            if (message.data) {
              const content = onMessage(message.data);
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
