export interface ConversionTrigger {
  id: string;
  type: 'usage' | 'time' | 'feature' | 'milestone';
  condition: () => boolean;
  message: string;
  cta: string;
  priority: number;
}

export interface UsageStats {
  conversationCount: number;
  messageCount: number;
  modelSelectionAttempts: Record<string, number>;
  daysSinceSignup: number;
  lastPromptShown?: string;
  promptsShown: string[];
}

const TRIGGER_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

export class ConversionTriggerManager {
  private static STORAGE_KEY = 'conversion_triggers';
  private static STATS_KEY = 'usage_stats';

  static getStats(): UsageStats {
    const stored = localStorage.getItem(this.STATS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Invalid data, reset
      }
    }

    const signupDate = localStorage.getItem('user_signup_date') || new Date().toISOString();
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      conversationCount: 0,
      messageCount: 0,
      modelSelectionAttempts: {},
      daysSinceSignup,
      promptsShown: [],
    };
  }

  static updateStats(updates: Partial<UsageStats>) {
    const current = this.getStats();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.STATS_KEY, JSON.stringify(updated));
  }

  static incrementConversations() {
    const stats = this.getStats();
    this.updateStats({ conversationCount: stats.conversationCount + 1 });
  }

  static incrementMessages() {
    const stats = this.getStats();
    this.updateStats({ messageCount: stats.messageCount + 1 });
  }

  static trackModelSelection(modelId: string) {
    const stats = this.getStats();
    const attempts = { ...stats.modelSelectionAttempts };
    attempts[modelId] = (attempts[modelId] || 0) + 1;
    this.updateStats({ modelSelectionAttempts: attempts });
  }

  static shouldShowTrigger(triggerId: string): boolean {
    const stats = this.getStats();

    // Check if already shown
    if (stats.promptsShown.includes(triggerId)) {
      return false;
    }

    // Check cooldown
    if (stats.lastPromptShown) {
      const lastShownTime = new Date(stats.lastPromptShown).getTime();
      if (Date.now() - lastShownTime < TRIGGER_COOLDOWN) {
        return false;
      }
    }

    return true;
  }

  static markTriggerShown(triggerId: string) {
    const stats = this.getStats();
    this.updateStats({
      promptsShown: [...stats.promptsShown, triggerId],
      lastPromptShown: new Date().toISOString(),
    });
  }

  static getTriggers(): ConversionTrigger[] {
    const stats = this.getStats();

    return [
      {
        id: 'first_5_conversations',
        type: 'milestone',
        condition: () => stats.conversationCount >= 5,
        message: "You've created 5 conversations! 🎉",
        cta: 'Unlock unlimited conversations with Pro',
        priority: 10,
      },
      {
        id: 'premium_model_attempts',
        type: 'feature',
        condition: () => {
          const premiumModels = ['gpt-4o', 'claude-3-5-sonnet-latest', 'gemini-2.0-flash-exp'];
          const totalAttempts = premiumModels.reduce(
            (sum, model) => sum + (stats.modelSelectionAttempts[model] || 0),
            0
          );
          return totalAttempts >= 3;
        },
        message: "Noticed you're interested in premium models? 🤔",
        cta: 'Try them all with Pro - No API keys needed',
        priority: 9,
      },
      {
        id: 'daily_active_user',
        type: 'time',
        condition: () => stats.daysSinceSignup >= 7 && stats.messageCount >= 20,
        message: "You're a power user! 💪",
        cta: 'Get 20% off Pro - Limited time offer',
        priority: 8,
      },
      {
        id: 'high_message_volume',
        type: 'usage',
        condition: () => stats.messageCount >= 50,
        message: 'Save time with faster models and priority access',
        cta: 'Upgrade to Pro for 10x speed',
        priority: 7,
      },
      {
        id: 'weekend_special',
        type: 'time',
        condition: () => {
          const day = new Date().getDay();
          return (day === 0 || day === 6) && stats.conversationCount >= 3;
        },
        message: 'Weekend Special! 🎁',
        cta: 'Get 2 months free with annual Pro',
        priority: 6,
      },
    ];
  }

  static getActiveTrigger(): ConversionTrigger | null {
    const triggers = this.getTriggers()
      .filter((trigger) => trigger.condition() && this.shouldShowTrigger(trigger.id))
      .sort((a, b) => b.priority - a.priority);

    return triggers[0] || null;
  }
}
