// Token counting utilities for accurate usage tracking

export interface TokenCount {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// More accurate token estimation based on common patterns
// These are approximations but much better than character/4
export function estimateTokens(text: string, model: string): number {
  if (!text) return 0;

  // Different models have different tokenization
  // GPT models typically use ~1 token per 4 characters
  // Claude models use ~1 token per 3.5 characters
  // But this varies significantly based on content

  let multiplier = 0.25; // Default for GPT models

  if (model.includes('claude')) {
    multiplier = 0.285; // ~1 token per 3.5 chars
  } else if (model.includes('gemini')) {
    multiplier = 0.27; // Similar to GPT
  } else if (model.includes('deepseek')) {
    multiplier = 0.26;
  }

  // Count actual characters (not length which counts code points incorrectly)
  const charCount = [...text].length;

  // Base calculation
  let tokens = Math.ceil(charCount * multiplier);

  // Adjust for common patterns that use more tokens
  // Numbers typically use more tokens
  const numbers = text.match(/\d+/g) || [];
  tokens += numbers.length * 0.5;

  // URLs and email addresses use more tokens
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  tokens += urls.length * 3;

  // Code blocks often use more tokens due to special characters
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  codeBlocks.forEach((block) => {
    tokens += block.length * 0.1; // Add 10% more for code
  });

  // Special characters and punctuation
  const specialChars = text.match(/[^\w\s]/g) || [];
  tokens += specialChars.length * 0.2;

  return Math.ceil(tokens);
}

// Estimate tokens for a full conversation
export function estimateConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string
): number {
  let totalTokens = 0;

  messages.forEach((message) => {
    // Role tokens (system, user, assistant each take ~1 token)
    totalTokens += 1;

    // Message content tokens
    totalTokens += estimateTokens(message.content, model);

    // Separator tokens between messages (~2 tokens)
    totalTokens += 2;
  });

  // Model-specific overhead
  if (model.includes('gpt-4')) {
    totalTokens += 7; // GPT-4 has more overhead
  } else {
    totalTokens += 4; // Base overhead
  }

  return totalTokens;
}

// Track token usage during streaming
export class StreamingTokenTracker {
  private inputTokens: number = 0;
  private outputTokens: number = 0;
  private model: string;
  private chunks: string[] = [];

  constructor(messages: Array<{ role: string; content: string }>, model: string) {
    this.model = model;
    // Calculate input tokens from the conversation
    this.inputTokens = estimateConversationTokens(messages, model);
  }

  addChunk(chunk: string): void {
    this.chunks.push(chunk);
  }

  getTokenCount(): TokenCount {
    // Calculate output tokens from accumulated chunks
    const fullOutput = this.chunks.join('');
    this.outputTokens = estimateTokens(fullOutput, this.model);

    return {
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
    };
  }

  // Get current usage for real-time updates
  getCurrentUsage(): TokenCount {
    const currentOutput = this.chunks.join('');
    const currentOutputTokens = estimateTokens(currentOutput, this.model);

    return {
      inputTokens: this.inputTokens,
      outputTokens: currentOutputTokens,
      totalTokens: this.inputTokens + currentOutputTokens,
    };
  }
}

// Parse token usage from API responses when available
export function parseTokenUsageFromResponse(response: any, provider: string): TokenCount | null {
  try {
    // OpenAI format
    if (provider === 'openai' && response.usage) {
      return {
        inputTokens: response.usage.prompt_tokens || 0,
        outputTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
    }

    // Anthropic format
    if (provider === 'anthropic' && response.usage) {
      return {
        inputTokens: response.usage.input_tokens || 0,
        outputTokens: response.usage.output_tokens || 0,
        totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
      };
    }

    // Add other providers as needed

    return null;
  } catch (error) {
    console.error('Error parsing token usage:', error);
    return null;
  }
}
