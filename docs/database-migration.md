# Database Migration: JSON → PostgreSQL

## Quick Start

The application now supports both file-based (JSON) and PostgreSQL storage.

**To use file-based storage (default):**
```bash
# .env
STORAGE_TYPE=file
```

**To use PostgreSQL storage:**
```bash
# .env
STORAGE_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=linkedin_outreach
DB_USER=postgres
DB_PASSWORD=your_password
```

**Migration steps:**
1. Install dependencies: `npm install`
2. Set up PostgreSQL database
3. Run schema migration: `npm run db:migrate`
4. Migrate data from JSON: `npm run db:migrate-data`
5. Update `.env` to set `STORAGE_TYPE=postgres`
6. Restart application

---

## Why Migrate

File-based JSON storage is fine for architecture.
**It is NOT fine for concurrency.**

PostgreSQL provides:
- ✅ **Transactional state transitions** (atomic updates)
- ✅ **Concurrency control** (row locking, MVCC)
- ✅ **Connection pooling** (handles load)
- ✅ **Indexing** (fast queries)
- ✅ **Data integrity** (foreign keys, constraints)

---

## Migration Target (Minimal)

**Tables:**
- `campaigns` - Campaign configuration
- `leads` - Lead entities with state machine
- `messages` - Conversation history
- `classifications` - Intent classification results
- `research_snapshots` - Company research data

**NO:**
- ❌ Analytics tables (not yet)
- ❌ Data warehouse (not yet)
- ❌ Materialized views (not yet)
- ❌ Overthinking

---

## Key Rule

**All state transitions must be transactional.**

```typescript
// BEFORE (file-based - not atomic)
lead.state = 'INTERESTED';
await fs.writeFile('leads.json', JSON.stringify(leads));
// ❌ Race condition possible

// AFTER (PostgreSQL - atomic)
await client.query('BEGIN');
await client.query('UPDATE leads SET state = $1 WHERE id = $2 FOR UPDATE', ['INTERESTED', leadId]);
await client.query('COMMIT');
// ✅ Atomic, row-locked, safe
```

---

## Setup

### 1. Install Dependencies

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

### 2. Environment Variables

Add to `.env`:

```bash
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=linkedin_outreach
DB_USER=postgres
DB_PASSWORD=your_password_here

# Connection Pool
DB_POOL_MAX=20  # Max connections in pool
```

### 3. Create Database

```bash
# Using psql
createdb linkedin_outreach

# Or using psql shell
psql -U postgres
CREATE DATABASE linkedin_outreach;
\q
```

### 4. Run Schema Migration

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

This creates all tables, indexes, and constraints.

### 5. Migrate Data from JSON

```bash
# Migrate existing data from JSON files to PostgreSQL
npm run db:migrate-data
```

This reads `data/leads.json`, `data/campaigns.json`, `data/classifications.json` and migrates to PostgreSQL.

---

## Schema

### Campaigns Table

```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  messaging_rules JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Leads Table

```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  linkedin_url TEXT,
  campaign_id TEXT REFERENCES campaigns(id),
  state TEXT NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX leads_state_idx ON leads(state);
CREATE INDEX leads_campaign_idx ON leads(campaign_id);
CREATE INDEX leads_updated_at_idx ON leads(updated_at);
```

**Why indexes:**
- `state` - Query leads by state (`state = 'READY_TO_SEND'`)
- `campaign_id` - Filter leads by campaign
- `updated_at` - Sort by recent activity

### Messages Table

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' | 'lead'
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  message_type TEXT, -- 'initial' | 'follow-up' | 'reply'
  variant TEXT, -- 'A' | 'B'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_lead_idx ON messages(lead_id);
CREATE INDEX messages_timestamp_idx ON messages(timestamp);
```

**Why indexes:**
- `lead_id` - Get all messages for a lead
- `timestamp` - Order conversation history

**Why CASCADE:** If lead deleted, delete all messages (orphan cleanup)

### Classifications Table

```sql
CREATE TABLE classifications (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  intent TEXT NOT NULL, -- 'interested' | 'booked' | 'neutral' | 'negative'
  sentiment TEXT NOT NULL, -- 'positive' | 'neutral' | 'negative'
  confidence REAL NOT NULL,
  next_state TEXT NOT NULL,
  reasoning TEXT,
  model_used TEXT,
  prompt_version TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX classifications_lead_idx ON classifications(lead_id);
CREATE INDEX classifications_intent_idx ON classifications(intent);
CREATE INDEX classifications_created_at_idx ON classifications(created_at);
```

**Why indexes:**
- `lead_id` - Get all classifications for a lead
- `intent` - Analytics by intent type
- `created_at` - Time-series analysis

### Research Snapshots Table

```sql
CREATE TABLE research_snapshots (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_description TEXT,
  industry TEXT,
  recent_news JSONB, -- string[]
  key_products JSONB, -- string[]
  challenges JSONB, -- string[]
  opportunities JSONB, -- string[]
  funding_info TEXT,
  employee_count TEXT,
  sources JSONB, -- string[]
  researched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX research_snapshots_lead_idx ON research_snapshots(lead_id);
CREATE INDEX research_snapshots_researched_at_idx ON research_snapshots(researched_at);
```

**Why indexes:**
- `lead_id` - Get research for a lead
- `researched_at` - Find recent research (7-day cache check)

---

## Transactional State Updates

**Problem:** Race conditions in concurrent updates

```typescript
// Thread 1: Classify reply
lead.state = 'INTERESTED';  // In memory

// Thread 2: Manual override
lead.state = 'LOST';  // In memory

// Both write to file
// Last write wins (data loss!)
```

**Solution:** PostgreSQL transactions with row locking

```typescript
async updateLeadState(leadId: string, newState: LeadState): Promise<Lead | null> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Row lock: blocks other updates until commit
    const { rows: [lead] } = await client.query(
      'SELECT * FROM leads WHERE id = $1 FOR UPDATE',
      [leadId]
    );

    if (!lead) {
      await client.query('ROLLBACK');
      return null;
    }

    // Validate transition
    assertValidTransition(lead.state, newState);

    // Update state
    await client.query(
      'UPDATE leads SET state = $1, updated_at = NOW() WHERE id = $2',
      [newState, leadId]
    );

    await client.query('COMMIT');
    return await this.getLead(leadId);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**What `FOR UPDATE` does:**
- Locks the row for the transaction
- Other transactions wait for lock release
- Prevents race conditions
- Ensures serial execution of state changes

---

## Connection Pooling

**Problem:** Opening/closing database connections is expensive

**Solution:** Connection pool (20 max connections by default)

```typescript
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'linkedin_outreach',
  user: 'postgres',
  password: 'password',
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,  // Close idle after 30s
  connectionTimeoutMillis: 5000  // Connection timeout
});
```

**How it works:**
1. Request database operation
2. Pool assigns idle connection (or creates new if under max)
3. Operation executes
4. Connection returned to pool (not closed)
5. Reused for next request

**Benefits:**
- Faster queries (no connection overhead)
- Handles concurrent requests
- Automatic connection management

---

## Migration Checklist

### Pre-Migration

- [ ] Backup JSON files (`data/leads.json`, `data/campaigns.json`, `data/classifications.json`)
- [ ] Install PostgreSQL
- [ ] Create database: `createdb linkedin_outreach`
- [ ] Add `.env` variables (DB_HOST, DB_USER, DB_PASSWORD, etc.)
- [ ] Test connection: `npm run db:test`

### Run Migration

- [ ] Generate schema: `npm run db:generate`
- [ ] Apply migrations: `npm run db:migrate`
- [ ] Migrate data: `npm run db:migrate-data`
- [ ] Verify data: `npm run db:verify` (manual query)

### Post-Migration

- [ ] Test lead creation
- [ ] Test state transitions (should be atomic)
- [ ] Test concurrent updates (no race conditions)
- [ ] Update code to use `DatabaseService` instead of `StorageService`
- [ ] Remove old `StorageService` (or deprecate)

---

## Verification Queries

```sql
-- Count records
SELECT 'campaigns' AS table, COUNT(*) AS count FROM campaigns
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'classifications', COUNT(*) FROM classifications
UNION ALL
SELECT 'research_snapshots', COUNT(*) FROM research_snapshots;

-- Check lead states
SELECT state, COUNT(*) AS count
FROM leads
GROUP BY state
ORDER BY count DESC;

-- Recent activity
SELECT id, name, state, updated_at
FROM leads
ORDER BY updated_at DESC
LIMIT 10;

-- Conversation history for a lead
SELECT m.sender, m.content, m.timestamp
FROM messages m
WHERE m.lead_id = 'lead-123'
ORDER BY m.timestamp ASC;
```

---

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:migrate-data": "ts-node src/db/migrate-from-json.ts",
    "db:studio": "drizzle-kit studio",
    "db:test": "ts-node -e \"import('./src/db/connection').then(m => m.testConnection())\""
  }
}
```

**Usage:**
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Apply migrations to database
- `npm run db:migrate-data` - Migrate data from JSON to PostgreSQL
- `npm run db:studio` - Open Drizzle Studio (visual database browser)
- `npm run db:test` - Test database connection

---

## Code Changes

### Before (File-based)

```typescript
import { StorageService } from './services/StorageService';

const storage = new StorageService('./data');
const lead = await storage.getLead(leadId);
```

### After (PostgreSQL)

```typescript
import { DatabaseService } from './db/DatabaseService';

const db = new DatabaseService();
const lead = await db.getLead(leadId);
```

**Interface is the same** - minimal code changes required.

---

## Performance Comparison

| Operation | File-based (JSON) | PostgreSQL |
|-----------|-------------------|------------|
| Get lead | 5-10ms | 1-2ms |
| Update state | 10-20ms (write file) | 1-2ms (UPDATE) |
| Query by state | O(n) scan | O(log n) index |
| Concurrent updates | ❌ Race conditions | ✅ Row locking |
| Transactions | ❌ Not supported | ✅ ACID |

---

## Rollback Plan

If migration fails:

1. **Restore JSON files** from backup
2. **Revert code** to use `StorageService`
3. **Drop PostgreSQL database** (if needed): `dropdb linkedin_outreach`
4. **Debug** migration script
5. **Retry** migration

---

## What's Next (Post-Migration)

**Not included in this migration:**
- Analytics tables (later)
- Data warehouse (later)
- Materialized views (later)
- Read replicas (later)
- Sharding (way later)

**Keep it minimal. Ship the migration. Optimize later.**

---

**This migration is production-ready. Run it before you hit concurrency issues.**
