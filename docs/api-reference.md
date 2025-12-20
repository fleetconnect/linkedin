# API Documentation

Complete reference for all FleetConnect LinkedIn API endpoints.

---

## Base URL

```
http://localhost:3000/api
```

---

## Response Format

All endpoints return JSON with consistent structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "count": 10  // For list endpoints
}
```

**Error:**
```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (validation error)
- `404` - Resource not found
- `500` - Server error
- `501` - Not implemented

---

## Lead Management

### Create Lead
```http
POST /api/leads
```

**Body:**
```json
{
  "name": "John Doe",              // Required
  "email": "john@example.com",     // Optional
  "company": "Acme Corp",          // Optional
  "linkedinUrl": "https://...",    // Optional
  "campaignId": "campaign-123"     // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lead-abc123",
    "name": "John Doe",
    "state": "NEW",
    "conversationHistory": [],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Get All Leads
```http
GET /api/leads?state=READY_TO_SEND&campaignId=campaign-123
```

**Query Params:**
- `state` (optional) - Filter by state
- `campaignId` (optional) - Filter by campaign

**Response:**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "id": "lead-123",
      "name": "John Doe",
      "company": "Acme Corp",
      "state": "READY_TO_SEND",
      "nextMessage": "Hey John...",
      "messageId": "msg-456",
      "variant": "A",
      "campaignId": "campaign-123",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Get Lead Details
```http
GET /api/leads/:leadId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lead-123",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "campaignId": "campaign-123",
    "state": "REPLIED",
    "conversationHistory": [
      {
        "id": "msg-1",
        "content": "Hey John...",
        "sender": "user",
        "timestamp": "2024-01-15T10:00:00Z",
        "messageType": "initial",
        "variant": "A"
      }
    ],
    "lastClassification": {
      "intent": "interested",
      "sentiment": "positive",
      "confidence": 0.85,
      "next_state": "INTERESTED"
    },
    "research_snapshot": {
      "companyName": "Acme Corp",
      "companyDescription": "Leading SaaS provider...",
      "industry": "Software",
      "recentNews": ["Raised $50M Series B"],
      "challenges": ["Scaling team"],
      "opportunities": ["Enterprise market"],
      "researched_at": "2024-01-15T09:00:00Z"
    },
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Update Lead
```http
PUT /api/leads/:leadId
```

**Body (all fields optional):**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "company": "New Company",
  "linkedinUrl": "https://...",
  "campaignId": "campaign-456"
}
```

**Note:** Does NOT update state. Use state transition endpoints for that.

**Response:**
```json
{
  "success": true,
  "data": { ... }  // Updated lead
}
```

---

### Delete Lead
```http
DELETE /api/leads/:leadId?hard=false
```

**Query Params:**
- `hard=true` - Permanent deletion (not implemented)
- `hard=false` - Soft delete (marks as LOST) - default

**Response:**
```json
{
  "success": true,
  "message": "Lead marked as LOST"
}
```

---

### Bulk Import Leads
```http
POST /api/leads/import
```

**Body:**
```json
{
  "campaignId": "campaign-123",  // Optional default campaign
  "leads": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp",
      "linkedinUrl": "https://...",
      "campaignId": "campaign-456"  // Overrides default
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 2,
  "failed": 0,
  "data": [
    { "id": "lead-123", "name": "John Doe", ... },
    { "id": "lead-124", "name": "Jane Smith", ... }
  ],
  "errors": []
}
```

**Partial Failure Example:**
```json
{
  "success": true,
  "imported": 1,
  "failed": 1,
  "data": [
    { "id": "lead-123", "name": "John Doe", ... }
  ],
  "errors": [
    {
      "lead": { "name": "Invalid Lead" },
      "error": "Missing required field: name"
    }
  ]
}
```

---

## Campaign Management

### Get All Campaigns
```http
GET /api/campaigns
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "campaign-123",
      "name": "Q1 Outreach",
      "description": "First quarter campaign",
      "active": true,
      "messaging_rules": {
        "personalization": true,
        "toneOfVoice": "professional",
        "prompt_variant": "A",
        "maxMessagesPerDay": 50
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Create Campaign
```http
POST /api/campaigns
```

**Body:**
```json
{
  "name": "Q1 Outreach",              // Required
  "description": "First quarter",     // Optional
  "messaging_rules": {                // Required
    "personalization": true,
    "toneOfVoice": "professional",    // 'professional' | 'casual' | 'friendly'
    "prompt_variant": "A",            // 'A' | 'B'
    "maxMessagesPerDay": 50,
    "researchRequired": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign-123",
    "name": "Q1 Outreach",
    "active": true,
    "messaging_rules": { ... },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Get Campaign Details
```http
GET /api/campaigns/:campaignId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign-123",
    "name": "Q1 Outreach",
    "description": "First quarter campaign",
    "active": true,
    "messaging_rules": { ... },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Update Campaign
```http
PUT /api/campaigns/:campaignId
```

**Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "active": false,
  "messaging_rules": {
    "personalization": false,
    "toneOfVoice": "casual"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }  // Updated campaign
}
```

---

### Delete Campaign
```http
DELETE /api/campaigns/:campaignId
```

**Note:** Soft delete - sets `active = false`

**Response:**
```json
{
  "success": true,
  "message": "Campaign deactivated"
}
```

---

### Get Campaign Leads
```http
GET /api/campaigns/:campaignId/leads?state=REPLIED
```

**Query Params:**
- `state` (optional) - Filter by lead state

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": "lead-123",
      "name": "John Doe",
      "state": "REPLIED",
      ...
    }
  ]
}
```

---

## Classification

### Classify Reply
```http
POST /api/classify
```

**Body:**
```json
{
  "leadId": "lead-123",
  "messageContent": "Sounds interesting! Let's book a call."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classification": {
      "intent": "booked",
      "sentiment": "positive",
      "confidence": 0.92,
      "next_state": "BOOKED"
    },
    "stateAdvanced": true,
    "persisted": true,
    "meetsThreshold": true,
    "followupGenerated": false,
    "reasoning": "Lead explicitly requested to book a call"
  }
}
```

---

### Batch Classify
```http
POST /api/classify/batch
```

**Body:**
```json
{
  "messages": [
    {
      "leadId": "lead-123",
      "messageContent": "Sounds good!"
    },
    {
      "leadId": "lead-456",
      "messageContent": "Not interested"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "leadId": "lead-123",
      "classification": { ... },
      "stateAdvanced": true,
      ...
    },
    {
      "leadId": "lead-456",
      "classification": { ... },
      "stateAdvanced": true,
      ...
    }
  ]
}
```

---

### Get Lead Classification Stats
```http
GET /api/leads/:leadId/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClassifications": 3,
    "intentBreakdown": {
      "interested": 2,
      "neutral": 1,
      "negative": 0,
      "booked": 0
    },
    "averageConfidence": 0.83,
    "currentState": "INTERESTED"
  }
}
```

---

## Follow-up Generation

### Generate Follow-up
```http
POST /api/followup/generate
```

**Body:**
```json
{
  "leadId": "lead-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "followupGenerated": true,
    "message": {
      "id": "msg-456",
      "content": "Just following up on our last conversation...",
      "sender": "user",
      "messageType": "follow-up",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    "lead": {
      "id": "lead-123",
      "state": "READY_TO_SEND",
      ...
    }
  }
}
```

---

### Batch Generate Follow-ups
```http
POST /api/followup/batch
```

**Body:**
```json
{
  "leadIds": ["lead-123", "lead-456"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "leadId": "lead-123",
      "followupGenerated": true,
      "message": { ... }
    },
    {
      "leadId": "lead-456",
      "followupGenerated": false,
      "reason": "Not eligible for follow-up"
    }
  ]
}
```

---

### Check Follow-up Eligibility
```http
GET /api/followup/eligible/:leadId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "reason": "Lead in INTERESTED state, last message 3 days ago"
  }
}
```

---

### Get Campaign Eligible Leads
```http
GET /api/followup/campaign/:campaignId/eligible
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "lead-123",
      "name": "John Doe",
      "state": "INTERESTED",
      "lastMessageAt": "2024-01-12T10:00:00Z",
      "eligibleReason": "Last message 3 days ago"
    }
  ]
}
```

---

### Generate All Campaign Follow-ups
```http
POST /api/followup/campaign/:campaignId/generate-all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "generated": 4,
    "skipped": 1,
    "results": [
      {
        "leadId": "lead-123",
        "followupGenerated": true,
        "message": { ... }
      }
    ]
  }
}
```

---

## Message Generation

### Generate Initial Message
```http
POST /api/leads/:leadId/generate-initial
```

**Status:** `501 Not Implemented` (placeholder)

**Body:**
```json
{
  "campaignId": "campaign-123",  // Optional if lead has campaign
  "customPrompt": "Mention their recent funding round"
}
```

**Future Response:**
```json
{
  "success": true,
  "data": {
    "message": "Hey John, saw your recent Series B announcement...",
    "variant": "A",
    "researchUsed": true
  }
}
```

---

## External Integration (Execution Boundary)

### Update Lead State (External)
```http
POST /api/leads/:leadId/state
```

**Body:**
```json
{
  "state": "CONTACTED",
  "sentAt": "2024-01-15T10:00:00Z",  // Optional
  "messageId": "msg-123"              // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leadId": "lead-123",
    "previousState": "READY_TO_SEND",
    "newState": "CONTACTED",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## Analytics

### Get Variant Analytics
```http
GET /api/analytics/variants
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLeads": 100,
    "variantA": {
      "count": 50,
      "replied": 25,
      "interested": 15,
      "booked": 5,
      "replyRate": 0.50,
      "conversionRate": 0.30
    },
    "variantB": {
      "count": 50,
      "replied": 20,
      "interested": 10,
      "booked": 3,
      "replyRate": 0.40,
      "conversionRate": 0.20
    },
    "winner": "A",
    "confidence": 0.85
  }
}
```

---

### Get Variant Report
```http
GET /api/analytics/variants/report
```

**Response:**
```
[Formatted Text Report]

A/B Test Results
================

Variant A: 50 leads
  - Replies: 25 (50.0%)
  - Interested: 15 (30.0%)
  - Booked: 5 (10.0%)

Variant B: 50 leads
  - Replies: 20 (40.0%)
  - Interested: 10 (20.0%)
  - Booked: 3 (6.0%)

Winner: Variant A
Confidence: 85%
```

---

### Get Campaign Variant Analytics
```http
GET /api/analytics/variants/campaign/:campaignId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "leadCount": 50,
    "comparison": {
      "variantA": { ... },
      "variantB": { ... },
      "winner": "A"
    }
  }
}
```

---

## Observability

### Get System Stats
```http
GET /api/observability/stats?since=2024-01-15T00:00:00Z
```

**Query Params:**
- `since` (optional) - Stats since this timestamp

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1523,
    "byCategory": {
      "STATE_TRANSITION": 342,
      "LLM_CALL": 891,
      "RESEARCH": 142,
      "IDEMPOTENCY": 148
    },
    "byLevel": {
      "INFO": 1401,
      "WARN": 98,
      "ERROR": 24
    },
    "errorRate": 0.016,
    "avgLLMLatency_ms": 1250,
    "researchCacheHitRate": 0.73,
    "idempotencyBlockRate": 0.12
  }
}
```

---

### Query Logs
```http
GET /api/observability/logs?category=LLM_CALL&level=ERROR&leadId=lead-123&limit=100&since=2024-01-15T00:00:00Z
```

**Query Params:**
- `category` (optional) - STATE_TRANSITION | LLM_CALL | RESEARCH | IDEMPOTENCY
- `level` (optional) - DEBUG | INFO | WARN | ERROR
- `leadId` (optional) - Filter by lead
- `limit` (optional) - Max results
- `since` (optional) - Logs since timestamp

**Response:**
```json
{
  "success": true,
  "count": 42,
  "data": [
    {
      "timestamp": "2024-01-15T10:23:45.123Z",
      "level": "ERROR",
      "category": "LLM_CALL",
      "message": "LLM classify: classify_reply_v2 (5000ms) ✗",
      "metadata": {
        "operation": "classify",
        "promptId": "classify_reply_v2",
        "promptVersion": "v2",
        "model": "claude-3-5-sonnet-20241022",
        "success": false,
        "latency_ms": 5000,
        "error": "timeout",
        "leadId": "lead-123"
      }
    }
  ]
}
```

---

## Health Check

### Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## Summary

**Lead Management:** 7 endpoints
**Campaign Management:** 6 endpoints
**Classification:** 3 endpoints
**Follow-up:** 5 endpoints
**Message Generation:** 1 endpoint (placeholder)
**External Integration:** 1 endpoint
**Analytics:** 3 endpoints
**Observability:** 2 endpoints
**Health:** 1 endpoint

**Total:** 29 production-ready API endpoints
