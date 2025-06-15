import { describe, it, expect } from 'vitest';
import { SIMPLE_BATTERY_PLANS } from '../battery-pricing-simple';

describe('Subscription Battery Allocations', () => {
  describe('Plan Battery Values', () => {
    it('should have correct battery allocations for each plan', () => {
      const plans = SIMPLE_BATTERY_PLANS;

      // Starter Plan
      const starter = plans.find((p) => p.name === 'Starter');
      expect(starter).toBeDefined();
      expect(starter!.totalBattery).toBe(6000);
      expect(starter!.dailyBattery).toBe(200);
      expect(starter!.price).toBe(4.99);

      // Daily Plan
      const daily = plans.find((p) => p.name === 'Daily');
      expect(daily).toBeDefined();
      expect(daily!.totalBattery).toBe(18000);
      expect(daily!.dailyBattery).toBe(600);
      expect(daily!.price).toBe(12.99);

      // Power Plan
      const power = plans.find((p) => p.name === 'Power');
      expect(power).toBeDefined();
      expect(power!.totalBattery).toBe(45000);
      expect(power!.dailyBattery).toBe(1500);
      expect(power!.price).toBe(29.99);

      // Ultimate Plan
      const ultimate = plans.find((p) => p.name === 'Ultimate');
      expect(ultimate).toBeDefined();
      expect(ultimate!.totalBattery).toBe(150000);
      expect(ultimate!.dailyBattery).toBe(5000);
      expect(ultimate!.price).toBe(79.99);
    });

    it('should have daily battery that equals monthly total divided by 30', () => {
      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        const expectedDaily = Math.floor(plan.totalBattery / 30);
        expect(plan.dailyBattery).toBe(expectedDaily);
      });
    });
  });

  describe('Value Proposition', () => {
    it('should provide better value per battery unit at higher tiers', () => {
      const plans = [...SIMPLE_BATTERY_PLANS].sort((a, b) => a.price - b.price);

      let previousRate = Infinity;
      plans.forEach((plan) => {
        const rate = plan.price / plan.totalBattery;

        // Each tier should have a better rate than the previous
        expect(rate).toBeLessThan(previousRate);
        previousRate = rate;
      });
    });

    it('should offer significant savings vs pay-as-you-go', () => {
      // Pay-as-you-go rate from topups: 15,000 BU for $14.99
      const payAsYouGoRate = 14.99 / 15000; // $0.000999 per BU

      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        const subscriptionRate = plan.price / plan.totalBattery;

        // All subscription plans should be cheaper than pay-as-you-go
        expect(subscriptionRate).toBeLessThan(payAsYouGoRate);

        // Calculate percentage savings
        const savings = ((payAsYouGoRate - subscriptionRate) / payAsYouGoRate) * 100;

        // Higher tiers should have more savings
        if (plan.name === 'Starter') {
          expect(savings).toBeGreaterThan(15); // At least 15% savings
        } else if (plan.name === 'Ultimate') {
          expect(savings).toBeGreaterThan(45); // At least 45% savings
        }
      });
    });
  });

  describe('Usage Estimates', () => {
    it('should provide reasonable chat estimates', () => {
      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        // Budget model estimates
        expect(plan.estimatedChats.budget).toBeGreaterThan(0);

        // Premium model estimates
        expect(plan.estimatedChats.premium).toBeGreaterThan(0);

        // Budget should always allow more chats than premium
        expect(plan.estimatedChats.budget).toBeGreaterThan(plan.estimatedChats.premium);
      });
    });

    it('should scale chat estimates with plan tier', () => {
      const plans = [...SIMPLE_BATTERY_PLANS].sort((a, b) => a.price - b.price);

      let previousBudget = 0;
      let previousPremium = 0;

      plans.forEach((plan) => {
        // Higher tiers should estimate more chats
        expect(plan.estimatedChats.budget).toBeGreaterThan(previousBudget);
        expect(plan.estimatedChats.premium).toBeGreaterThan(previousPremium);

        previousBudget = plan.estimatedChats.budget;
        previousPremium = plan.estimatedChats.premium;
      });
    });
  });

  describe('Webhook Integration', () => {
    it('should match values used in stripe webhook', () => {
      // These values should match what's in the webhook handler
      const webhookPlans = {
        starter: { batteryUnits: 6000, dailyBattery: 200 },
        daily: { batteryUnits: 18000, dailyBattery: 600 },
        power: { batteryUnits: 45000, dailyBattery: 1500 },
        ultimate: { batteryUnits: 150000, dailyBattery: 5000 },
      };

      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        const webhookPlan = webhookPlans[plan.name.toLowerCase() as keyof typeof webhookPlans];
        expect(webhookPlan).toBeDefined();
        expect(plan.totalBattery).toBe(webhookPlan.batteryUnits);
        expect(plan.dailyBattery).toBe(webhookPlan.dailyBattery);
      });
    });
  });

  describe('Profitability Check', () => {
    it('should maintain profitability with subscription pricing', () => {
      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        // Battery value at $0.001 per BU
        const batteryValue = plan.totalBattery * 0.001;

        // Subscription price should be less than battery value
        // This ensures users get a discount while we maintain margin
        expect(plan.price).toBeLessThan(batteryValue);

        // But not too much less (maintain some margin)
        const discount = (batteryValue - plan.price) / batteryValue;
        expect(discount).toBeLessThan(0.5); // Max 50% discount
      });
    });
  });

  describe('Daily Allowance Sufficiency', () => {
    it('should provide sufficient daily battery for typical usage', async () => {
      // Import battery usage rates
      const { MODEL_BATTERY_USAGE } = await import('../battery-pricing');

      SIMPLE_BATTERY_PLANS.forEach((plan) => {
        // Test with budget model (GPT-4.1-nano)
        const budgetModel = MODEL_BATTERY_USAGE['gpt-4.1-nano'];
        const budgetChatsPerDay = Math.floor(
          plan.dailyBattery / (budgetModel.estimatedPerMessage * 5)
        );

        // Even starter plan should support multiple budget chats
        expect(budgetChatsPerDay).toBeGreaterThan(10);

        // Test with mid-tier model (GPT-4.1-mini)
        const midModel = MODEL_BATTERY_USAGE['gpt-4.1-mini'];
        const midChatsPerDay = Math.floor(plan.dailyBattery / (midModel.estimatedPerMessage * 5));

        // Should support reasonable mid-tier usage
        if (plan.name !== 'Starter') {
          expect(midChatsPerDay).toBeGreaterThan(5);
        }
      });
    });
  });
});
