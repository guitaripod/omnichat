import { describe, it, expect } from 'vitest';
import {
  calculateBatteryUsage,
  getBatteryPercentage,
  getBatteryColor,
  formatBatteryDisplay,
  estimateRemainingMessages,
  calculateMonthlySavings,
  MODEL_BATTERY_USAGE,
  BATTERY_TIERS,
} from '../battery-pricing';

describe('Battery Pricing Calculations', () => {
  describe('calculateBatteryUsage', () => {
    it('should calculate battery usage correctly for budget models', () => {
      // DeepSeek Chat: 1.4 BU per 1K tokens
      const usage = calculateBatteryUsage('deepseek-chat', 500, 500, false);
      expect(usage).toBe(2); // (1000/1000) * 1.4 = 1.4, rounded up to 2
    });

    it('should calculate battery usage correctly for premium models', () => {
      // GPT-4.1: 10 BU per 1K tokens
      const usage = calculateBatteryUsage('gpt-4.1', 1000, 1000, false);
      expect(usage).toBe(20); // (2000/1000) * 10 = 20
    });

    it('should calculate battery usage correctly for ultra models', () => {
      // Claude Opus 4: 90 BU per 1K tokens
      const usage = calculateBatteryUsage('claude-opus-4', 100, 100, false);
      expect(usage).toBe(18); // (200/1000) * 90 = 18
    });

    it('should apply cache discount for DeepSeek', () => {
      // Uncached: 1.4 BU per 1K tokens
      const uncached = calculateBatteryUsage('deepseek-chat', 1000, 1000, false);
      expect(uncached).toBe(3); // (2000/1000) * 1.4 = 2.8, rounded up to 3

      // Cached: 0.4 BU per 1K tokens (71% discount)
      const cached = calculateBatteryUsage('deepseek-chat', 1000, 1000, true);
      expect(cached).toBe(1); // (2000/1000) * 0.4 = 0.8, rounded up to 1
    });

    it('should return 0 for local models', () => {
      const usage = calculateBatteryUsage('llama3.3:latest', 10000, 10000, false);
      expect(usage).toBe(0);
    });

    it('should return default cost for unknown models', () => {
      const usage = calculateBatteryUsage('unknown-model', 1000, 1000, false);
      // Default cost is 10 BU per 1K tokens, so 2000 tokens = 20 BU
      expect(usage).toBe(20);
    });

    it('should always round up to protect revenue', () => {
      // Even tiny usage should cost at least 1 BU
      const usage = calculateBatteryUsage('gpt-4.1-nano', 10, 10, false);
      expect(usage).toBe(1); // (20/1000) * 0.5 = 0.01, rounded up to 1
    });
  });

  describe('getBatteryPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(getBatteryPercentage(500, 1000)).toBe(50);
      expect(getBatteryPercentage(250, 1000)).toBe(25);
      expect(getBatteryPercentage(10, 1000)).toBe(1);
      expect(getBatteryPercentage(1000, 1000)).toBe(100);
    });

    it('should handle edge cases', () => {
      expect(getBatteryPercentage(0, 1000)).toBe(0);
      expect(getBatteryPercentage(1001, 1000)).toBe(100); // Over 100%
    });
  });

  describe('getBatteryColor', () => {
    it('should return correct color based on percentage', () => {
      expect(getBatteryColor(75)).toBe('text-green-500');
      expect(getBatteryColor(51)).toBe('text-green-500');
      expect(getBatteryColor(50)).toBe('text-yellow-500');
      expect(getBatteryColor(26)).toBe('text-yellow-500');
      expect(getBatteryColor(25)).toBe('text-orange-500');
      expect(getBatteryColor(11)).toBe('text-orange-500');
      expect(getBatteryColor(10)).toBe('text-red-500');
      expect(getBatteryColor(1)).toBe('text-red-500');
    });
  });

  describe('formatBatteryDisplay', () => {
    it('should format battery display correctly', () => {
      const display = formatBatteryDisplay(5000, 10000);
      expect(display.percentage).toBe(50);
      expect(display.color).toBe('text-yellow-500'); // 50% is yellow, not green
      expect(display.icon).toBe('🔋');
      expect(display.text).toBe('5,000 BU (50%)');
    });

    it('should show low battery icon when below 10%', () => {
      const display = formatBatteryDisplay(500, 10000);
      expect(display.percentage).toBe(5);
      expect(display.color).toBe('text-red-500');
      expect(display.icon).toBe('🪫');
      expect(display.text).toBe('500 BU (5%)');
    });
  });

  describe('estimateRemainingMessages', () => {
    it('should estimate messages correctly for each model', () => {
      const estimates = estimateRemainingMessages(1000);

      // Budget models
      expect(estimates['deepseek-chat']).toBe(2857); // 1000 / 0.35
      expect(estimates['gpt-4.1-nano']).toBe(8000); // 1000 / 0.125

      // Mid-tier models
      expect(estimates['gpt-4.1-mini']).toBe(2000); // 1000 / 0.5
      expect(estimates['claude-haiku-3.5']).toBe(833); // 1000 / 1.2

      // Premium models
      expect(estimates['gpt-4.1']).toBe(400); // 1000 / 2.5
      expect(estimates['grok-3']).toBe(222); // 1000 / 4.5

      // Ultra models
      expect(estimates['claude-opus-4']).toBe(44); // 1000 / 22.5

      // Local models (free)
      expect(estimates['llama3.3:latest']).toBe(Infinity);
    });
  });

  describe('calculateMonthlySavings', () => {
    it('should calculate savings correctly for heavy users', () => {
      // User needs 50,000 BU per month
      const monthlyUsage = 50000;

      // Starter plan: $4.99 for 5,000 BU (not enough)
      const starterSavings = calculateMonthlySavings(monthlyUsage, BATTERY_TIERS[0]);
      expect(starterSavings).toBe(44.96); // (50000/10000 * 9.99) - 4.99

      // Pro plan: $39.99 for 60,000 BU (good fit)
      const proSavings = calculateMonthlySavings(monthlyUsage, BATTERY_TIERS[2]);
      expect(proSavings).toBe(9.96); // (50000/10000 * 9.99) - 39.99
    });

    it('should return 0 for light users', () => {
      // User only needs 3,000 BU per month
      const monthlyUsage = 3000;

      // All plans would be more expensive than pay-as-you-go
      const starterSavings = calculateMonthlySavings(monthlyUsage, BATTERY_TIERS[0]);
      expect(starterSavings).toBe(0); // No savings, plan costs more
    });
  });

  describe('Model pricing accuracy', () => {
    it('should have correct pricing for all advertised models', () => {
      // Verify key models exist and have reasonable pricing
      expect(MODEL_BATTERY_USAGE['gpt-4.1-mini'].batteryPerKToken).toBe(2.0);
      expect(MODEL_BATTERY_USAGE['claude-haiku-3.5'].batteryPerKToken).toBe(4.8);
      expect(MODEL_BATTERY_USAGE['gpt-4.1'].batteryPerKToken).toBe(10.0);
      expect(MODEL_BATTERY_USAGE['claude-opus-4'].batteryPerKToken).toBe(90.0);
    });

    it('should have cache pricing significantly cheaper than uncached', () => {
      const uncached = MODEL_BATTERY_USAGE['deepseek-chat'].batteryPerKToken;
      const cached = MODEL_BATTERY_USAGE['deepseek-chat-cached'].batteryPerKToken;
      const discount = (uncached - cached) / uncached;

      expect(discount).toBeGreaterThan(0.7); // At least 70% discount
      expect(cached).toBe(0.4); // Verify exact cached price
    });
  });

  describe('Real-world usage scenarios', () => {
    it('should calculate cost for typical chat conversation', () => {
      // Typical conversation: 5 messages, ~500 tokens each
      const messagesCount = 5;
      const tokensPerMessage = 500;
      const totalTokens = messagesCount * tokensPerMessage;

      // Budget model cost
      const budgetCost = calculateBatteryUsage(
        'gpt-4.1-mini',
        totalTokens / 2,
        totalTokens / 2,
        false
      );
      expect(budgetCost).toBe(5); // 2500 tokens * 2.0 / 1000 = 5

      // Premium model cost
      const premiumCost = calculateBatteryUsage('gpt-4.1', totalTokens / 2, totalTokens / 2, false);
      expect(premiumCost).toBe(25); // 2500 tokens * 10.0 / 1000 = 25

      // Ultra model cost
      const ultraCost = calculateBatteryUsage(
        'claude-opus-4',
        totalTokens / 2,
        totalTokens / 2,
        false
      );
      expect(ultraCost).toBe(225); // 2500 tokens * 90.0 / 1000 = 225
    });

    it('should verify daily allowance is sufficient for advertised usage', () => {
      // Starter plan: 200 BU daily, claims ~40 budget chats
      const starterDaily = 200;
      const budgetChatCost = MODEL_BATTERY_USAGE['gpt-4.1-nano'].estimatedPerMessage * 5; // 5 messages per chat
      const budgetChatsPerDay = Math.floor(starterDaily / budgetChatCost);
      expect(budgetChatsPerDay).toBeGreaterThanOrEqual(40);

      // Power plan: 1500 BU daily, claims ~30 premium chats
      const powerDaily = 1500;
      const premiumChatCost = MODEL_BATTERY_USAGE['gpt-4.1'].estimatedPerMessage * 5;
      const premiumChatsPerDay = Math.floor(powerDaily / premiumChatCost);
      expect(premiumChatsPerDay).toBeGreaterThanOrEqual(30);
    });
  });
});
