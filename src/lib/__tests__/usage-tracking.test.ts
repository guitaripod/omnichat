import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackApiUsage, checkBatteryBalance, resetDailyBatteryAllowances } from '../usage-tracking';
import { calculateBatteryUsage } from '../battery-pricing';

// Mock database operations
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

// Setup chained mock returns
const setupSelectMock = (returnValue: any) => {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(returnValue),
      }),
    }),
  });
};

const setupInsertMock = () => {
  mockDb.insert.mockReturnValue({
    values: vi.fn().mockResolvedValue({}),
    onConflictDoNothing: vi.fn().mockResolvedValue({}),
  });
};

const setupUpdateMock = () => {
  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  });
};

vi.mock('@/lib/db', () => ({
  db: vi.fn(() => mockDb),
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

    // Setup default mocks
    setupSelectMock(null);
    setupInsertMock();
    setupUpdateMock();
  });

  describe('trackApiUsage', () => {
    it('should deduct battery correctly for a simple API call', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
        lastDailyReset: '2024-01-01',
      };

      // First call returns user battery, subsequent calls return null for daily summary
      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return Promise.resolve(mockUserBattery);
              }
              return Promise.resolve(null); // No existing daily summary
            }),
          }),
        }),
      }));

      setupInsertMock();
      setupUpdateMock();

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

      // Verify database calls
      expect(mockDb.insert).toHaveBeenCalledTimes(3); // API usage, battery transaction, daily summary
      expect(mockDb.update).toHaveBeenCalledTimes(1); // Battery balance update
    });

    it('should reject usage when insufficient battery balance', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 5, // Only 5 units left
        dailyAllowance: 0,
        lastDailyReset: '2024-01-01',
      };

      setupSelectMock(mockUserBattery);

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
        lastDailyReset: '2024-01-01',
      };

      // Mock different pricing for cached vs uncached
      vi.mocked(calculateBatteryUsage).mockImplementation(
        (model: string, input: number, output: number, useCache?: boolean) => {
          if (useCache) return 3; // Cheaper when cached
          return 10; // Normal price
        }
      );

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return Promise.resolve(mockUserBattery);
              }
              return Promise.resolve(null);
            }),
          }),
        }),
      }));

      setupInsertMock();
      setupUpdateMock();

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
        lastDailyReset: '2024-01-01',
      };

      const existingSummary = {
        id: 'summary123',
        totalBatteryUsed: 50,
        totalMessages: 5,
        modelsUsed: JSON.stringify({ 'gpt-4o-mini': 3, 'claude-opus': 2 }),
      };

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return Promise.resolve(mockUserBattery);
              }
              return Promise.resolve(existingSummary); // Existing daily summary
            }),
          }),
        }),
      }));

      setupInsertMock();

      const updateCalls: any[] = [];
      mockDb.update.mockImplementation((table) => {
        return {
          set: vi.fn((data) => {
            updateCalls.push({ table, data });
            return {
              where: vi.fn().mockResolvedValue({}),
            };
          }),
        };
      });

      await trackApiUsage({
        userId: 'user123',
        conversationId: 'conv123',
        messageId: 'msg123',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 100,
      });

      // Should update battery balance and daily summary
      expect(mockDb.update).toHaveBeenCalledTimes(2);

      // Verify daily summary was updated
      const summaryUpdate = updateCalls.find((call) => call.data.totalBatteryUsed !== undefined);
      expect(summaryUpdate).toBeDefined();
      expect(summaryUpdate.data.totalBatteryUsed).toBe(60); // 50 + 10
      expect(summaryUpdate.data.totalMessages).toBe(6); // 5 + 1
    });

    it('should record negative battery transaction for usage', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
        lastDailyReset: '2024-01-01',
      };

      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return Promise.resolve(mockUserBattery);
              }
              return Promise.resolve(null);
            }),
          }),
        }),
      }));

      const insertCalls: any[] = [];
      mockDb.insert.mockImplementation((table) => ({
        values: vi.fn((data) => {
          insertCalls.push({ table, data });
          return Promise.resolve({});
        }),
      }));

      setupUpdateMock();

      await trackApiUsage({
        userId: 'user123',
        conversationId: 'conv123',
        messageId: 'msg123',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 100,
      });

      // Find the battery transaction insert
      const batteryTransaction = insertCalls.find((call) => call.data.type === 'usage');

      expect(batteryTransaction).toBeDefined();
      expect(batteryTransaction.data.amount).toBe(-10); // Negative for usage
      expect(batteryTransaction.data.balanceAfter).toBe(990);
    });
  });

  describe('checkBatteryBalance', () => {
    it('should return correct battery check for sufficient balance', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 1000,
        dailyAllowance: 200,
        lastDailyReset: '2024-01-01',
      };

      setupSelectMock(mockUserBattery);

      const result = await checkBatteryBalance('user123', 'gpt-4o-mini');

      expect(result.hasBalance).toBe(true);
      expect(result.currentBalance).toBe(1000);
      expect(result.estimatedCost).toBe(10);
    });

    it('should return false for insufficient balance', async () => {
      const mockUserBattery = {
        userId: 'user123',
        totalBalance: 5,
        dailyAllowance: 0,
        lastDailyReset: '2024-01-01',
      };

      setupSelectMock(mockUserBattery);

      const result = await checkBatteryBalance('user123', 'gpt-4o-mini');

      expect(result.hasBalance).toBe(false);
      expect(result.currentBalance).toBe(5);
      expect(result.estimatedCost).toBe(10);
    });

    it('should create default battery record for new users', async () => {
      setupSelectMock(null); // No existing record
      setupInsertMock();

      const result = await checkBatteryBalance('user123', 'gpt-4o-mini');

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.hasBalance).toBe(false);
      expect(result.currentBalance).toBe(0);
    });
  });

  describe('resetDailyBatteryAllowances', () => {
    it('should reset daily allowances correctly', async () => {
      const usersWithAllowances = [
        { userId: 'user1', dailyAllowance: 200, lastReset: '2024-01-01' },
        { userId: 'user2', dailyAllowance: 500, lastReset: '2024-01-01' },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(usersWithAllowances),
        }),
      });

      setupUpdateMock();
      setupInsertMock();

      // Mock the updated balance query
      setupSelectMock({ totalBalance: 1200 });

      const result = await resetDailyBatteryAllowances();

      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(2);
      expect(mockDb.update).toHaveBeenCalledTimes(2); // Once for each user
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // Battery transactions
    });
  });
});
