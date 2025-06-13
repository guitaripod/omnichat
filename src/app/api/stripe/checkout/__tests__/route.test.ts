import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock Stripe
const mockCheckoutSessionCreate = vi.fn();
const mockCustomerCreate = vi.fn();
const mockSubscriptionsList = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCheckoutSessionCreate,
        },
      },
      customers: {
        create: mockCustomerCreate,
      },
      subscriptions: {
        list: mockSubscriptionsList,
      },
    })),
  };
});

// Mock database functions
const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();

vi.mock('@/lib/db/index', () => ({
  db: vi.fn(() => ({
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  })),
}));

// Mock environment variables
const originalEnv = process.env;

describe('Stripe Checkout Route - Session Creation and Pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_123',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      CLERK_SECRET_KEY: 'test_clerk_key',
      // Mock price IDs for each plan
      STRIPE_PRICE_STARTER_MONTHLY: 'price_starter_monthly',
      STRIPE_PRICE_STARTER_ANNUAL: 'price_starter_annual',
      STRIPE_PRICE_DAILY_MONTHLY: 'price_daily_monthly',
      STRIPE_PRICE_DAILY_ANNUAL: 'price_daily_annual',
      STRIPE_PRICE_POWER_MONTHLY: 'price_power_monthly',
      STRIPE_PRICE_POWER_ANNUAL: 'price_power_annual',
      STRIPE_PRICE_ULTIMATE_MONTHLY: 'price_ultimate_monthly',
      STRIPE_PRICE_ULTIMATE_ANNUAL: 'price_ultimate_annual',
      // Mock battery pack price IDs
      STRIPE_PRICE_BATTERY_1000: 'price_battery_1000',
      STRIPE_PRICE_BATTERY_5000: 'price_battery_5000',
      STRIPE_PRICE_BATTERY_15000: 'price_battery_15000',
      STRIPE_PRICE_BATTERY_50000: 'price_battery_50000',
    };

    // Default mock implementations
    mockAuth.mockResolvedValue({ userId: 'test_user_123' });

    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'test_user_123',
            clerkId: 'test_user_123',
            email: 'test@example.com',
            name: 'Test User',
            stripeCustomerId: 'cus_test123',
          }),
        }),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'test_user_123',
            email: 'test@example.com',
            name: 'Test User',
          }),
        }),
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
      }),
    });

    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Subscription Checkout', () => {
    it('should create checkout session for Starter plan (monthly)', async () => {
      const { POST } = await import('../route');

      mockCheckoutSessionCreate.mockResolvedValue({
        id: 'cs_test_starter_monthly',
        url: 'https://checkout.stripe.com/starter_monthly',
      });

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription',
          planId: 'starter',
          isAnnual: false,
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { sessionId: string; url: string };

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_starter_monthly');
      expect(data.url).toBe('https://checkout.stripe.com/starter_monthly');

      // Verify checkout session was created with correct parameters
      expect(mockCheckoutSessionCreate).toHaveBeenCalledWith({
        customer: 'cus_test123',
        success_url: 'https://example.com/billing/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://example.com/pricing',
        metadata: {
          userId: 'test_user_123',
          type: 'subscription',
        },
        mode: 'subscription',
        line_items: [
          {
            price: 'price_starter_monthly',
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            userId: 'test_user_123',
            planId: 'starter',
          },
        },
        allow_promotion_codes: true,
      });
    });

    it('should create checkout session for Ultimate plan (annual with 20% discount)', async () => {
      const { POST } = await import('../route');

      mockCheckoutSessionCreate.mockResolvedValue({
        id: 'cs_test_ultimate_annual',
        url: 'https://checkout.stripe.com/ultimate_annual',
      });

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription',
          planId: 'ultimate',
          isAnnual: true,
        }),
      });

      const response = await POST(req);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_ultimate_annual',
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata: {
              userId: 'test_user_123',
              planId: 'ultimate',
            },
          },
        })
      );
    });

    it('should reject invalid plan ID', async () => {
      const { POST } = await import('../route');

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription',
          planId: 'invalid_plan',
          isAnnual: false,
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to get price for plan');
    });
  });

  describe('Battery Pack Checkout', () => {
    it('should create checkout session for 1,000 battery units ($1.49)', async () => {
      const { POST } = await import('../route');

      mockCheckoutSessionCreate.mockResolvedValue({
        id: 'cs_test_battery_1000',
        url: 'https://checkout.stripe.com/battery_1000',
      });

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: 1000,
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { sessionId: string; url: string };

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_battery_1000');

      expect(mockCheckoutSessionCreate).toHaveBeenCalledWith({
        customer: 'cus_test123',
        success_url: 'https://example.com/billing/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://example.com/pricing',
        metadata: {
          userId: 'test_user_123',
          type: 'battery',
        },
        mode: 'payment',
        line_items: [
          {
            price: 'price_battery_1000',
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            userId: 'test_user_123',
            batteryUnits: '1000',
          },
        },
      });
    });

    it('should create checkout session for 50,000 battery units ($44.99)', async () => {
      const { POST } = await import('../route');

      mockCheckoutSessionCreate.mockResolvedValue({
        id: 'cs_test_battery_50000',
        url: 'https://checkout.stripe.com/battery_50000',
      });

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: 50000,
        }),
      });

      const response = await POST(req);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_battery_50000',
              quantity: 1,
            },
          ],
          payment_intent_data: {
            metadata: {
              userId: 'test_user_123',
              batteryUnits: '50000',
            },
          },
        })
      );
    });

    it('should reject invalid battery unit amounts', async () => {
      const { POST } = await import('../route');

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'battery',
          batteryUnits: 999, // Invalid amount
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(data.error).toBe('Failed to get price for battery pack');
    });
  });

  describe('Customer Creation', () => {
    it('should create new Stripe customer if not exists', async () => {
      const { POST } = await import('../route');

      // Mock user without stripeCustomerId
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              id: 'test_user_123',
              clerkId: 'test_user_123',
              email: 'newuser@example.com',
              name: 'New User',
              stripeCustomerId: null,
            }),
          }),
        }),
      });

      mockCustomerCreate.mockResolvedValue({
        id: 'cus_new_customer',
      });

      mockCheckoutSessionCreate.mockResolvedValue({
        id: 'cs_test_new_customer',
        url: 'https://checkout.stripe.com/new_customer',
      });

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription',
          planId: 'starter',
          isAnnual: false,
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Verify customer was created
      expect(mockCustomerCreate).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        name: 'New User',
        metadata: {
          clerkId: 'test_user_123',
          userId: 'test_user_123',
        },
      });

      // Verify database was updated with customer ID
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_new_customer',
        })
      );
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const { POST } = await import('../route');

      mockAuth.mockResolvedValue({ userId: null });

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription',
          planId: 'starter',
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      const { POST } = await import('../route');

      mockCheckoutSessionCreate.mockRejectedValue(new Error('Stripe API error'));

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'subscription',
          planId: 'starter',
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(data.error).toBe('Stripe error: Stripe API error');
    });

    it('should reject invalid checkout types', async () => {
      const { POST } = await import('../route');

      const req = new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid_type',
        }),
      });

      const response = await POST(req);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid checkout type');
    });
  });
});
