import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock Stripe
const mockCheckoutSessionCreate = vi.fn();
const mockConstructEvent = vi.fn();
const mockSubscriptionRetrieve = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCheckoutSessionCreate,
        },
      },
      webhooks: {
        constructEvent: mockConstructEvent,
      },
      subscriptions: {
        retrieve: mockSubscriptionRetrieve,
      },
    })),
  };
});

// Mock database
const mockDb = vi.fn();

vi.mock('@/lib/db/index', () => ({
  db: mockDb,
}));

// Mock database tables
vi.mock('@/lib/db/schema', () => ({
  users: {},
  userBattery: {},
  userSubscriptions: {},
  batteryTransactions: {},
  subscriptionPlans: {},
}));

describe('Full Payment Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    process.env.STRIPE_PRICE_STARTER_MONTHLY = 'price_starter_monthly';
    process.env.STRIPE_PRICE_BATTERY_5000 = 'price_battery_5000';

    // Default auth
    mockAuth.mockResolvedValue({ userId: 'user123' });

    // Reset database mock
    mockDb.mockReturnValue({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(),
    });
  });

  describe('Battery Pack Purchase Flow', () => {
    it('should handle battery pack purchase from checkout to credit', async () => {
      const { POST: checkoutPOST } = await import('../checkout/route');

      // Reset database mock for this test
      const dbMock = mockDb();

      // Mock existing user with Stripe customer
      dbMock.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              id: 'user123',
              email: 'test@example.com',
              stripeCustomerId: 'cus_test_123',
            }),
          }),
        }),
      });

      // Mock checkout session for battery pack
      const checkoutSessionId = 'cs_battery_123';
      mockCheckoutSessionCreate.mockResolvedValue({
        id: checkoutSessionId,
        url: 'https://checkout.stripe.com/pay/cs_battery_123',
      });

      const checkoutReq = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: 5000,
        }),
      });

      const checkoutResponse = await checkoutPOST(checkoutReq);
      expect(checkoutResponse.status).toBe(200);

      // Process webhook for battery purchase
      const { POST: webhookPOST } = await import('../webhook/route');

      const webhookEvent = {
        id: 'evt_battery_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: checkoutSessionId,
            mode: 'payment',
            payment_intent: 'pi_test_123',
            metadata: {
              userId: 'user123',
              batteryUnits: '5000',
            },
          },
        },
      };

      mockConstructEvent.mockReturnValue(webhookEvent);

      // Mock battery update
      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      // Mock updated battery balance
      dbMock.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              totalBalance: 10000, // 5000 existing + 5000 purchased
            }),
          }),
        }),
      });

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const webhookReq = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const webhookResponse = await webhookPOST(webhookReq);
      expect(webhookResponse.status).toBe(200);

      // Verify battery was credited
      const updateCall = dbMock.update.mock.calls[0];
      expect(updateCall).toBeDefined();
    });
  });

  describe('Subscription Renewal Flow', () => {
    it('should add monthly battery units on subscription renewal', async () => {
      const { POST: webhookPOST } = await import('../webhook/route');

      // Reset database mock for this test
      const dbMock = mockDb();

      const renewalEvent = {
        id: 'evt_renewal_123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            billing_reason: 'subscription_cycle',
            subscription: 'sub_test_123',
            subscription_details: {
              metadata: {
                userId: 'user123',
              },
            },
          },
        },
      };

      mockConstructEvent.mockReturnValue(renewalEvent);

      // Mock subscription details
      mockSubscriptionRetrieve.mockResolvedValue({
        id: 'sub_test_123',
        metadata: { planId: 'daily', userId: 'user123' },
      });

      // Mock plan lookup
      dbMock.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              id: 'daily',
              name: 'Daily',
              batteryUnits: 18000,
            }),
          }),
        }),
      });

      // Mock battery update
      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      // Mock updated balance
      dbMock.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              totalBalance: 20000,
            }),
          }),
        }),
      });

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const webhookReq = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(renewalEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await webhookPOST(webhookReq);
      expect(response.status).toBe(200);

      // Verify battery was added
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.insert).toHaveBeenCalled();
    });
  });

  describe('Failed Payment Handling', () => {
    it('should mark subscription as past_due on payment failure', async () => {
      const { POST: webhookPOST } = await import('../webhook/route');

      // Reset database mock for this test
      const dbMock = mockDb();

      const failedPaymentEvent = {
        id: 'evt_failed_123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_failed_123',
            subscription: 'sub_test_123',
          },
        },
      };

      mockConstructEvent.mockReturnValue(failedPaymentEvent);

      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const webhookReq = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(failedPaymentEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await webhookPOST(webhookReq);
      expect(response.status).toBe(200);

      // Verify subscription status was updated
      const updateCall = dbMock.update.mock.calls[0];
      expect(updateCall).toBeDefined();

      const setCall = dbMock.update().set.mock.calls[0];
      expect(setCall[0].status).toBe('past_due');
    });
  });

  describe('Subscription Cancellation Flow', () => {
    it('should remove daily allowance when subscription is canceled', async () => {
      const { POST: webhookPOST } = await import('../webhook/route');

      // Reset database mock for this test
      const dbMock = mockDb();

      const cancelEvent = {
        id: 'evt_cancel_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            metadata: {
              userId: 'user123',
            },
          },
        },
      };

      mockConstructEvent.mockReturnValue(cancelEvent);

      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const webhookReq = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(cancelEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await webhookPOST(webhookReq);
      expect(response.status).toBe(200);

      // Verify subscription was marked as canceled
      expect(dbMock.update).toHaveBeenCalledTimes(2); // subscription + battery

      // Verify daily allowance was removed
      const batteryUpdateCall = dbMock.update().set.mock.calls[1];
      expect(batteryUpdateCall[0].dailyAllowance).toBe(0);
    });
  });
});
