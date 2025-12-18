# LinkedIn Campaign Manager

A Node.js/TypeScript application for managing LinkedIn campaigns with PostgreSQL and Prisma ORM.

## Features

- **Campaign Management**: Create and manage LinkedIn campaigns
- **Flexible Configuration**: JSON-based ICP targeting, scoring rules, and messaging configuration
- **Type-Safe Database**: Prisma ORM with TypeScript for type-safe database operations
- **License Tiers**: Support for operator, partner, and enterprise tiers

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure database**:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string

   ```bash
   cp .env.example .env
   ```

3. **Generate Prisma client**:
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations**:
   ```bash
   npm run prisma:migrate
   ```

## Database Schema

### Campaign Model

The Campaign model includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `campaign_id` | String (UUID) | Primary key, auto-generated |
| `client_id` | String | Reference to the client |
| `name` | String (optional) | Campaign name |
| `status` | String (optional) | Campaign status: active, paused, or archived |
| `icp_config` | JSON (optional) | ICP configuration: titles, industries, company size |
| `scoring_rules` | JSON (optional) | Scoring thresholds and disqualifiers |
| `messaging_rules` | JSON (optional) | Messaging tone and CTA constraints |
| `license_tier` | String (optional) | License tier: operator, partner, or enterprise |
| `created_at` | DateTime | Auto-generated creation timestamp |
| `updated_at` | DateTime | Auto-updated timestamp |

### Lead Model

**The Brain Stem of the OS** - Every tool mutation must update this object.

| Field | Type | Description |
|-------|------|-------------|
| `lead_id` | String (UUID) | Primary key, auto-generated |
| `campaign_id` | String (UUID) | Foreign key to Campaign |
| `state` | LeadState enum | Current state in the lead lifecycle |
| `raw_input` | JSON (optional) | Original raw input data |
| `normalized` | JSON (optional) | Normalized/processed data |
| `score` | JSON (optional) | Scoring information |
| `messages` | JSON (optional) | Array of message objects |
| `last_intent` | String (optional) | Last detected intent |
| `created_at` | DateTime | Auto-generated creation timestamp |
| `updated_at` | DateTime | Auto-updated timestamp |

**LeadState Enum Values:**
- `NEW` - Initial state
- `NORMALIZED` - Data has been normalized
- `DISQUALIFIED` - Lead does not meet criteria
- `QUALIFIED` - Lead meets criteria
- `CONTACTED` - Outreach has been made
- `REPLIED` - Lead has responded
- `BOOKED` - Meeting/call scheduled
- `CLOSED` - Deal closed

## Usage

### Start API Server

```bash
npm run dev:api
```

The API server will start on `http://localhost:3000`

### Development Mode (Examples)

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

## REST API

The system provides a thin orchestration layer that wraps stateless tools with state management.

**Base URL**: `http://localhost:3000/api`

### Orchestration Pattern

Each endpoint follows this pattern:
1. **Load** Lead + Campaign from database
2. **Call** stateless tool (normalize, score, generate-message, classify-reply)
3. **Persist** tool output to the Lead object
4. **Advance** lead state
5. **Return** updated lead

This turns stateless tools into a stateful system. **Every tool mutation updates the Lead object.**

### Endpoints

#### Create Lead
```http
POST /api/leads
Content-Type: application/json

{
  "campaign_id": "uuid",
  "raw_input": {
    "name": "John Doe",
    "title": "CTO",
    "company": "Tech Corp",
    "linkedin_url": "https://linkedin.com/in/johndoe"
  }
}
```

#### Normalize Lead
```http
POST /api/leads/:id/normalize

# Loads lead, calls normalize tool, saves normalized data, advances to NORMALIZED
```

#### Score Lead
```http
POST /api/leads/:id/score

# Loads lead + campaign, calls score tool with scoring rules,
# saves score, advances to QUALIFIED or DISQUALIFIED
```

#### Generate Message
```http
POST /api/leads/:id/generate-message
Content-Type: application/json

{
  "intent": "initial_outreach"  # or "follow_up", "value_proposition"
}

# Loads lead + campaign, calls generateMessage tool with messaging rules,
# appends message to messages array, updates last_intent
```

#### Classify Reply
```http
POST /api/leads/:id/classify-reply
Content-Type: application/json

{
  "reply_text": "Yes, I'm interested. Let's schedule a call."
}

# Loads lead, calls classifyReply tool, appends to messages,
# advances state based on intent (e.g., REPLIED -> BOOKED)
```

#### Get Lead
```http
GET /api/leads/:id
```

#### List Leads
```http
GET /api/leads?campaign_id=uuid&state=QUALIFIED&limit=50&offset=0
```

### Example API Workflow

```bash
# 1. Create lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "campaign-uuid",
    "raw_input": {"name": "John Doe", "title": "CTO", "company": "Tech Corp"}
  }'

# 2. Normalize (NEW -> NORMALIZED)
curl -X POST http://localhost:3000/api/leads/{lead-id}/normalize

# 3. Score (NORMALIZED -> QUALIFIED/DISQUALIFIED)
curl -X POST http://localhost:3000/api/leads/{lead-id}/score

# 4. Generate message
curl -X POST http://localhost:3000/api/leads/{lead-id}/generate-message \
  -H "Content-Type: application/json" \
  -d '{"intent": "initial_outreach"}'

# 5. Classify reply (CONTACTED -> REPLIED -> BOOKED)
curl -X POST http://localhost:3000/api/leads/{lead-id}/classify-reply \
  -H "Content-Type: application/json" \
  -d '{"reply_text": "Yes, let me schedule a call"}'
```

## Example Usage

### Working with Campaigns

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a campaign
const campaign = await prisma.campaign.create({
  data: {
    client_id: 'client_123',
    name: 'Q1 2024 Lead Generation',
    status: 'active',
    icp_config: {
      titles: ['CEO', 'CTO'],
      industries: ['Technology'],
      size: '50-200'
    },
    scoring_rules: {
      thresholds: { min_score: 70 },
      disqualifiers: ['competitor']
    },
    messaging_rules: {
      tone: 'professional',
      cta_constraints: ['book_demo']
    },
    license_tier: 'partner'
  }
});
```

### Working with Leads

```typescript
// Create a new lead
const lead = await prisma.lead.create({
  data: {
    campaign_id: campaign.campaign_id,
    state: 'NEW',
    raw_input: {
      name: 'John Doe',
      title: 'CTO',
      company: 'Tech Corp',
      linkedin_url: 'https://linkedin.com/in/johndoe'
    }
  }
});

// Update lead state and data (every tool mutation updates this object)
const updatedLead = await prisma.lead.update({
  where: { lead_id: lead.lead_id },
  data: {
    state: 'NORMALIZED',
    normalized: {
      full_name: 'John Doe',
      title: 'Chief Technology Officer',
      company: 'Tech Corp',
      industry: 'Technology'
    },
    score: {
      total: 85,
      factors: {
        title_match: 30,
        industry_match: 25,
        company_size: 30
      }
    }
  }
});

// Query leads by state
const qualifiedLeads = await prisma.lead.findMany({
  where: {
    campaign_id: campaign.campaign_id,
    state: 'QUALIFIED'
  },
  include: {
    campaign: true
  }
});

// Track lead progression through states
await prisma.lead.update({
  where: { lead_id: lead.lead_id },
  data: {
    state: 'CONTACTED',
    messages: {
      sent: [
        {
          timestamp: new Date().toISOString(),
          channel: 'linkedin',
          content: 'Hi John, I noticed...',
          status: 'sent'
        }
      ]
    },
    last_intent: 'initial_outreach'
  }
});
```

## License

ISC