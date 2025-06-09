import { getDb } from './client';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { CloudflareEnv } from '../../../env';

/**
 * Get the D1 database instance from Cloudflare bindings
 * This function must be called within an API route handler with runtime = 'edge'
 */
export function getD1Database() {
  try {
    // In Cloudflare Pages, bindings are accessed via getRequestContext
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    if (env.DB) {
      return getDb(env.DB);
    }
  } catch {
    // Fallback for local development
    if (process.env.DB) {
      return getDb(process.env.DB as unknown as D1Database);
    }
  }

  throw new Error(
    'D1 database binding not found. Make sure DB is configured in Cloudflare dashboard'
  );
}
