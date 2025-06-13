import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock stripe constructEvent function
const mockConstructEvent = vi.fn();

// Mock subscription retrieve function
const mockSubscriptionRetrieve = vi.fn();

// Mock the stripe module
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
      subscriptions: {
        retrieve: mockSubscriptionRetrieve,
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

describe('Stripe Webhook Route - Signature Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_123',
    };

    // Reset database mocks
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(null),
        }),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue({}),
      }),
    });

    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'user123',
              tier: 'power',
            },
          ]),
        }),
      }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should reject requests without stripe-signature header', async () => {
    // Dynamically import the route after mocks are set up
    const { POST } = await import('../route');

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'test' }),
    });

    const response = await POST(req);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('No signature');
  });

  it('should reject requests with invalid signature', async () => {
    const { POST } = await import('../route');

    const payload = JSON.stringify({ type: 'checkout.session.completed' });

    // Mock constructEvent to throw an error for invalid signature
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': 'invalid_signature',
      },
    });

    const response = await POST(req);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid signature');
    expect(mockConstructEvent).toHaveBeenCalledWith(
      payload,
      'invalid_signature',
      'whsec_test_secret_123'
    );
  });

  it('should accept requests with valid signature and process subscription', async () => {
    const { POST } = await import('../route');

    const validEvent = {
      id: 'evt_test123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          mode: 'subscription',
          customer: 'cus_test123',
          subscription: 'sub_test123',
          metadata: {
            userId: 'user123',
          },
        },
      },
    };

    const payload = JSON.stringify(validEvent);
    const validSignature = 'v1,t=1234567890,sig=valid_stripe_signature';

    // Mock constructEvent to return the valid event
    mockConstructEvent.mockReturnValue(validEvent);

    // Mock subscription retrieval
    mockSubscriptionRetrieve.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      metadata: { planId: 'starter', userId: 'user123' },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });

    // Mock user lookup
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'user123',
            clerkId: 'user123',
            email: 'test@example.com',
          }),
        }),
      }),
    });

    // Mock database queries for plan lookup
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'starter',
            name: 'Starter',
            dailyBattery: 200,
            batteryUnits: 6000,
          }),
        }),
      }),
    });

    // Mock battery balance lookup
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            totalBalance: 6000,
          }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': validSignature,
      },
    });

    const response = await POST(req);
    const data = (await response.json()) as { received: boolean };

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockConstructEvent).toHaveBeenCalledWith(
      payload,
      validSignature,
      'whsec_test_secret_123'
    );
  });

  it('should handle webhook processing errors gracefully', async () => {
    const { POST } = await import('../route');

    const validEvent = {
      id: 'evt_test123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          mode: 'subscription',
          subscription: 'sub_test123',
          metadata: {
            userId: 'user123',
          },
        },
      },
    };

    const payload = JSON.stringify(validEvent);
    const validSignature = 'valid_stripe_signature';

    mockConstructEvent.mockReturnValue(validEvent);

    // Mock user lookup
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'user123',
            clerkId: 'user123',
            email: 'test@example.com',
          }),
        }),
      }),
    });

    // Mock subscription retrieval to throw an error
    mockSubscriptionRetrieve.mockRejectedValue(new Error('Stripe API error'));

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': validSignature,
      },
    });

    const response = await POST(req);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook handler failed');
  });

  it('should prevent replay attacks by validating timestamp in signature', async () => {
    const { POST } = await import('../route');

    const payload = JSON.stringify({ type: 'checkout.session.completed' });

    // Mock constructEvent to throw a specific error for timestamp validation
    mockConstructEvent.mockImplementation(() => {
      const error = new Error('Timestamp outside tolerance zone');
      error.name = 'StripeSignatureVerificationError';
      throw error;
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': 'v1,t=1234567890,sig=old_signature',
      },
    });

    const response = await POST(req);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid signature');
  });

  it('should handle battery purchase webhook correctly', async () => {
    const { POST } = await import('../route');

    const validEvent = {
      id: 'evt_test123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          mode: 'payment',
          payment_intent: 'pi_test123',
          metadata: {
            userId: 'user123',
            batteryUnits: '5000',
          },
        },
      },
    };

    const payload = JSON.stringify(validEvent);
    const validSignature = 'valid_stripe_signature';

    mockConstructEvent.mockReturnValue(validEvent);

    // Mock user lookup
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 'user123',
            clerkId: 'user123',
            email: 'test@example.com',
          }),
        }),
      }),
    });

    // Mock battery balance lookup
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            userId: 'user123',
            totalBalance: 5000,
            dailyAllowance: 0,
          }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': validSignature,
      },
    });

    const response = await POST(req);
    const data = (await response.json()) as { received: boolean };

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);

    // Verify battery update was called
    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockDbInsert).toHaveBeenCalled();
  });
});
