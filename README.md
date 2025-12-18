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

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
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