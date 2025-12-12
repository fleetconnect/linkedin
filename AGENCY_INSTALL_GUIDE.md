# 🏢 Agency Install Guide

## AI Outbound Operating System - Multi-Client Deployment

This guide explains how to deploy and manage the AI Outreach Agent as a **multi-client agency install**, where you run one system that serves multiple clients with isolated configurations.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Components Built](#components-built)
4. [Client Onboarding Flow](#client-onboarding-flow)
5. [MCP Tools Reference](#mcp-tools-reference)
6. [n8n Workflows](#n8n-workflows)
7. [Deployment Checklist](#deployment-checklist)
8. [Agency Operations](#agency-operations)

---

## 🎯 System Overview

### What This Is

An **AI Outbound Operating System** that you install once and configure per-client. Each client gets:
- Their own ICP criteria
- Their own offer/messaging
- Their own HeyReach account
- Their own safety limits
- Isolated data and campaigns

### What Makes It "Agency-Ready"

- ✅ **Multi-tenant**: One system, many clients
- ✅ **Zero data bleed**: Client configs are isolated
- ✅ **Repeatable**: Standard onboarding flow
- ✅ **Scalable**: Add clients without code changes
- ✅ **Observable**: Track per-client metrics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT ONBOARDING                         │
│               (Jotform → n8n → Config Store)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  n8n ORCHESTRATION                           │
│       (Per-client workflows, calls MCP tools)                │
└────────┬────────┬─────────┬──────────┬──────────────────────┘
         │        │         │          │
    ┌────▼────┐ ┌▼──────┐ ┌▼───────┐ ┌▼─────────┐
    │ Normalize│ │ Score │ │Research│ │ Message  │
    │  Leads  │ │  ICP  │ │ (Pplx) │ │ Strategy │
    └────┬────┘ └───┬───┘ └───┬────┘ └────┬─────┘
         │          │         │           │
         └──────────┴─────────┴───────────┘
                    │
           ┌────────▼────────┐
           │  MCP SERVER     │
           │  (Shared)       │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │   HeyReach API  │
           │   (Per-client)  │
           └─────────────────┘
```

**Key Design Principles:**
1. **One MCP server** - Shared intelligence layer
2. **Many client configs** - Stored in `./config/clients/`
3. **n8n per client** - Or multi-tenant n8n with client_id routing
4. **Zero persistent data in MCP** - Stateless operations

---

## 🧩 Components Built

### 1. Client Configuration System

**Location**: `src/types/client-config.ts`, `src/core/clients/config-manager.ts`

**What It Does**:
- Defines client-specific ICP, offer, preferences, constraints
- Validates configurations before activation
- Manages client lifecycle (active/paused/archived)

**Key Types**:
```typescript
interface ClientConfig {
  client_id: string;
  client_name: string;
  icp: ClientICP; // company size, titles, industries, etc
  offer: ClientOffer; // product, value prop, outcome
  preferences: ClientPreferences; // tone, CTA style, risk tolerance
  constraints: ClientConstraints; // safety limits, message lengths
  scoring_weights: ClientScoringWeights; // how to weight ICP scoring
  thresholds: ClientThresholds; // keep/review/drop cutoffs
  heyreach: ClientHeyReachConfig; // API key, account settings
}
```

### 2. Lead Normalizer

**Location**: `src/core/agency/lead-normalizer.ts`

**What It Does**:
- Takes leads from ANY source (Sales Nav, CSV, HeyReach, Jotform, API)
- Normalizes to unified schema
- Deduplicates using email/LinkedIn URL/name+company
- Validates data quality

**Supported Sources**:
- Sales Navigator exports
- Generic CSV (auto-detects common field names)
- HeyReach API format
- Jotform submissions
- Custom API payloads

**Output**: Normalized leads with:
```typescript
interface NormalizedLead {
  lead_id: string; // Stable hash for dedup
  firstName, lastName, email, linkedInUrl;
  title, company, companySize, location, industry;
  source: string;
  status: 'new';
}
```

### 3. ICP Scorer

**Location**: `src/core/agency/icp-scorer.ts`

**What It Does**:
- Scores leads against client ICP (0-100)
- Provides breakdown: firmographic, persona, timing, risk
- Recommends: keep/review/drop
- Explains reasoning with specific match/mismatch reasons

**Scoring Components**:
- **Firmographic** (40%): company size, industry, geography, exclusions
- **Persona** (30%): title, seniority, department
- **Timing** (20%): Placeholder for research signals
- **Risk** (10%): Data quality, missing fields, personal emails

**Thresholds** (customizable per client):
- Keep: ≥70 (auto-proceed)
- Review: 55-69 (human review)
- Drop: <55 (discard)

### 4. Message Strategist

**Location**: `src/core/agency/message-strategist.ts`

**What It Does**:
- Decides messaging strategy (NOT writes copy yet)
- Picks ONE strong angle based on research
- Sets CTA style, personalization level, tone
- Returns structured strategy object

**Two-Step Process**:
1. `buildStrategy()` → Decides HOW to approach
2. `generateMessages()` → Writes actual copy

**Prevents**:
- Random personalization
- Creepy over-personalization
- Mixed messaging
- Off-brand tone

### 5. Reply Classifier

**Location**: `src/core/agency/reply-classifier.ts`

**What It Does**:
- Classifies replies: interested/timing/question/objection/not_interested/unsubscribe
- Detects sentiment: positive/neutral/negative
- Recommends next step: book_call/answer_question/nurture/close_lost/handoff
- Can draft replies based on classification

**Classification Methods**:
- AI-powered (Claude) - primary
- Rule-based fallback - if AI fails

---

## 🔄 Client Onboarding Flow

### Step 1: Capture Client Info (Jotform)

**Jotform Fields**:
```
Required:
- Client Name
- Client ID (slug, e.g., "acme-corp")
- HeyReach API Key

ICP:
- Target Company Sizes (min/max)
- Industries (multi-select)
- Geographies (multi-select)
- Target Titles (text area, comma-separated)
- Seniority Levels (VP, Director, Manager, etc.)
- Excluded Companies (text area)
- Excluded Titles (text area)

Offer:
- Product Name
- Value Proposition (textarea)
- Primary Benefit
- Target Outcome (e.g., "book discovery calls")

Preferences:
- Tone (dropdown: consultative/direct/friendly/formal)
- CTA Style (soft/direct)
- Risk Tolerance (low/medium/high)
- Aggressiveness (1-5)
```

### Step 2: Validate & Store Config (n8n Workflow 1)

**n8n Workflow**: "Client Onboarding"

```
Webhook (Jotform)
  → Parse Submission
  → HTTP Request → MCP: validate_client_config
  → IF validation.ok = false
      → Slack Alert + Stop
  → ELSE
      → Store config in ./config/clients/{client_id}.json
      → Create client folders (data/clients/{client_id}/leads, campaigns)
      → Send Slack: "✅ Client {name} installed"
      → Trigger: Setup HeyReach campaign defaults
```

### Step 3: Client Is Live

Client can now:
- Upload leads
- Run campaigns
- Get replies classified
- Access dashboard

---

## 🛠️ MCP Tools Reference

### A. Config & Normalization

#### `normalize_leads`
**Purpose**: Convert leads from any source into unified schema

**Input**:
```json
{
  "leads": [{"any": "shape"}],
  "source": "salesnav|csv|heyreach|jotform|api"
}
```

**Output**:
```json
{
  "leads": [/* normalized */],
  "stats": {
    "input_count": 100,
    "output_count": 87,
    "duplicates_removed": 10,
    "invalid_removed": 3
  }
}
```

#### `validate_client_config`
**Purpose**: Validate onboarding config before activation

**Input**:
```json
{
  "client_id": "acme",
  "client_name": "Acme Corp",
  "icp": {...},
  "offer": {...},
  "heyreach_api_key": "..."
}
```

**Output**:
```json
{
  "ok": true,
  "warnings": ["ICP persona criteria is broad"],
  "errors": [],
  "normalized_config": {...}
}
```

### B. Scoring & Cleaning

#### `score_leads_against_icp`
**Purpose**: Score and explain ICP fit

**Input**:
```json
{
  "client_id": "acme",
  "leads": [/* normalized leads */]
}
```

**Output**:
```json
{
  "scored": [{
    "lead_id": "...",
    "fit_score": 82,
    "icp_match": true,
    "reasons": ["Company size match: 250", "Title match: VP Sales"],
    "disqualifiers": [],
    "recommended_action": "keep",
    "breakdown": {
      "firmographic_score": 85,
      "persona_score": 90,
      "timing_score": 50,
      "risk_score": 100
    }
  }],
  "thresholds": {"keep": 70, "review": 55},
  "stats": {"keep_count": 45, "review_count": 12, "drop_count": 30}
}
```

#### `clean_lead_list`
**Purpose**: Apply thresholds and separate leads

**Input**:
```json
{
  "scored_leads": [/* from score_leads */],
  "policy": {
    "drop_below": 55,
    "review_range": [55, 69]
  }
}
```

**Output**:
```json
{
  "kept": [/* high-fit leads */],
  "dropped": [/* low-fit leads */],
  "review": [/* medium-fit leads */],
  "stats": {...}
}
```

### C. Messaging

#### `build_message_strategy`
**Purpose**: Decide messaging approach (not write copy yet)

**Input**:
```json
{
  "client_id": "acme",
  "lead": {/* normalized lead */},
  "fit_score": 82,
  "company_research": {/* from Perplexity */}
}
```

**Output**:
```json
{
  "primary_angle": "Recent SDR hiring indicates pipeline focus",
  "supporting_points": [
    "Company expanding sales team",
    "Role responsible for pipeline"
  ],
  "cta_style": "soft",
  "sequence_type": "connect_then_dm",
  "personalization_level": "medium",
  "tone_guidance": "Consultative, focus on pain point",
  "avoid_list": ["Over-personalization", "Product pitch"]
}
```

#### `generate_linkedin_messages`
**Purpose**: Write actual messages based on strategy

**Input**:
```json
{
  "client_id": "acme",
  "lead": {...},
  "strategy": {/* from build_message_strategy */},
  "research": {/* optional Perplexity data */}
}
```

**Output**:
```json
{
  "connect_note": "Saw you're building out the SDR team — curious how you're thinking about pipeline coverage as it scales.",
  "dm_1": "Hi Sarah,\n\nNoticed Acme is hiring 5+ SDRs...",
  "followups": [
    "Worth exploring if this is even a priority?",
    "Happy to share what we're seeing..."
  ],
  "spam_risk": {
    "score": 15,
    "flags": []
  }
}
```

#### `validate_message_safety`
**Purpose**: Final safety gatekeeper

**Input**:
```json
{
  "messages": {/* from generate_linkedin_messages */},
  "channel": "linkedin",
  "policy": {
    "no_creepy": true,
    "no_guarantees": true
  }
}
```

**Output**:
```json
{
  "ok": true,
  "risk_score": 15,
  "flags": [],
  "suggested_edits": []
}
```

### D. Reply Loop

#### `classify_reply`
**Purpose**: Understand reply intent and sentiment

**Input**:
```json
{
  "thread": {
    "messages": [
      {"from": "us", "content": "..."},
      {"from": "them", "content": "Not right now, maybe Q2"}
    ]
  },
  "lead": {...}
}
```

**Output**:
```json
{
  "intent": "timing",
  "sentiment": "neutral",
  "confidence": 0.85,
  "recommended_next_step": "nurture",
  "reasoning": "Mentioned future interest (Q2)",
  "extracted_context": {
    "timing_mentioned": "Q2"
  }
}
```

#### `draft_reply`
**Purpose**: Draft human-send reply

**Input**:
```json
{
  "client_id": "acme",
  "classification": {/* from classify_reply */},
  "lead": {...},
  "strategy": {/* original strategy */}
}
```

**Output**:
```json
{
  "draft": "Makes sense — I'll check back in April. In the meantime, here's a quick resource...",
  "options": ["Alt 1", "Alt 2"],
  "risk_flags": [],
  "tone": "Respectful of timing, adds value"
}
```

### E. Admin

#### `list_clients`
**Purpose**: List all configured clients

**Output**:
```json
[
  {
    "client_id": "acme",
    "client_name": "Acme Corp",
    "status": "active",
    "installed_at": "2025-01-15T10:00:00Z"
  }
]
```

#### `get_client_config`
**Purpose**: Retrieve full client config

**Input**: `{"client_id": "acme"}`

**Output**: Full `ClientConfig` object

---

## 🔗 n8n Workflows

### Workflow 1: Client Onboarding

**Purpose**: Jotform → Validated Config → Storage

**Nodes**:
1. Webhook (Jotform submission)
2. Set (map fields to config structure)
3. HTTP Request → `validate_client_config`
4. IF (validation.ok)
5. Write File (`config/clients/{client_id}.json`)
6. Slack (notify success)

**When to Run**: Every new client signup

---

### Workflow 2: Lead Processing Pipeline

**Purpose**: Leads → Normalized → Scored → Cleaned → Researched → Messaged → HeyReach

**Trigger Options**:
- Manual file upload
- Schedule (daily)
- Webhook (CSV upload)
- HeyReach export webhook

**Nodes**:
1. **Trigger** (file/schedule/webhook)
2. **Get Client Config** (Data Store or file)
3. **HTTP → `normalize_leads`**
4. **HTTP → `score_leads_against_icp`**
5. **HTTP → `clean_lead_list`**
6. **Split in Batches** (on `kept` leads)
7. **IF** fit_score >= 75:
   - HTTP → `research_lead` (Perplexity)
8. **HTTP → `build_message_strategy`**
9. **HTTP → `generate_linkedin_messages`**
10. **HTTP → `validate_message_safety`**
11. **IF** ok = false → Send to review queue (Slack/Airtable)
12. **HeyReach API** (upsert lead + add to campaign with messages)
13. **Log to DB** (lead outcomes)

---

### Workflow 3: Reply Handler

**Purpose**: HeyReach reply → Classify → Next Step → Human Review

**Trigger**: HeyReach "new reply" webhook

**Nodes**:
1. **Webhook** (HeyReach reply event)
2. **Get Lead Context** (HeyReach API)
3. **Get Client Config**
4. **HTTP → `classify_reply`**
5. **Switch** (by intent):
   - **interested** → Slack: "🔥 Hot lead!" + Create calendar task
   - **timing** → HeyReach: Move to nurture list + Schedule follow-up
   - **question** → HTTP: `draft_reply` → Slack for approval
   - **objection** → HTTP: `draft_reply` → Slack for approval
   - **not_interested** → HeyReach: Tag as lost + Suppress
   - **unsubscribe** → HeyReach: Remove + Tag
6. **CRM Sync** (optional: HubSpot/Salesforce)
7. **Log Metrics** (reply rate, intent distribution)

---

## ✅ Deployment Checklist

### Prerequisites

- [ ] Node.js ≥18
- [ ] n8n instance (self-hosted or cloud)
- [ ] Perplexity API key
- [ ] Anthropic API key
- [ ] One HeyReach account per client (or client provides)

### Setup Steps

#### 1. System Setup

```bash
# Clone repo
git clone <repo-url>
cd linkedin

# Install dependencies
npm install

# Create config directory
mkdir -p config/clients
mkdir -p data/clients

# Set environment variables
cp .env.example .env
# Edit .env with your keys
```

#### 2. Initialize Config Manager

```typescript
import { ClientConfigManager } from './src/core/clients/config-manager.js';

const configManager = new ClientConfigManager('./config/clients');
await configManager.loadConfigs();
```

#### 3. Create First Client

```typescript
const result = await configManager.createFromOnboarding({
  client_id: 'pilot-client',
  client_name: 'Pilot Client Inc',
  icp: {
    company_size: { min: 50, max: 500 },
    industries: ['SaaS', 'Technology'],
    titles: ['VP of Sales', 'Director of Sales'],
  },
  offer: {
    product_name: 'SalesFlow',
    value_proposition: 'AI-powered pipeline generation',
    target_outcome: 'book discovery calls',
  },
  heyreach_api_key: 'client_heyreach_key',
});

if (result.ok) {
  console.log('✅ Client installed');
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

#### 4. Set Up n8n Workflows

1. Import workflow JSON (see `/workflows/` directory)
2. Configure credentials:
   - MCP Server URL
   - Perplexity API key
   - HeyReach API keys (per client)
   - Slack webhook (for notifications)
3. Test each workflow with sample data

#### 5. Test End-to-End

```bash
# Run lead processing test
npm run test:agency-flow

# Expected output:
# ✅ 100 leads normalized
# ✅ 87 leads scored
# ✅ 45 kept, 12 review, 30 dropped
# ✅ 45 messages generated
# ✅ 43 passed safety validation
# ✅ 43 sent to HeyReach
```

---

## 🎛️ Agency Operations

### Weekly Tasks

1. **Review "Review Queue"**
   - Leads with fit scores 55-69
   - Messages flagged by safety validation
   - Approve or reject

2. **Monitor Reply Classifications**
   - Check classification accuracy
   - Review drafted replies before sending
   - Update thresholds if needed

3. **Rotate Angles**
   - If reply rates drop, refresh messaging strategies
   - Update client offer descriptions
   - Test new personalization approaches

4. **Refresh ICP**
   - Add new exclusions based on bad-fit leads
   - Adjust company size ranges
   - Update title lists

### Monthly Tasks

1. **Client Health Check**
   - Review per-client metrics
   - Adjust aggressiveness if needed
   - Check HeyReach account health

2. **System Updates**
   - Update Perplexity prompts
   - Refine ICP scoring weights
   - Test new Claude models

3. **Onboard New Clients**
   - Standard Jotform process
   - 1-week pilot with small list
   - Adjust based on results

---

## 📊 Success Metrics

### Per-Client Tracking

- **List Quality**: % of leads kept after ICP scoring
- **Message Safety**: % passing validation first try
- **Reply Rate**: Positive replies / messages sent
- **Meeting Rate**: Meetings booked / positive replies
- **Account Health**: HeyReach warnings, connection acceptance rate

### System-Wide

- **Client Retention**: Active clients over time
- **Onboarding Speed**: Days from signup to first campaign
- **Support Tickets**: Issues per client per month
- **Research Quality**: Perplexity confidence scores

---

## 🚨 Common Issues & Solutions

### Issue: Low ICP scores across board
**Solution**: ICP too strict. Broaden company size range or add more title variations.

### Issue: High spam risk scores
**Solution**: Review message prompts. May be too aggressive or using blacklisted patterns.

### Issue: Replies classified incorrectly
**Solution**: Check classification confidence. If <0.7, route to human review.

### Issue: Research returning low confidence
**Solution**: Company too obscure or domain incorrect. Try different company name format.

### Issue: Client complaining about "off-brand" tone
**Solution**: Update client preferences: tone, cta_style. Regenerate strategy.

---

## 🔐 Security & Compliance

### Data Isolation

- ✅ Client configs in separate files
- ✅ No cross-client data sharing
- ✅ HeyReach API keys encrypted at rest
- ✅ Audit logs per client

### Compliance

- ✅ Unsubscribe detection (automatic)
- ✅ "Not interested" suppression
- ✅ GDPR-compliant (no EU personal data storage)
- ✅ CAN-SPAM compliant (for email channel)

### API Key Management

- Store in environment variables
- Never log full keys
- Rotate every 90 days
- Use separate keys per environment (dev/staging/prod)

---

## 📞 Support & Next Steps

### Getting Help

- **GitHub Issues**: Technical bugs
- **Documentation**: This guide + `/docs` folder
- **Community**: (Add your Slack/Discord here)

### Roadmap

- [ ] Email channel support (in addition to LinkedIn)
- [ ] Multi-language support
- [ ] Custom research sources (beyond Perplexity)
- [ ] White-label dashboard for clients
- [ ] Agency billing/usage tracking

---

**You're now ready to deploy the AI Outbound Operating System for your first client!** 🚀

Start with the Deployment Checklist and reach out if you hit any blockers.
