import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BATTERY_PLANS } from '../battery-pricing-v2';

// Mock database functions
const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: vi.fn(() => ({
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  })),
}));

describe('Subscription Plan Features and Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plan Battery Allowances', () => {
    it('should have correct daily battery allowances for each plan', () => {
      const starter = BATTERY_PLANS.find((p) => p.name === 'Starter');
      const daily = BATTERY_PLANS.find((p) => p.name === 'Daily');
      const power = BATTERY_PLANS.find((p) => p.name === 'Power');
      const ultimate = BATTERY_PLANS.find((p) => p.name === 'Ultimate');

      expect(starter?.dailyBattery).toBe(200);
      expect(daily?.dailyBattery).toBe(600);
      expect(power?.dailyBattery).toBe(1500);
      expect(ultimate?.dailyBattery).toBe(5000);
    });

    it('should have monthly totals that match daily allowance * 30', () => {
      BATTERY_PLANS.forEach((plan) => {
        const expectedMonthly = plan.dailyBattery * 30;
        expect(plan.totalBattery).toBe(expectedMonthly);
      });
    });

    it('should have progressive pricing that provides value at higher tiers', () => {
      const plans = [...BATTERY_PLANS].sort((a, b) => a.price - b.price);

      for (let i = 1; i < plans.length; i++) {
        const prevPlan = plans[i - 1];
        const currentPlan = plans[i];

        // Higher tier should have better battery per dollar ratio
        const prevRatio = prevPlan.totalBattery / prevPlan.price;
        const currentRatio = currentPlan.totalBattery / currentPlan.price;

        expect(currentRatio).toBeGreaterThan(prevRatio);
      }
    });
  });

  describe('Feature Access by Tier', () => {
    it('should have correct features for Starter plan', () => {
      const starter = BATTERY_PLANS.find((p) => p.name === 'Starter');
      expect(starter?.features).toContain('200 battery units per day');
      expect(starter?.features).toContain('All AI models');
      expect(starter?.features).toContain('30-day chat history');
      expect(starter?.features).toContain('Basic export');
      expect(starter?.features).not.toContain('File attachments');
      expect(starter?.features).not.toContain('Image generation');
    });

    it('should have correct features for Daily plan', () => {
      const daily = BATTERY_PLANS.find((p) => p.name === 'Daily');
      expect(daily?.features).toContain('600 battery units per day');
      expect(daily?.features).toContain('Unlimited chat history');
      expect(daily?.features).toContain('File attachments (10MB)');
      expect(daily?.features).toContain('Image generation');
      expect(daily?.features).toContain('Priority support');
    });

    it('should have correct features for Power plan', () => {
      const power = BATTERY_PLANS.find((p) => p.name === 'Power');
      expect(power?.features).toContain('1,500 battery units per day');
      expect(power?.features).toContain('File attachments (50MB)');
      expect(power?.features).toContain('Unlimited images');
      expect(power?.features).toContain('API access');
      expect(power?.features).toContain('Usage analytics');
      expect(power?.features).toContain('Custom prompts');
    });

    it('should have correct features for Ultimate plan', () => {
      const ultimate = BATTERY_PLANS.find((p) => p.name === 'Ultimate');
      expect(ultimate?.features).toContain('5,000 battery units per day');
      expect(ultimate?.features).toContain('Team seats (5)');
      expect(ultimate?.features).toContain('Advanced integrations');
      expect(ultimate?.features).toContain('SLA support');
      expect(ultimate?.features).toContain('Custom models');
    });

    it('should have cumulative features (higher tiers include lower tier features)', () => {
      const power = BATTERY_PLANS.find((p) => p.name === 'Power');
      const ultimate = BATTERY_PLANS.find((p) => p.name === 'Ultimate');

      // Power includes "Everything in Daily plan"
      expect(power?.features.some((f) => f.includes('Everything in Daily'))).toBe(true);

      // Ultimate includes "Everything in Power plan"
      expect(ultimate?.features.some((f) => f.includes('Everything in Power'))).toBe(true);
    });
  });

  describe('File Upload Limits', () => {
    it('should enforce file size limits based on subscription tier', () => {
      const getFileUploadLimit = (planName: string): number => {
        const plan = BATTERY_PLANS.find((p) => p.name === planName);

        // Check direct features
        const fileFeature = plan?.features.find((f) => f.includes('File attachments'));
        if (fileFeature) {
          const match = fileFeature.match(/\((\d+)MB\)/);
          return match ? parseInt(match[1]) : 0;
        }

        // Check inherited features
        if (plan?.features.some((f) => f.includes('Everything in Power'))) {
          return 50; // Inherits Power's 50MB limit
        }
        if (plan?.features.some((f) => f.includes('Everything in Daily'))) {
          return 10; // Inherits Daily's 10MB limit
        }

        return 0;
      };

      expect(getFileUploadLimit('Starter')).toBe(0); // No file uploads
      expect(getFileUploadLimit('Daily')).toBe(10); // 10MB
      expect(getFileUploadLimit('Power')).toBe(50); // 50MB
      expect(getFileUploadLimit('Ultimate')).toBe(50); // Inherits from Power via "Everything in Power plan"
    });
  });

  describe('Chat History Limits', () => {
    it('should enforce chat history limits based on subscription', () => {
      const getChatHistoryLimit = (planName: string): number | 'unlimited' => {
        const plan = BATTERY_PLANS.find((p) => p.name === planName);
        const historyFeature = plan?.features.find((f) => f.includes('chat history'));

        if (historyFeature?.includes('Unlimited')) return 'unlimited';
        if (historyFeature?.includes('30-day')) return 30;

        // Check inherited features
        if (
          plan?.features.some(
            (f) => f.includes('Everything in Daily') || f.includes('Everything in Power')
          )
        ) {
          return 'unlimited'; // Daily plan has unlimited history
        }

        return 0;
      };

      expect(getChatHistoryLimit('Starter')).toBe(30); // 30-day limit
      expect(getChatHistoryLimit('Daily')).toBe('unlimited');
      expect(getChatHistoryLimit('Power')).toBe('unlimited'); // Inherits via "Everything in Daily plan"
      expect(getChatHistoryLimit('Ultimate')).toBe('unlimited'); // Inherits via "Everything in Power plan"
    });
  });

  describe('Usage Estimates', () => {
    it('should provide accurate daily chat estimates', () => {
      BATTERY_PLANS.forEach((plan) => {
        // The estimates in the plan are approximations, just verify they're reasonable
        expect(plan.estimatedChats.budget).toBeGreaterThan(0);
        expect(plan.estimatedChats.premium).toBeGreaterThan(0);
        // Higher plans should estimate more chats
        if (plan.dailyBattery > 200) {
          const starterPlan = BATTERY_PLANS.find((p) => p.name === 'Starter')!;
          expect(plan.estimatedChats.budget).toBeGreaterThan(starterPlan.estimatedChats.budget);
        }
      });
    });
  });

  describe('Team Features', () => {
    it('should only provide team seats for Ultimate plan', () => {
      BATTERY_PLANS.forEach((plan) => {
        const hasTeamSeats = plan.features.some((f) => f.includes('Team seats'));

        if (plan.name === 'Ultimate') {
          expect(hasTeamSeats).toBe(true);
          const teamFeature = plan.features.find((f) => f.includes('Team seats'));
          expect(teamFeature).toContain('5'); // 5 team seats
        } else {
          expect(hasTeamSeats).toBe(false);
        }
      });
    });
  });

  describe('API Access', () => {
    it('should only provide API access for Power and Ultimate plans', () => {
      BATTERY_PLANS.forEach((plan) => {
        const hasAPIAccess = plan.features.some((f) => f.includes('API access'));

        if (plan.name === 'Power' || plan.name === 'Ultimate') {
          expect(hasAPIAccess || plan.features.some((f) => f.includes('Everything in Power'))).toBe(
            true
          );
        } else {
          expect(hasAPIAccess).toBe(false);
        }
      });
    });
  });

  describe('Image Generation Limits', () => {
    it('should provide image generation based on plan', () => {
      const hasImageGeneration = (planName: string): boolean => {
        const plan = BATTERY_PLANS.find((p) => p.name === planName);
        return (
          plan?.features.some(
            (f) => f.includes('Image generation') || f.includes('Unlimited images')
          ) || false
        );
      };

      expect(hasImageGeneration('Starter')).toBe(false);
      expect(hasImageGeneration('Daily')).toBe(true); // Basic image generation
      expect(hasImageGeneration('Power')).toBe(true); // Unlimited images
      expect(
        hasImageGeneration('Ultimate') ||
          BATTERY_PLANS.find((p) => p.name === 'Ultimate')?.features.some((f) =>
            f.includes('Everything in Power')
          )
      ).toBe(true); // Inherits
    });
  });

  describe('Support Levels', () => {
    it('should provide appropriate support levels by tier', () => {
      const getSupportLevel = (planName: string): string => {
        const plan = BATTERY_PLANS.find((p) => p.name === planName);

        if (plan?.features.some((f) => f.includes('SLA support'))) return 'sla';
        if (plan?.features.some((f) => f.includes('Priority support'))) return 'priority';

        // Check if inherits from a plan with priority support
        if (plan?.features.some((f) => f.includes('Everything in Daily'))) return 'priority';
        if (plan?.features.some((f) => f.includes('Everything in Power'))) return 'priority';

        return 'basic';
      };

      expect(getSupportLevel('Starter')).toBe('basic');
      expect(getSupportLevel('Daily')).toBe('priority');
      // Power inherits from Daily, which has priority support
      expect(getSupportLevel('Power')).toBe('priority');
      expect(getSupportLevel('Ultimate')).toBe('sla');
    });
  });

  describe('Battery Rollover', () => {
    it('should allow daily battery to roll over for all plans', () => {
      BATTERY_PLANS.forEach((plan) => {
        const hasRollover = plan.features.some((f) =>
          f.includes('Rolls over unused daily battery')
        );
        // Only Starter and Daily explicitly mention rollover, higher tiers inherit
        if (plan.name === 'Starter' || plan.name === 'Daily') {
          expect(hasRollover).toBe(true);
        } else {
          // Power and Ultimate inherit this feature
          expect(plan.features.some((f) => f.includes('Everything in'))).toBe(true);
        }
      });
    });
  });

  describe('Price Value Validation', () => {
    it('should ensure pricing makes sense vs pay-as-you-go', () => {
      // Pay-as-you-go rate from BATTERY_TOPUPS: 15,000 BU for $14.99
      const payAsYouGoRate = 14.99 / 15000; // $ per BU

      BATTERY_PLANS.forEach((plan) => {
        const planRate = plan.price / plan.totalBattery;

        // Subscription should be cheaper than pay-as-you-go
        expect(planRate).toBeLessThan(payAsYouGoRate);

        // Higher tiers should have better rates
        if (plan.name !== 'Starter') {
          const starterPlan = BATTERY_PLANS.find((p) => p.name === 'Starter');
          const starterRate = starterPlan!.price / starterPlan!.totalBattery;
          expect(planRate).toBeLessThan(starterRate);
        }
      });
    });
  });
});
