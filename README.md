# LinkedIn Intent Classifier & Research Automation

LLM-based intent classification system for LinkedIn message replies with automated company research. Automatically classifies reply intent, sentiment, advances lead states, and researches companies for personalized outreach.

## Features

### Intent Classification
- 🤖 **LLM-Powered Classification**: Uses OpenAI GPT-4 for accurate intent detection
- 📊 **Structured Output**: Returns intent, sentiment, confidence, and next state
- 🎯 **Confidence Validation**: Configurable threshold for classification reliability
- 🔄 **State Management**: Automatic lead state advancement based on intent
- 💾 **Persistent Storage**: Saves all classifications and conversation history

### Company Research (NEW)
- 🔍 **Automated Research**: Uses Perplexity AI for up-to-date company information
- 🎣 **Pre-Message Hook**: Automatically runs before sending messages
- ⚙️ **Conditional Execution**: Only runs when `lead.state === QUALIFIED` and `personalization === true`
- 📝 **Research Persistence**: Saves research to `lead.research_snapshot`
- ✉️ **Personalized Messages**: Integrates research into message generation

### General
- 🚀 **REST API**: Easy integration with Express.js endpoints
- ✅ **Type-Safe**: Built with TypeScript and Zod validation
- 🏗️ **Modular Architecture**: Clean separation of concerns

## Intent Classification Schema

```typescript
{
  "intent": "interested" | "booked" | "neutral" | "negative",
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "next_state": "REPLIED" | "INTERESTED" | "BOOKED"
}
```

### Intent Types

- **interested**: Shows genuine interest, asks questions, wants to learn more
- **booked**: Confirms a meeting, agrees to a call, commits to next steps
- **neutral**: Polite acknowledgment, non-committal, or unclear intent
- **negative**: Not interested, declines, or shows resistance

### Lead States

```
NEW → QUALIFIED → CONTACTED → REPLIED → INTERESTED → BOOKED → CLOSED
                                     ↓
                                   LOST
```

**Note**: Research hook runs when lead reaches `QUALIFIED` state.

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_api_key_here
```

## Configuration

Edit `.env` file:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Perplexity API Configuration (for company research)
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Classification Configuration
CONFIDENCE_THRESHOLD=0.7        # Minimum confidence to advance state (0.0-1.0)
LLM_MODEL=gpt-4-turbo-preview   # OpenAI model to use
LLM_TEMPERATURE=0.3              # Lower = more consistent (0.0-2.0)

# Research Configuration
RESEARCH_MODEL=llama-3.1-sonar-large-128k-online  # Perplexity model
RESEARCH_TIMEOUT=30000                             # Research timeout in ms

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Quick Start

### 1. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

### 2. Use the API

**Classify a Single Reply:**

```bash
curl -X POST http://localhost:3000/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-123",
    "messageContent": "Thanks for reaching out! I would love to schedule a call next week."
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "classification": {
      "intent": "interested",
      "sentiment": "positive",
      "confidence": 0.92,
      "next_state": "INTERESTED"
    },
    "stateAdvanced": true,
    "persisted": true,
    "meetsThreshold": true,
    "reasoning": "The message explicitly expresses interest and willingness to schedule a call"
  }
}
```

### 3. Programmatic Usage

```typescript
import { LLMService } from './services/LLMService';
import { StorageService } from './services/StorageService';
import { ClassificationController } from './controllers/ClassificationController';

// Initialize services
const storage = new StorageService();
await storage.initialize();

const llm = new LLMService();
const controller = new ClassificationController(llm, storage);

// Classify a reply
const result = await controller.classifyReply(
  'lead-123',
  'Yes, let\'s schedule a call for Tuesday!'
);

console.log(result.classification);
// {
//   intent: 'booked',
//   sentiment: 'positive',
//   confidence: 0.95,
//   next_state: 'BOOKED'
// }
```

## API Endpoints

### `POST /api/classify`

Classify a single message reply.

**Request:**
```json
{
  "leadId": "string",
  "messageContent": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classification": { ... },
    "stateAdvanced": boolean,
    "persisted": boolean,
    "meetsThreshold": boolean,
    "reasoning": "string"
  }
}
```

### `POST /api/classify/batch`

Classify multiple messages in one request.

**Request:**
```json
{
  "messages": [
    { "leadId": "string", "messageContent": "string" },
    ...
  ]
}
```

### `GET /api/leads/:leadId/stats`

Get classification statistics for a lead.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClassifications": 5,
    "intentBreakdown": {
      "interested": 2,
      "booked": 1,
      "neutral": 1,
      "negative": 1
    },
    "averageConfidence": 0.84,
    "currentState": "INTERESTED"
  }
}
```

### `GET /api/health`

Health check endpoint.

## Controller Responsibilities

The `ClassificationController` handles three key responsibilities:

### 1. Validate Confidence Threshold

```typescript
// Only advances state if confidence >= threshold
const controller = new ClassificationController(llm, storage, {
  confidenceThreshold: 0.7
});
```

### 2. Advance Lead State

```typescript
// Automatically transitions lead through states
// NEW → CONTACTED → REPLIED → INTERESTED → BOOKED → CLOSED

const result = await controller.classifyReply(leadId, message);
if (result.stateAdvanced) {
  console.log(`State advanced to: ${result.classification.next_state}`);
}
```

### 3. Persist Intent

```typescript
// Saves classification to storage
// - Adds to conversation history
// - Updates lead's last classification
// - Stores in classifications log

const result = await controller.classifyReply(leadId, message);
if (result.persisted) {
  console.log('Classification saved successfully');
}
```

## Company Research Hook

The research hook automatically researches companies before sending personalized messages.

### How It Works

```typescript
// The hook executes automatically when:
// 1. lead.state === QUALIFIED
// 2. campaign.messaging_rules.personalization === true

import { MessagingController } from './controllers/MessagingController';

// Initialize controller with research capabilities
const messagingController = new MessagingController(
  preMessageHook,
  messageService,
  storageService
);

// Prepare message (automatically triggers research if conditions met)
const result = await messagingController.prepareMessage(leadId, 'initial');

console.log(`Research performed: ${result.researchPerformed}`);
console.log(`Message: ${result.message}`);
```

### Research Snapshot Schema

Research is persisted to `lead.research_snapshot`:

```typescript
interface ResearchSnapshot {
  companyName: string;
  companyDescription: string;
  industry: string;
  recentNews: string[];           // Latest company news
  keyProducts: string[];          // Main products/services
  challenges: string[];           // Potential pain points
  opportunities: string[];        // Growth areas
  fundingInfo: string;            // Recent funding rounds
  employeeCount: string;          // Company size
  researched_at: Date;            // When research was performed
  sources: string[];              // Source URLs
}
```

### Conditional Logic

The research hook has built-in conditional logic:

```typescript
// ✅ Research WILL run
const lead = {
  state: 'QUALIFIED',              // ← Required
  company: 'Stripe'
};
const campaign = {
  messaging_rules: {
    personalization: true          // ← Required
  }
};

// ❌ Research will NOT run (wrong state)
const lead = {
  state: 'NEW',                    // Not QUALIFIED
  company: 'Stripe'
};

// ❌ Research will NOT run (personalization disabled)
const campaign = {
  messaging_rules: {
    personalization: false         // Disabled
  }
};
```

### Research Tool Usage

You can also manually trigger research:

```typescript
import { ResearchCompanyTool } from './tools/researchCompany';

const researchTool = new ResearchCompanyTool(perplexityService, storageService);

// Execute research
const result = await researchTool.execute({
  leadId: 'lead-123',
  companyName: 'Stripe',
  additionalContext: 'Focus on payment processing challenges'
});

if (result.success) {
  console.log('Research completed:', result.snapshot);
}
```

### Message Generation with Research

Messages automatically use research when available:

```typescript
const messageService = new MessageGenerationService(researchTool);

// If lead has research_snapshot, it will be included in message generation
const message = await messageService.generateMessage(
  lead,
  campaign,
  'initial'
);

// Example output:
// "Hi Sarah, I noticed Stripe recently announced expansion into crypto payments.
// Given your focus on global payment infrastructure, I thought you'd be interested
// in how we help companies like yours..."
```

### Research Hook Benefits

- **Up-to-date Information**: Uses Perplexity's online models for current data
- **Automatic Execution**: No manual research needed
- **Smart Caching**: Research is reused for 7 days to avoid redundant API calls
- **Personalization**: Messages reference specific company challenges and news
- **Conditional**: Only runs when needed based on lead state and campaign settings

## Examples

### Intent Classification Example

Run the classification example:

```bash
npm run dev examples/basic-usage.ts
```

### Research Hook Example

Run the research hook demonstration:

```bash
# Make sure you have PERPLEXITY_API_KEY in .env
npm run dev examples/research-hook-demo.ts
```

This example demonstrates:
- Creating a campaign with personalization enabled
- Creating a QUALIFIED lead
- Automatic research execution
- Message generation with research insights
- Conditional logic (research only runs when conditions are met)

### API Testing

Test the API endpoints:

```bash
# Make sure server is running first
npm run dev

# In another terminal
bash examples/api-usage.sh
bash examples/research-api-usage.sh
```

## Project Structure

```
linkedin/
├── src/
│   ├── types/
│   │   └── index.ts                        # Type definitions and schemas
│   ├── config/
│   │   ├── llm.config.ts                   # OpenAI configuration
│   │   └── perplexity.config.ts            # Perplexity configuration (NEW)
│   ├── utils/
│   │   └── promptTemplates.ts              # Classification prompts
│   ├── services/
│   │   ├── LLMService.ts                   # OpenAI integration
│   │   ├── PerplexityService.ts            # Perplexity research (NEW)
│   │   ├── MessageGenerationService.ts     # Message generation (NEW)
│   │   └── StorageService.ts               # Data persistence
│   ├── tools/
│   │   └── researchCompany.ts              # Research tool (NEW)
│   ├── hooks/
│   │   └── PreMessageHook.ts               # Pre-message hooks (NEW)
│   ├── controllers/
│   │   ├── ClassificationController.ts     # Intent classification
│   │   └── MessagingController.ts          # Messaging orchestration (NEW)
│   ├── api/
│   │   └── routes.ts                       # Express routes
│   └── index.ts                            # Application entry point
├── examples/
│   ├── basic-usage.ts                      # Classification example
│   ├── research-hook-demo.ts               # Research hook demo (NEW)
│   ├── api-usage.sh                        # API examples
│   └── research-api-usage.sh               # Research API examples (NEW)
├── data/                                   # Storage directory (auto-created)
│   ├── leads.json
│   ├── campaigns.json                      # Campaign storage (NEW)
│   └── classifications.json
├── .env.example                            # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## How It Works

1. **Message Received**: When a LinkedIn reply comes in, it's sent to the classifier
2. **Context Building**: System gathers conversation history and lead information
3. **LLM Analysis**: OpenAI GPT-4 analyzes the message with full context
4. **Classification**: Returns intent, sentiment, confidence, and recommended state
5. **Validation**: Controller checks if confidence meets threshold (default: 0.7)
6. **State Advancement**: If valid, lead state is automatically updated
7. **Persistence**: Classification is saved to storage for analytics

## Confidence Threshold

The confidence threshold determines when to act on classifications:

- **High Threshold (0.8-0.9)**: Only very clear signals trigger state changes
- **Medium Threshold (0.6-0.7)**: Balanced approach (recommended)
- **Low Threshold (0.4-0.5)**: More aggressive state advancement

## State Transition Rules

Valid state transitions:

- `NEW` → `CONTACTED`, `REPLIED`
- `CONTACTED` → `REPLIED`, `INTERESTED`, `LOST`
- `REPLIED` → `INTERESTED`, `BOOKED`, `CLOSED`, `LOST`
- `INTERESTED` → `BOOKED`, `REPLIED`, `LOST`
- `BOOKED` → `CLOSED`, `LOST`
- `CLOSED` → (terminal state)
- `LOST` → (terminal state)

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
