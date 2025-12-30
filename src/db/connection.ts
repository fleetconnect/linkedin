/**
 * PostgreSQL Database Connection
 *
 * Uses connection pooling for production.
 * Drizzle ORM for type-safe queries.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
// Force bypass of SSL certificate validation for self-signed certificates
// This handles the "self-signed certificate in certificate chain" error common with DigitalOcean/Neon
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Print DATABASE_URL for debugging (safely masked)
const maskedUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')
  : 'NOT FOUND';
console.log(`🔌 Database URL: ${maskedUrl}`);

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Database configuration from environment
 * optimized for Neon and other managed PostgreSQL providers.
 */
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // rejectUnauthorized: false is REQUIRED for DigitalOcean and Neon to avoid "self-signed certificate" errors
  ssl: {
    rejectUnauthorized: false,
  },
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

/**
 * PostgreSQL connection pool
 */
export const pool = new Pool(dbConfig);

/**
 * Drizzle ORM instance
 */
export const db = drizzle(pool, { schema });

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection pool
 * Call this on graceful shutdown
 */
export async function closeConnection(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}

export default db;
