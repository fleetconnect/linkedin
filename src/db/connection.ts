/**
 * PostgreSQL Database Connection
 *
 * Uses connection pooling for production.
 * Drizzle ORM for type-safe queries.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Database configuration from environment
 * Supports both DATABASE_URL (Render/Heroku) and individual env vars
 */
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'linkedin_outreach',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
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
