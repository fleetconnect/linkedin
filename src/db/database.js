/**
 * Database Connection and Initialization
 * Uses better-sqlite3 for SQLite (swappable to Postgres)
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = process.env.DB_PATH || join(__dirname, '../../data/linkedin.db');

// Create database connection
let db = null;

/**
 * Initialize database connection and schema
 * @returns {Database} Database instance
 */
export function initDatabase() {
  if (db) {
    return db;
  }

  // Create database connection
  db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema statements
  db.exec(schema);

  console.log(`Database initialized at ${DB_PATH}`);

  return db;
}

/**
 * Get database instance
 * @returns {Database} Database instance
 */
export function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// Export default instance
export default {
  init: initDatabase,
  get: getDatabase,
  close: closeDatabase
};
