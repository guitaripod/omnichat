declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Clerk (these are available in process.env)
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;

      // Note: In Cloudflare Pages, secrets and bindings are accessed
      // via getRequestContext().env, not process.env
    }
  }
}

// Cloudflare environment interface
export interface CloudflareEnv {
  // Secrets
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_API_KEY: string;
  XAI_API_KEY: string;

  // Bindings
  DB: D1Database;
}

export {};
