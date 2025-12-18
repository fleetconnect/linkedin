# LinkedIn Intent Classifier

LLM-based intent classification system for LinkedIn message replies. Automatically classifies reply intent, sentiment, and advances lead states based on conversation context.

## Features

- 🤖 **LLM-Powered Classification**: Uses OpenAI GPT-4 for accurate intent detection
- 📊 **Structured Output**: Returns intent, sentiment, confidence, and next state
- 🎯 **Confidence Validation**: Configurable threshold for classification reliability
- 🔄 **State Management**: Automatic lead state advancement based on intent
- 💾 **Persistent Storage**: Saves all classifications and conversation history
- 🚀 **REST API**: Easy integration with Express.js endpoints
- ✅ **Type-Safe**: Built with TypeScript and Zod validation

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
NEW → CONTACTED → REPLIED → INTERESTED → BOOKED → CLOSED
                         ↓
                       LOST
```

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

# Classification Configuration
CONFIDENCE_THRESHOLD=0.7        # Minimum confidence to advance state (0.0-1.0)
LLM_MODEL=gpt-4-turbo-preview   # OpenAI model to use
LLM_TEMPERATURE=0.3              # Lower = more consistent (0.0-2.0)

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

## Examples

Run the example script:

```bash
npm run dev examples/basic-usage.ts
```

Or test the API:

```bash
# Make sure server is running first
npm run dev

# In another terminal
bash examples/api-usage.sh
```

## Project Structure

```
linkedin/
├── src/
│   ├── types/
│   │   └── index.ts              # Type definitions and schemas
│   ├── config/
│   │   └── llm.config.ts         # LLM configuration
│   ├── utils/
│   │   └── promptTemplates.ts    # Classification prompts
│   ├── services/
│   │   ├── LLMService.ts         # OpenAI integration
│   │   └── StorageService.ts     # Data persistence
│   ├── controllers/
│   │   └── ClassificationController.ts  # Main controller
│   ├── api/
│   │   └── routes.ts             # Express routes
│   └── index.ts                  # Application entry point
├── examples/
│   ├── basic-usage.ts            # Programmatic usage example
│   └── api-usage.sh              # API usage examples
├── data/                         # Storage directory (auto-created)
├── .env.example                  # Environment template
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
