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

## Campaign Schema

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

// Query campaigns
const activeCampaigns = await prisma.campaign.findMany({
  where: { status: 'active' }
});
```

## License

ISC