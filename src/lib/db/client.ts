import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// D1Database types are now provided by @cloudflare/workers-types

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof getDb>;
