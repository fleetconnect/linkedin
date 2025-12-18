-- Canonical Lead Schema
-- Single source of truth for all lead data

CREATE TABLE IF NOT EXISTS leads (
  lead_id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'new',
  campaign_id TEXT,

  -- Raw input data (as received)
  raw_input TEXT, -- JSON

  -- Normalized data
  normalized TEXT, -- JSON

  -- Scoring data
  score TEXT, -- JSON

  -- Messages sent to this lead
  messages TEXT DEFAULT '[]', -- JSON array

  -- Conversation history
  conversation TEXT DEFAULT '[]', -- JSON array

  -- Outcomes and notes
  outcomes TEXT DEFAULT '{}', -- JSON

  -- Memory references (for future RAG integration)
  memory_refs TEXT DEFAULT '[]', -- JSON array

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),

  -- State validation check
  CHECK (state IN ('new', 'normalized', 'scored', 'qualified', 'active', 'paused', 'booked', 'disqualified', 'archived'))
);

-- Campaign Schema
-- Configuration for each outreach campaign

CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',

  -- ICP (Ideal Customer Profile) configuration
  icp_config TEXT, -- JSON: { titles: [], industries: [], company_size: [] }

  -- Scoring rules
  scoring_rules TEXT, -- JSON: { thresholds: {}, disqualifiers: [] }

  -- Messaging rules
  messaging_rules TEXT, -- JSON: { tone: 'direct|neutral', channel: 'linkedin|email', cta_constraints: {} }

  -- License tier
  license_tier TEXT DEFAULT 'operator',

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Status validation check
  CHECK (status IN ('active', 'paused', 'archived')),

  -- License tier validation check
  CHECK (license_tier IN ('operator', 'partner', 'enterprise'))
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(state);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
