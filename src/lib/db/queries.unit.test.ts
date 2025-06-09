import { describe, it, expect, vi } from 'vitest';
import {
  getUserByClerkId,
  createUser,
  getUserConversations,
  createConversation,
  getConversationMessages,
  createMessage,
  trackApiUsage,
  getUserUsageToday,
  createOrUpdateSubscription,
} from './queries';
import type { Db } from './client';

/**
 * Unit tests using mocks - fast and focused on business logic
 * These tests verify that our functions call the database correctly
 * without actually hitting a real database.
 */

describe('Database Queries - Unit Tests', () => {
  const createMockDb = () => {
    const chainMock = {
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      insert: vi.fn(),
      values: vi.fn(),
      returning: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
    };

    // Make each method return the chain for fluent API
    Object.keys(chainMock).forEach((key) => {
      (chainMock as any)[key].mockReturnValue(chainMock);
    });

    // Terminal methods return promises
    chainMock.limit.mockResolvedValue([]);
    chainMock.orderBy.mockResolvedValue([]);
    chainMock.returning.mockResolvedValue([{ id: 'mock_id' }]);
    chainMock.where.mockImplementation(() => chainMock);

    return chainMock as unknown as Db;
  };

  describe('User Operations', () => {
    it('should create user with generated ID', async () => {
      const db = createMockDb();
      const mockUser = {
        id: 'generated_id',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(db.returning).mockResolvedValueOnce([mockUser]);

      const user = await createUser(db, {
        clerkId: 'clerk_123',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });

    it('should handle getUserByClerkId with null result', async () => {
      const db = createMockDb();
      vi.mocked(db.limit).mockResolvedValueOnce([]);

      const user = await getUserByClerkId(db, 'non_existent');

      expect(db.select).toHaveBeenCalled();
      expect(user).toBeNull();
    });
  });

  describe('Conversation Operations', () => {
    it('should create conversation and update timestamp on message', async () => {
      const db = createMockDb();

      // Mock conversation creation
      const mockConversation = {
        id: 'conv_123',
        userId: 'user_123',
        title: 'Test Chat',
        model: 'gpt-4o',
      };
      vi.mocked(db.returning).mockResolvedValueOnce([mockConversation]);

      const conversation = await createConversation(db, {
        userId: 'user_123',
        title: 'Test Chat',
        model: 'gpt-4o',
      });

      expect(conversation).toEqual(mockConversation);

      // Mock message creation
      const mockMessage = {
        id: 'msg_123',
        conversationId: 'conv_123',
        role: 'user',
        content: 'Hello',
      };

      vi.mocked(db.returning)
        .mockResolvedValueOnce([mockMessage]) // For insert
        .mockResolvedValueOnce([]); // For update

      await createMessage(db, {
        conversationId: 'conv_123',
        role: 'user',
        content: 'Hello',
      });

      // Verify both insert and update were called
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Usage Tracking', () => {
    it('should track API usage', async () => {
      const db = createMockDb();

      await trackApiUsage(db, {
        userId: 'user_123',
        model: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 200,
        cost: 0.03,
      });

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
    });

    it('should calculate daily usage correctly', async () => {
      const db = createMockDb();

      // Mock aggregate select
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ totalMessages: 5, totalCost: 0.15 }])),
        })),
      }));

      (db as any).select = mockSelect;

      const usage = await getUserUsageToday(db, 'user_123');

      expect(usage.totalMessages).toBe(5);
      expect(usage.totalCost).toBe(0.15);
    });
  });

  describe('Subscription Management', () => {
    it('should create new subscription when none exists', async () => {
      const db = createMockDb();

      // Mock no existing subscription
      vi.mocked(db.limit).mockResolvedValueOnce([]);

      // Mock new subscription creation
      const newSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        tier: 'pro',
        status: 'active',
      };
      vi.mocked(db.returning).mockResolvedValueOnce([newSubscription]);

      const result = await createOrUpdateSubscription(db, {
        userId: 'user_123',
        stripeSubscriptionId: 'stripe_sub_123',
        stripePriceId: 'price_123',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        tier: 'pro',
      });

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(newSubscription);
    });

    it('should update existing subscription', async () => {
      const db = createMockDb();

      // Mock existing subscription
      const existingSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        tier: 'free',
      };
      vi.mocked(db.limit).mockResolvedValueOnce([existingSubscription]);

      // Mock updated subscription
      const updatedSubscription = {
        ...existingSubscription,
        tier: 'ultimate',
        status: 'active',
      };
      vi.mocked(db.returning).mockResolvedValueOnce([updatedSubscription]);

      const result = await createOrUpdateSubscription(db, {
        userId: 'user_123',
        stripeSubscriptionId: 'stripe_sub_123',
        stripePriceId: 'price_ultimate',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        tier: 'ultimate',
      });

      expect(db.update).toHaveBeenCalled();
      expect(result.tier).toBe('ultimate');
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate database errors', async () => {
      const db = createMockDb();
      const dbError = new Error('Connection timeout');
      vi.mocked(db.returning).mockRejectedValueOnce(dbError);

      await expect(
        createUser(db, {
          clerkId: 'test',
          email: 'test@example.com',
        })
      ).rejects.toThrow('Connection timeout');
    });

    it('should handle empty results gracefully', async () => {
      const db = createMockDb();

      // All queries return empty
      vi.mocked(db.limit).mockResolvedValue([]);
      vi.mocked(db.orderBy).mockResolvedValue([]);
      vi.mocked(db.where).mockImplementation(() => {
        const emptyChain = { ...db };
        vi.mocked(emptyChain.limit).mockResolvedValue([]);
        vi.mocked(emptyChain.orderBy).mockResolvedValue([]);
        return emptyChain;
      });

      const user = await getUserByClerkId(db, 'any_id');
      expect(user).toBeNull();

      const conversations = await getUserConversations(db, 'any_id');
      expect(conversations).toEqual([]);

      const messages = await getConversationMessages(db, 'any_id');
      expect(messages).toEqual([]);
    });
  });
});
