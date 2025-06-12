import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackApiUsage, checkBatteryBalance, resetDailyBatteryAllowances } from '../usage-tracking';
import { calculateBatteryUsage } from '../battery-pricing';

// Mock database
const mockTransaction = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  })),
}));

// Mock battery pricing calculation
vi.mock('@/lib/battery-pricing', () => ({
  calculateBatteryUsage: vi.fn(),
}));

describe('Battery Balance Calculations and Deductions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for calculateBatteryUsage
    vi.mocked(calculateBatteryUsage).mockReturnValue(10);
  });

  describe('trackApiUsage', () => {
    it('should deduct battery correctly for a simple API call', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
      };

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockUserBattery),
          }),
        }),
      });

      // Mock transaction execution
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue({}),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue(null), // No existing daily summary
              }),
            }),
          }),
        };
        await fn(tx);

        // Verify battery was deducted correctly
        expect(tx.update).toHaveBeenCalled();
        const updateCall = tx.update.mock.calls[0];
        expect(updateCall).toBeDefined();

        const setCall = tx.update().set.mock.calls[0];
        expect(setCall[0].totalBalance).toBe(990); // 1000 - 10
      });

      const result = await trackApiUsage({
        userId: 'user123',
        conversationId: 'conv123',
        messageId: 'msg123',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 100,
      });

      expect(result.success).toBe(true);
      expect(result.batteryUsed).toBe(10);
      expect(result.newBalance).toBe(990);
    });

    it('should reject usage when insufficient battery balance', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 5, // Only 5 units left
        dailyAllowance: 0,
      };

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockUserBattery),
          }),
        }),
      });

      // Battery cost is 10, but user only has 5
      await expect(
        trackApiUsage({
          userId: 'user123',
          conversationId: 'conv123',
          messageId: 'msg123',
          model: 'gpt-4o-mini',
          inputTokens: 100,
          outputTokens: 100,
        })
      ).rejects.toThrow('Insufficient battery balance');
    });

    it('should handle cached model pricing correctly', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
      };

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockUserBattery),
          }),
        }),
      });

      // Mock different pricing for cached vs uncached
      vi.mocked(calculateBatteryUsage).mockImplementation(
        (model: string, input: number, output: number, useCache?: boolean) => {
          if (useCache) return 3; // Cheaper when cached
          return 10; // Normal price
        }
      );

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue({}),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue(null),
              }),
            }),
          }),
        };
        await fn(tx);
      });

      const result = await trackApiUsage({
        userId: 'user123',
        conversationId: 'conv123',
        messageId: 'msg123',
        model: 'deepseek-chat',
        inputTokens: 100,
        outputTokens: 100,
        cached: true,
      });

      expect(calculateBatteryUsage).toHaveBeenCalledWith('deepseek-chat', 100, 100, true);
      expect(result.batteryUsed).toBe(3);
      expect(result.newBalance).toBe(997);
    });

    it('should update daily usage summary correctly', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
      };

      const existingSummary = {
        id: 'summary123',
        userId: 'user123',
        date: new Date().toISOString().split('T')[0],
        totalBatteryUsed: 50,
        totalMessages: 5,
        modelsUsed: JSON.stringify({ 'gpt-4o-mini': 3, 'claude-haiku': 2 }),
      };

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockUserBattery),
          }),
        }),
      });

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue({}),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue(existingSummary),
              }),
            }),
          }),
        };
        await fn(tx);

        // Verify daily summary update
        const updateCalls = tx.update.mock.calls;
        expect(updateCalls.length).toBe(2); // Battery update + summary update

        const summaryUpdate = tx.update().set.mock.calls[1];
        expect(summaryUpdate[0].totalBatteryUsed).toBe(60); // 50 + 10
        expect(summaryUpdate[0].totalMessages).toBe(6); // 5 + 1

        const modelsUsed = JSON.parse(summaryUpdate[0].modelsUsed);
        expect(modelsUsed['gpt-4o-mini']).toBe(4); // 3 + 1
      });

      await trackApiUsage({
        userId: 'user123',
        conversationId: 'conv123',
        messageId: 'msg123',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 100,
      });
    });

    it('should record negative battery transaction for usage', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
      };

      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockUserBattery),
          }),
        }),
      });

      let batteryTransaction: {
        userId: string;
        type: string;
        amount: number;
        balanceAfter: number;
        description: string;
      } | null = null;

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          insert: vi.fn().mockImplementation(() => ({
            values: vi.fn().mockImplementation((values) => {
              // Capture battery transaction
              if (values.type === 'usage') {
                batteryTransaction = values;
              }
              return Promise.resolve({});
            }),
          })),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue(null),
              }),
            }),
          }),
        };
        await fn(tx);
      });

      await trackApiUsage({
        userId: 'user123',
        conversationId: 'conv123',
        messageId: 'msg123',
        model: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 100,
      });

      expect(batteryTransaction).toBeDefined();
      expect(batteryTransaction!.userId).toBe('user123');
      expect(batteryTransaction!.type).toBe('usage');
      expect(batteryTransaction!.amount).toBe(-10); // Negative for deduction
      expect(batteryTransaction!.balanceAfter).toBe(990);
      expect(batteryTransaction!.description).toContain('gpt-4o');
      expect(batteryTransaction!.description).toContain('200 tokens');
    });
  });

  describe('checkBatteryBalance', () => {
    it('should correctly check if user has sufficient balance', async () => {
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              userId: 'user123',
              totalBalance: 1000,
              dailyAllowance: 200,
            }),
          }),
        }),
      });

      vi.mocked(calculateBatteryUsage).mockReturnValue(5);

      const result = await checkBatteryBalance('user123', 'gpt-4o-mini', 500);

      expect(result.hasBalance).toBe(true);
      expect(result.currentBalance).toBe(1000);
      expect(result.estimatedCost).toBe(5);
      expect(result.dailyAllowance).toBe(200);
    });

    it('should return false when balance is insufficient', async () => {
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              userId: 'user123',
              totalBalance: 3,
              dailyAllowance: 0,
            }),
          }),
        }),
      });

      vi.mocked(calculateBatteryUsage).mockReturnValue(5);

      const result = await checkBatteryBalance('user123', 'gpt-4o-mini', 500);

      expect(result.hasBalance).toBe(false);
      expect(result.currentBalance).toBe(3);
      expect(result.estimatedCost).toBe(5);
    });

    it('should handle missing user battery record', async () => {
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(null),
          }),
        }),
      });

      const result = await checkBatteryBalance('user123', 'gpt-4o-mini', 500);

      expect(result.hasBalance).toBe(false);
      expect(result.currentBalance).toBe(0);
      expect(result.estimatedCost).toBe(0);
    });
  });

  describe('resetDailyBatteryAllowances', () => {
    it('should add daily allowance to users with active subscriptions', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const usersWithAllowances = [
        {
          userId: 'user1',
          dailyAllowance: 200,
          lastReset: yesterday,
        },
        {
          userId: 'user2',
          dailyAllowance: 600,
          lastReset: yesterday,
        },
      ];

      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(usersWithAllowances),
        }),
      });

      // Mock updated balances after reset
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ totalBalance: 1200 }), // user1
          }),
        }),
      });

      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ totalBalance: 2600 }), // user2
          }),
        }),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      mockInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const result = await resetDailyBatteryAllowances();

      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(2);

      // Verify updates were called for each user
      expect(mockUpdate).toHaveBeenCalledTimes(2);

      // Verify battery transactions were recorded
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it("should not reset users who already received today's allowance", async () => {
      const today = new Date().toISOString().split('T')[0];

      const usersWithAllowances = [
        {
          userId: 'user1',
          dailyAllowance: 200,
          lastReset: today, // Already reset today
        },
      ];

      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(usersWithAllowances),
        }),
      });

      const result = await resetDailyBatteryAllowances();

      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(1);

      // No updates should be made
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const result = await resetDailyBatteryAllowances();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
