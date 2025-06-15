import { describe, it, expect } from 'vitest';
import {
  calculateBatteryUsage,
  getBatteryPercentage,
  getBatteryColor,
  formatBatteryDisplay,
  estimateRemainingMessages,
  calculateMonthlySavings,
  MODEL_BATTERY_USAGE,
  normalizeModelIdForPricing,
} from '../battery-pricing';
import { SIMPLE_BATTERY_PLANS } from '../battery-pricing-simple';

describe('Battery Pricing Calculations', () => {
  describe('normalizeModelIdForPricing', () => {
    it('should normalize Claude model IDs correctly', () => {
      expect(normalizeModelIdForPricing('claude-3-5-haiku-20241022')).toBe('claude-haiku-3.5');
      expect(normalizeModelIdForPricing('claude-opus-4-20250514')).toBe('claude-opus-4');
      expect(normalizeModelIdForPricing('claude-sonnet-4-20250514')).toBe('claude-sonnet-4');
      expect(normalizeModelIdForPricing('claude-3-7-sonnet-20250514')).toBe('claude-sonnet-4');
    });

    it('should normalize GPT model IDs correctly', () => {
      expect(normalizeModelIdForPricing('gpt-4.1')).toBe('gpt-4.1');
      expect(normalizeModelIdForPricing('gpt-4.1-mini')).toBe('gpt-4.1-mini');
      expect(normalizeModelIdForPricing('gpt-4.1-nano')).toBe('gpt-4.1-nano');
      expect(normalizeModelIdForPricing('gpt-4o')).toBe('gpt-4o');
      expect(normalizeModelIdForPricing('gpt-4o-mini')).toBe('gpt-4o-mini');
    });

    it('should normalize Gemini model IDs correctly', () => {
      expect(normalizeModelIdForPricing('gemini-1.5-flash')).toBe('gemini-1.5-flash');
      expect(normalizeModelIdForPricing('gemini-1-5-flash')).toBe('gemini-1.5-flash');
      expect(normalizeModelIdForPricing('gemini-2.0-flash')).toBe('gemini-2.0-flash');
      expect(normalizeModelIdForPricing('gemini-2-0-flash')).toBe('gemini-2.0-flash');
    });
  });

  describe('calculateBatteryUsage', () => {
    it('should calculate battery usage correctly for budget models', () => {
      // DeepSeek Chat: 2.23 BU per 1K tokens
      const usage = calculateBatteryUsage('deepseek-chat', 500, 500, false);
      expect(usage).toBe(3); // (1000/1000) * 2.23 = 2.23, rounded up to 3
    });

    it('should calculate battery usage correctly for mid-tier models', () => {
      // GPT-4.1-mini: 3.25 BU per 1K tokens
      const usage = calculateBatteryUsage('gpt-4.1-mini', 1000, 1000, false);
      expect(usage).toBe(7); // (2000/1000) * 3.25 = 6.5, rounded up to 7
    });

    it('should calculate battery usage correctly for premium models', () => {
      // GPT-4.1: 16.25 BU per 1K tokens
      const usage = calculateBatteryUsage('gpt-4.1', 1000, 1000, false);
      expect(usage).toBe(33); // (2000/1000) * 16.25 = 32.5, rounded up to 33
    });

    it('should calculate battery usage correctly for ultra models', () => {
      // Claude Opus 4: 146.25 BU per 1K tokens
      const usage = calculateBatteryUsage('claude-opus-4', 100, 100, false);
      expect(usage).toBe(30); // (200/1000) * 146.25 = 29.25, rounded up to 30
    });

    it('should apply cache discount for DeepSeek', () => {
      // Uncached: 2.23 BU per 1K tokens
      const uncached = calculateBatteryUsage('deepseek-chat', 1000, 1000, false);
      expect(uncached).toBe(5); // (2000/1000) * 2.23 = 4.46, rounded up to 5

      // Cached: 1.91 BU per 1K tokens
      const cached = calculateBatteryUsage('deepseek-chat', 1000, 1000, true);
      expect(cached).toBe(4); // (2000/1000) * 1.91 = 3.82, rounded up to 4
    });

    it('should charge minimal amount for local models', () => {
      const usage = calculateBatteryUsage('llama3.3:latest', 10000, 10000, false);
      expect(usage).toBe(2); // (20000/1000) * 0.1 = 2
    });

    it('should return default cost for unknown models', () => {
      const usage = calculateBatteryUsage('unknown-model', 1000, 1000, false);
      // Default cost is 10 BU per 1K tokens, so 2000 tokens = 20 BU
      expect(usage).toBe(20);
    });

    it('should always round up to protect revenue', () => {
      // Even tiny usage should cost at least 1 BU
      const usage = calculateBatteryUsage('gpt-4.1-nano', 10, 10, false);
      expect(usage).toBe(1); // (20/1000) * 0.82 = 0.0164, rounded up to 1
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

      // Budget models (updated rates)
      expect(estimates['deepseek-chat']).toBe(1785); // 1000 / 0.56
      expect(estimates['gpt-4.1-nano']).toBe(4761); // 1000 / 0.21

      // Mid-tier models
      expect(estimates['gpt-4.1-mini']).toBe(1219); // 1000 / 0.82
      expect(estimates['claude-haiku-3.5']).toBe(512); // 1000 / 1.95

      // Premium models
      expect(estimates['gpt-4.1']).toBe(245); // 1000 / 4.07
      expect(estimates['grok-3']).toBe(136); // 1000 / 7.32

      // Ultra models
      expect(estimates['claude-opus-4']).toBe(27); // 1000 / 36.57

      // Local models (minimal cost)
      expect(estimates['llama3.3:latest']).toBe(40000); // 1000 / 0.025
    });
  });

  describe('calculateMonthlySavings', () => {
    it('should calculate savings correctly for heavy users', () => {
      // User needs 50,000 BU per month
      const monthlyUsage = 50000;

      // Using topup price: 15,000 BU for $14.99
      const payAsYouGoCost = (monthlyUsage / 15000) * 14.99;

      // Power plan: $29.99 for 45,000 BU (not quite enough but close)
      const powerPlan = SIMPLE_BATTERY_PLANS.find((p) => p.name === 'Power')!;
      const powerSavings = calculateMonthlySavings(monthlyUsage, {
        name: powerPlan.name,
        price: powerPlan.price,
        batteryUnits: powerPlan.totalBattery,
        features: [],
      });
      expect(powerSavings).toBeCloseTo(payAsYouGoCost - powerPlan.price, 1);
    });

    it('should return 0 for light users', () => {
      // User only needs 3,000 BU per month
      const monthlyUsage = 3000;

      // All plans would be more expensive than pay-as-you-go
      const starterPlan = SIMPLE_BATTERY_PLANS[0];
      const starterSavings = calculateMonthlySavings(monthlyUsage, {
        name: starterPlan.name,
        price: starterPlan.price,
        batteryUnits: starterPlan.totalBattery,
        features: [],
      });
      expect(starterSavings).toBe(0); // No savings, plan costs more
    });
  });

  describe('Model pricing accuracy', () => {
    it('should have correct pricing for all advertised models', () => {
      // Verify key models exist and have reasonable pricing with new rates
      expect(MODEL_BATTERY_USAGE['gpt-4.1-mini'].batteryPerKToken).toBe(3.25);
      expect(MODEL_BATTERY_USAGE['claude-haiku-3.5'].batteryPerKToken).toBe(7.8);
      expect(MODEL_BATTERY_USAGE['gpt-4.1'].batteryPerKToken).toBe(16.25);
      expect(MODEL_BATTERY_USAGE['claude-opus-4'].batteryPerKToken).toBe(146.25);
    });

    it('should have cache pricing cheaper than uncached', () => {
      const uncached = MODEL_BATTERY_USAGE['deepseek-chat'].batteryPerKToken;
      const cached = MODEL_BATTERY_USAGE['deepseek-chat-cached'].batteryPerKToken;
      const discount = (uncached - cached) / uncached;

      expect(discount).toBeGreaterThan(0.1); // At least 10% discount
      expect(cached).toBe(1.91); // Verify exact cached price
    });

    it('should maintain consistent profit margins', () => {
      // All models should have approximately 3.25x markup (69% profit margin)
      const expectedMarkup = 3.25;
      const tolerance = 0.5; // Allow some variation

      // Test a few key models
      const testCases = [
        { model: 'gpt-4.1-nano', providerCost: 0.25 },
        { model: 'gpt-4.1-mini', providerCost: 1.0 },
        { model: 'gpt-4.1', providerCost: 5.0 },
        { model: 'claude-opus-4', providerCost: 45.0 },
      ];

      testCases.forEach(({ model, providerCost }) => {
        const batteryRate = MODEL_BATTERY_USAGE[model].batteryPerKToken;
        const userCost = batteryRate * 0.001 * 1000; // Convert to $ per M tokens
        const markup = userCost / providerCost;

        expect(markup).toBeGreaterThan(expectedMarkup - tolerance);
        expect(markup).toBeLessThan(expectedMarkup + tolerance);
      });
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
      expect(budgetCost).toBe(9); // 2500 tokens * 3.25 / 1000 = 8.125, rounded up to 9

      // Premium model cost
      const premiumCost = calculateBatteryUsage('gpt-4.1', totalTokens / 2, totalTokens / 2, false);
      expect(premiumCost).toBe(41); // 2500 tokens * 16.25 / 1000 = 40.625, rounded up to 41

      // Ultra model cost
      const ultraCost = calculateBatteryUsage(
        'claude-opus-4',
        totalTokens / 2,
        totalTokens / 2,
        false
      );
      expect(ultraCost).toBe(366); // 2500 tokens * 146.25 / 1000 = 365.625, rounded up to 366
    });

    it('should verify daily allowance is sufficient for advertised usage', () => {
      // Starter plan: 200 BU daily
      const starterDaily = 200;
      const budgetModel = MODEL_BATTERY_USAGE['gpt-4.1-nano'];
      const budgetChatsPerDay = Math.floor(starterDaily / (budgetModel.estimatedPerMessage * 5));
      expect(budgetChatsPerDay).toBeGreaterThanOrEqual(30); // Should support many budget chats

      // Power plan: 1500 BU daily
      const powerDaily = 1500;
      const premiumModel = MODEL_BATTERY_USAGE['gpt-4.1'];
      const premiumChatsPerDay = Math.floor(powerDaily / (premiumModel.estimatedPerMessage * 5));
      expect(premiumChatsPerDay).toBeGreaterThanOrEqual(50); // Should support many premium chats
    });
  });

  describe('Subscription profitability', () => {
    it('should ensure all plans are profitable even with heavy usage', () => {
      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        // Calculate worst case: user only uses most expensive model
        const mostExpensiveModel = MODEL_BATTERY_USAGE['claude-opus-4'];
        const maxTokens = (plan.totalBattery / mostExpensiveModel.batteryPerKToken) * 1000;

        // Provider cost for Claude Opus 4: $45/M tokens average
        const providerCost = (maxTokens / 1000000) * 45;
        const profit = plan.price - providerCost;
        const margin = (profit / plan.price) * 100;

        // Even in worst case, should maintain profitability
        expect(margin).toBeGreaterThan(40); // At least 40% margin
      });
    });

    it('should provide good value compared to pay-as-you-go', () => {
      // Pay-as-you-go: 15,000 BU for $14.99
      const payAsYouGoRate = 14.99 / 15000;

      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        const subscriptionRate = plan.price / plan.totalBattery;

        // Subscription should offer better value
        expect(subscriptionRate).toBeLessThan(payAsYouGoRate);
      });
    });
  });
});
