import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

// Force SSL bypass for migrations
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  }
} satisfies Config;
