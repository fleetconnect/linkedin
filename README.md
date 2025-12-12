# LinkedIn Lead Normalization API

A deterministic data normalization service for LinkedIn lead data. This API provides a single endpoint to transform raw lead information into a clean, structured format.

## Features

- Deterministic normalization (same input always produces same output)
- Conservative approach (preserves accuracy over completeness)
- No data invention (returns empty strings when uncertain)
- Automatic LinkedIn URL normalization
- Intelligent seniority and industry detection
- Name parsing (full name → first name)

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

## Project Structure

```
linkedin/
├── src/
│   ├── server.js           # Express server
│   ├── routes/
│   │   └── leads.js        # Route handlers
│   ├── services/
│   │   └── leadService.js  # Normalization logic
│   └── middleware/
│       └── validation.js   # Request validation
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK` - Successful normalization
- `400 Bad Request` - Invalid input (missing or malformed `raw_lead`)
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

## Testing

Test with curl:

```bash
# Test normalization
curl -X POST http://localhost:3000/normalize-lead \
  -H "Content-Type: application/json" \
  -d '{"raw_lead":{"name":"Jane Doe","company":"Acme Corp","title":"VP of Sales","linkedin_url":"linkedin.com/in/janedoe","source":"event"}}'

# Test health check
curl http://localhost:3000/health
```

## License

ISC
