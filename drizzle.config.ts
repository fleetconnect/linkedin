import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

// Print DATABASE_URL for debugging (safely masked)
const maskedUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')
  : 'NOT FOUND';
console.log(`🏗️  Drizzle Push URL: ${maskedUrl}`);

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  }
} satisfies Config;
