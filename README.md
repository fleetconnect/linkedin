# LinkedIn Lead Normalization & Scoring API

A deterministic data normalization and lead scoring service for LinkedIn lead data. This API provides endpoints to transform raw lead information into clean, structured format and qualify leads based on seniority and completeness.

## Features

- Deterministic normalization (same input always produces same output)
- Conservative lead scoring (better to under-score than over-score)
- Explicit scoring logic based on seniority and data completeness
- No data invention (returns empty strings when uncertain)
- Automatic LinkedIn URL normalization
- Intelligent seniority and industry detection
- Name parsing (full name → first name)
- Lead qualification with score, tier, and reason

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

## Project Structure

```
linkedin/
├── src/
│   ├── server.js              # Express server
│   ├── routes/
│   │   └── leads.js           # Route handlers
│   ├── services/
│   │   ├── leadService.js     # Normalization logic
│   │   └── scoringService.js  # Lead scoring logic
│   └── middleware/
│       └── validation.js      # Request validation
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK` - Successful operation
- `400 Bad Request` - Invalid input (missing or malformed `raw_lead` or `lead`)
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

# Test health check
curl http://localhost:3000/health
```

## License

ISC
