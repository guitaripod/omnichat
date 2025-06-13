// Client-side configuration loader for Cloudflare Pages
// This handles the issue where NEXT_PUBLIC_ env vars aren't available at runtime

interface ClientConfig {
  stripe: {
    publishableKey: string;
  };
  clerk: {
    publishableKey: string;
  };
  app: {
    url: string;
    environment: string;
  };
}

let cachedConfig: ClientConfig | null = null;

export async function getClientConfig(): Promise<ClientConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // Fetch configuration from API
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }

    cachedConfig = await response.json();
    console.log('[Client Config] Loaded configuration');
    return cachedConfig!;
  } catch (error) {
    console.error('[Client Config] Failed to load configuration:', error);

    // Fallback to process.env (works in development)
    cachedConfig = {
      stripe: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      },
      clerk: {
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      },
      app: {
        url: process.env.NEXT_PUBLIC_APP_URL || '',
        environment: process.env.NODE_ENV || 'development',
      },
    };

    return cachedConfig;
  }
}

// Helper to get Stripe publishable key
export async function getStripePublishableKey(): Promise<string> {
  const config = await getClientConfig();
  return config.stripe.publishableKey;
}
