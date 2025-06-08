import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './migrations',
  driver: 'd1-http',
  dialect: 'sqlite',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'local',
    databaseId: process.env.DATABASE_ID || 'local',
    token: process.env.CLOUDFLARE_API_TOKEN || 'local',
  },
} satisfies Config;
