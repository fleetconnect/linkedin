# LinkedIn Lead Management API

A complete LinkedIn lead management service providing data normalization, lead scoring, outreach message generation, and reply classification. This API transforms raw lead information into clean data, qualifies leads based on seniority, generates respectful B2B outreach messages, and classifies reply intent.

## Features

- **Lead Normalization**: Deterministic normalization (same input always produces same output)
- **Lead Scoring**: Conservative scoring approach (better to under-score than over-score)
- **Message Generation**: Respectful, low-pressure B2B outreach messages
- **Reply Classification**: Intent detection based on explicit meaning (positive, neutral, objection, negative, out_of_office)
- Explicit scoring logic based on seniority and data completeness
- No data invention (returns empty strings when uncertain)
- Automatic LinkedIn URL normalization
- Intelligent seniority and industry detection
- Name parsing (full name → first name)
- Lead qualification with score, tier, and reason
- Channel-aware messaging (email vs LinkedIn)
- Tone customization (direct vs neutral)
- Pattern-based intent classification with confidence scoring

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Available environment variables:
- `PORT` - Server port (default: 3000)

## Usage

Start the development server:

```bash
npm run dev
```

Start the production server:

```bash
npm start
```

## API Documentation

### POST /normalize-lead

Normalize raw lead data into a structured format.

#### Input Schema

```json
{
  "raw_lead": {
    "name": "string",
    "company": "string",
    "title": "string",
    "linkedin_url": "string",
    "source": "string"
  }
}
```

#### Output Schema

```json
{
  "lead": {
    "full_name": "string",
    "first_name": "string",
    "company": "string",
    "role": "string",
    "industry": "string",
    "seniority": "string",
    "clean_linkedin": "string"
  }
}
```

#### Examples

**Example 1: Complete Lead Data**

Request:
```bash
curl -X POST http://localhost:3000/normalize-lead \
  -H "Content-Type: application/json" \
  -d '{
    "raw_lead": {
      "name": "John Michael Smith",
      "company": "TechCorp Inc",
      "title": "Senior Software Engineer",
      "linkedin_url": "https://linkedin.com/in/johnsmith",
      "source": "web_scrape"
    }
  }'
```

Response:
```json
{
  "lead": {
    "full_name": "John Michael Smith",
    "first_name": "John",
    "company": "TechCorp Inc",
    "role": "Senior Software Engineer",
    "industry": "Technology",
    "seniority": "Senior",
    "clean_linkedin": "https://www.linkedin.com/in/johnsmith"
  }
}
```

**Example 2: C-Level Executive**

Request:
```bash
curl -X POST http://localhost:3000/normalize-lead \
  -H "Content-Type: application/json" \
  -d '{
    "raw_lead": {
      "name": "Sarah Johnson",
      "company": "Global Finance Corp",
      "title": "Chief Technology Officer",
      "linkedin_url": "linkedin.com/in/sarahjohnson",
      "source": "referral"
    }
  }'
```

Response:
```json
{
  "lead": {
    "full_name": "Sarah Johnson",
    "first_name": "Sarah",
    "company": "Global Finance Corp",
    "role": "Chief Technology Officer",
    "industry": "Finance",
    "seniority": "C-Level",
    "clean_linkedin": "https://www.linkedin.com/in/sarahjohnson"
  }
}
```

**Example 3: Partial Data**

Request:
```bash
curl -X POST http://localhost:3000/normalize-lead \
  -H "Content-Type: application/json" \
  -d '{
    "raw_lead": {
      "name": "Mike",
      "company": "",
      "title": "Consultant",
      "linkedin_url": "",
      "source": "email"
    }
  }'
```

Response:
```json
{
  "lead": {
    "full_name": "Mike",
    "first_name": "Mike",
    "company": "",
    "role": "Consultant",
    "industry": "Consulting",
    "seniority": "",
    "clean_linkedin": ""
  }
}
```

### POST /score-lead

Score and qualify a normalized lead based on seniority, role, and data completeness.

#### Input Schema

```json
{
  "lead": {
    "full_name": "string",
    "company": "string",
    "role": "string",
    "industry": "string",
    "seniority": "string"
  }
}
```

#### Output Schema

```json
{
  "score": 1-5,
  "tier": "low | medium | high",
  "reason": "string"
}
```

#### Examples

**Example 1: C-Level Executive (High Tier)**

Request:
```bash
curl -X POST http://localhost:3000/score-lead \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "full_name": "Sarah Johnson",
      "company": "Global Finance Corp",
      "role": "Chief Technology Officer",
      "industry": "Technology",
      "seniority": "C-Level"
    }
  }'
```

Response:
```json
{
  "score": 5,
  "tier": "high",
  "reason": "C-Level with complete profile data indicates strong qualification."
}
```

**Example 2: VP Level (High Tier)**

Request:
```bash
curl -X POST http://localhost:3000/score-lead \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "full_name": "Jane Doe",
      "company": "Acme Corp",
      "role": "VP of Sales",
      "industry": "Sales",
      "seniority": "VP"
    }
  }'
```

Response:
```json
{
  "score": 4,
  "tier": "high",
  "reason": "VP with complete profile data indicates strong qualification."
}
```

**Example 3: Director Level (Medium Tier)**

Request:
```bash
curl -X POST http://localhost:3000/score-lead \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "full_name": "Bob Smith",
      "company": "TechStart Inc",
      "role": "Director of Engineering",
      "industry": "Technology",
      "seniority": "Director"
    }
  }'
```

Response:
```json
{
  "score": 3,
  "tier": "medium",
  "reason": "Director with complete profile data shows moderate potential."
}
```

**Example 4: Manager Level (Low Tier)**

Request:
```bash
curl -X POST http://localhost:3000/score-lead \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "full_name": "John Michael Smith",
      "company": "TechCorp Inc",
      "role": "Senior Software Engineer",
      "industry": "Technology",
      "seniority": "Senior"
    }
  }'
```

Response:
```json
{
  "score": 2,
  "tier": "low",
  "reason": "Senior indicates limited decision-making authority."
}
```

**Example 5: Incomplete Data (Low Tier)**

Request:
```bash
curl -X POST http://localhost:3000/score-lead \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "full_name": "Mike",
      "company": "",
      "role": "Consultant",
      "industry": "Consulting",
      "seniority": ""
    }
  }'
```

Response:
```json
{
  "score": 1,
  "tier": "low",
  "reason": "Insufficient data and unclear seniority suggest minimal qualification."
}
```

### POST /generate-message

Generate respectful, low-pressure B2B outreach messages for leads.

#### Input Schema

```json
{
  "lead": {
    "first_name": "string",
    "company": "string",
    "role": "string"
  },
  "score": {
    "tier": "low | medium | high"
  },
  "context": {
    "channel": "linkedin | email",
    "tone": "direct | neutral",
    "goal": "start conversation"
  }
}
```

#### Output Schema

```json
{
  "message": {
    "subject": "string",
    "body": "string"
  }
}
```

#### Examples

**Example 1: Email - Direct Tone - High Tier Lead**

Request:
```bash
curl -X POST http://localhost:3000/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "first_name": "Sarah",
      "company": "Global Finance Corp",
      "role": "Chief Technology Officer"
    },
    "score": {
      "tier": "high"
    },
    "context": {
      "channel": "email",
      "tone": "direct",
      "goal": "start conversation"
    }
  }'
```

Response:
```json
{
  "message": {
    "subject": "Quick question about Global Finance Corp",
    "body": "Hi Sarah,\n\nI noticed your work as Chief Technology Officer at Global Finance Corp. We're working on solutions that might align with your priorities.\n\nWould you be open to a brief conversation to explore if there's potential alignment?"
  }
}
```

**Example 2: LinkedIn - Neutral Tone - Medium Tier Lead**

Request:
```bash
curl -X POST http://localhost:3000/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "first_name": "Bob",
      "company": "TechStart Inc",
      "role": "Director of Engineering"
    },
    "score": {
      "tier": "medium"
    },
    "context": {
      "channel": "linkedin",
      "tone": "neutral",
      "goal": "start conversation"
    }
  }'
```

Response:
```json
{
  "message": {
    "subject": "",
    "body": "Hi Bob,\n\nI noticed your work as Director of Engineering at TechStart Inc. We're working on something that could be relevant to your team.\n\nWould it make sense to connect briefly to see if there's a fit?"
  }
}
```

**Example 3: Email - Direct Tone - Low Tier Lead**

Request:
```bash
curl -X POST http://localhost:3000/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "first_name": "John",
      "company": "TechCorp",
      "role": "Senior Software Engineer"
    },
    "score": {
      "tier": "low"
    },
    "context": {
      "channel": "email",
      "tone": "direct",
      "goal": "start conversation"
    }
  }'
```

Response:
```json
{
  "message": {
    "subject": "Quick question about TechCorp",
    "body": "Hi John,\n\nI noticed your work as Senior Software Engineer at TechCorp. We're working on solutions that might align with your priorities.\n\nWould you be interested in learning more?"
  }
}
```

**Example 4: Partial Data - Neutral Tone**

Request:
```bash
curl -X POST http://localhost:3000/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "first_name": "Mike",
      "company": "",
      "role": "Consultant"
    },
    "score": {
      "tier": "low"
    },
    "context": {
      "channel": "email",
      "tone": "neutral",
      "goal": "start conversation"
    }
  }'
```

Response:
```json
{
  "message": {
    "subject": "Following up",
    "body": "Hi Mike,\n\nI noticed your work as Consultant. We're working on something that could be relevant to your team.\n\nWould you be interested in learning more?"
  }
}
```

### POST /classify-reply

Classify the intent of a reply message based on explicit meaning.

#### Input Schema

```json
{
  "reply_text": "string"
}
```

#### Output Schema

```json
{
  "intent": "positive | neutral | objection | negative | out_of_office",
  "confidence": 0.0
}
```

#### Examples

**Example 1: Positive Intent**

Request:
```bash
curl -X POST http://localhost:3000/classify-reply \
  -H "Content-Type: application/json" \
  -d '{
    "reply_text": "Yes, this sounds interesting! When are you available for a call?"
  }'
```

Response:
```json
{
  "intent": "positive",
  "confidence": 0.8
}
```

**Example 2: Objection Intent**

Request:
```bash
curl -X POST http://localhost:3000/classify-reply \
  -H "Content-Type: application/json" \
  -d '{
    "reply_text": "Thanks for reaching out, but we already have a solution in place."
  }'
```

Response:
```json
{
  "intent": "objection",
  "confidence": 0.68
}
```

**Example 3: Negative Intent**

Request:
```bash
curl -X POST http://localhost:3000/classify-reply \
  -H "Content-Type: application/json" \
  -d '{
    "reply_text": "Not interested. Please do not contact me again."
  }'
```

Response:
```json
{
  "intent": "negative",
  "confidence": 0.9
}
```

**Example 4: Out of Office**

Request:
```bash
curl -X POST http://localhost:3000/classify-reply \
  -H "Content-Type: application/json" \
  -d '{
    "reply_text": "Thank you for your email. I am currently out of office and will respond when I return."
  }'
```

Response:
```json
{
  "intent": "out_of_office",
  "confidence": 0.95
}
```

**Example 5: Neutral Intent**

Request:
```bash
curl -X POST http://localhost:3000/classify-reply \
  -H "Content-Type: application/json" \
  -d '{
    "reply_text": "Can you send me more information about this?"
  }'
```

Response:
```json
{
  "intent": "neutral",
  "confidence": 0.58
}
```

### GET /health

Health check endpoint.

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T10:30:00.000Z"
}
```

## Normalization Rules

### Full Name & First Name
- `full_name`: Trimmed version of input `name`
- `first_name`: First token of `full_name` only

### Company
- Trimmed version of input `company`

### Role
- Trimmed version of input `title`

### Industry
Conservative detection based on keywords in company name and title:
- Technology
- Finance
- Healthcare
- Marketing
- Sales
- Education
- Retail
- Manufacturing
- Consulting
- Real Estate

Returns empty string if no clear match.

### Seniority
Conservative detection based on title keywords:
- `C-Level`: CEO, CTO, CFO, COO, CIO, CMO, Chief
- `VP`: VP, Vice President
- `Director`: Director, Head of
- `Manager`: Manager, Lead, Principal
- `Senior`: Senior, Sr.
- `Junior`: Junior, Jr., Associate, Intern

Returns empty string if no clear indicators.

### LinkedIn URL
Normalizes various LinkedIn URL formats to standard format:
- Input: `linkedin.com/in/username` or `https://www.linkedin.com/in/username?params=123`
- Output: `https://www.linkedin.com/in/username`

Returns empty string if URL is invalid or not a LinkedIn URL.

## Scoring Rules

The `/score-lead` endpoint uses explicit logic to score leads on a scale of 1-5, with a conservative approach (better to under-score than over-score).

### Score Calculation

**Primary Factor: Seniority**
- `C-Level`: 5 points (highest value - decision makers)
- `VP`: 4 points (high value - senior leadership)
- `Director`: 3 points (medium-high value - department heads)
- `Manager`: 2 points (medium value - team leads)
- `Senior`: 2 points (medium value - experienced professionals)
- `Junior`: 1 point (low value - entry level)
- Unknown/Empty: 1 point (low value - conservative default)

**Conservative Adjustment**
- If both `company` AND `role` are missing: -1 point (minimum score: 1)
- Ensures incomplete data results in lower scores

### Tier Mapping
- **High**: Score 4-5 (VP and C-Level roles)
- **Medium**: Score 3 (Director level)
- **Low**: Score 1-2 (Manager, Senior, Junior, or unknown)

### Reason Generation
The `reason` field provides a one-sentence explanation based on:
- Seniority level
- Data completeness (company, role, industry)
- Expected decision-making authority

Examples:
- "C-Level with complete profile data indicates strong qualification."
- "Director with sufficient profile data shows moderate potential."
- "Unknown seniority level indicates uncertain decision-making authority."

## Message Generation Rules

The `/generate-message` endpoint generates respectful, low-pressure B2B outreach messages following these principles:

### Message Constraints
- **No emojis**: Professional text only
- **No hype language**: Avoid superlatives and marketing speak
- **Body max 75 words**: Concise and respectful of recipient's time
- **Soft question ending**: Invite conversation without pressure
- **Limited personalization**: Only use provided fields (first_name, company, role)

### Channel-Specific Behavior
- **Email**: Generates subject line + body
- **LinkedIn**: Subject is empty string (not used), body only

### Tone Variations
- **Direct**: "Quick question about {company}" / "We're working on solutions that might align with your priorities"
- **Neutral**: "Exploring potential at {company}" / "We're working on something that could be relevant to your team"

### Tier-Based Closing Questions
- **High tier**: "Would you be open to a brief conversation to explore if there's potential alignment?"
- **Medium tier**: "Would it make sense to connect briefly to see if there's a fit?"
- **Low tier**: "Would you be interested in learning more?"

### Message Structure
1. Greeting with first name (if available)
2. Context about their role/company (based on available data)
3. Brief value statement (tone-dependent)
4. Soft closing question (tier-dependent)

## Reply Classification Rules

The `/classify-reply` endpoint classifies reply intent based on explicit meaning, not optimism. It uses pattern matching to detect intent signals and calculates confidence scores.

### Intent Categories

**Positive**
- Signals: "yes", "sure", "sounds good", "interested", "let's talk", "when", "available", "happy to", "would love to"
- Confidence: Higher confidence for explicit agreement signals

**Neutral**
- Signals: "maybe", "not sure", "tell me more", "what", "how", "can you explain", "need more information"
- Confidence: Moderate confidence for information-seeking patterns

**Objection**
- Signals: "already have", "timing isn't right", "not a priority", "not now", "but", "however", "maybe later", "in the future"
- Confidence: Moderate to high based on strength of objection signals

**Negative**
- Signals: "no", "not interested", "don't contact", "stop", "remove me", "unsubscribe", "never"
- Confidence: High confidence for explicit rejection

**Out of Office**
- Signals: "out of office", "automatic reply", "currently unavailable", "away from office", "on vacation", "limited access"
- Confidence: Very high (0.95) for clear auto-reply patterns

### Classification Logic

1. **Priority Check**: Out of office is checked first (highest priority)
2. **Pattern Matching**: Multiple patterns are evaluated for each intent
3. **Scoring**: Patterns contribute to intent scores (strong patterns = higher scores)
4. **Confidence Calculation**: Based on number and strength of matching patterns
5. **Intent Selection**: Highest scoring intent is returned
6. **Default Behavior**: If no patterns match, returns "neutral" with low confidence (0.3)

### Confidence Scoring
- Confidence ranges from 0.0 to 1.0
- Based on explicit meaning, not optimistic interpretation
- Multiple matching patterns increase confidence
- Strong signals (e.g., "yes", "not interested") produce higher confidence

## Project Structure

```
linkedin/
├── src/
│   ├── server.js                    # Express server
│   ├── routes/
│   │   └── leads.js                 # Route handlers
│   ├── services/
│   │   ├── leadService.js           # Normalization logic
│   │   ├── scoringService.js        # Lead scoring logic
│   │   ├── messageService.js        # Message generation logic
│   │   └── classificationService.js # Reply classification logic
│   └── middleware/
│       └── validation.js            # Request validation
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK` - Successful operation
- `400 Bad Request` - Invalid input (missing or malformed data)
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

## Testing

Test with curl:

```bash
# Test normalization
curl -X POST http://localhost:3000/normalize-lead \
  -H "Content-Type: application/json" \
  -d '{"raw_lead":{"name":"Jane Doe","company":"Acme Corp","title":"VP of Sales","linkedin_url":"linkedin.com/in/janedoe","source":"event"}}'

# Test scoring
curl -X POST http://localhost:3000/score-lead \
  -H "Content-Type: application/json" \
  -d '{"lead":{"full_name":"Jane Doe","company":"Acme Corp","role":"VP of Sales","industry":"Sales","seniority":"VP"}}'

# Test message generation
curl -X POST http://localhost:3000/generate-message \
  -H "Content-Type: application/json" \
  -d '{"lead":{"first_name":"Jane","company":"Acme Corp","role":"VP of Sales"},"score":{"tier":"high"},"context":{"channel":"email","tone":"direct","goal":"start conversation"}}'

# Test reply classification
curl -X POST http://localhost:3000/classify-reply \
  -H "Content-Type: application/json" \
  -d '{"reply_text":"Yes, this sounds interesting! When are you available for a call?"}'

# Test health check
curl http://localhost:3000/health
```

## License

ISC
