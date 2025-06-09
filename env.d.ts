declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // API Keys
      OPENAI_API_KEY: string;
      ANTHROPIC_API_KEY: string;
      GOOGLE_API_KEY: string;

      // Cloudflare Bindings
      DB: D1Database;

      // Clerk
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
    }
  }
}

export {};
