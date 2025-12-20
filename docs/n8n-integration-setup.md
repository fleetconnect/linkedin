# n8n Integration Setup Guide

## STEP 0 — Prerequisites (Ready ✅)

### API Server Status
✅ **Server Running**: `npm run dev`
✅ **Health Endpoint**: `GET http://localhost:3000/api/health` → Returns `{"status":"ok"}`
✅ **API Base URL**: `http://localhost:3000`

### Test Resources Created
✅ **Test Campaign ID**: `181bcf83-9e93-4ca3-8683-20868df9fa9b`
✅ **Campaign Name**: "n8n Test Campaign"

### Configuration Details
```json
{
  "name": "n8n Test Campaign",
  "messaging_rules": {
    "personalization": true,
    "maxMessagesPerDay": 10,
    "researchRequired": false,
    "toneOfVoice": "professional"
  }
}
```

---

## Available API Endpoints for n8n

### 1. Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T20:02:03.057Z"
}
```

### 2. Campaign Management

**List Campaigns:**
```http
GET /api/campaigns
```

**Get Campaign:**
```http
GET /api/campaigns/:campaignId
```

**Get Campaign Leads:**
```http
GET /api/campaigns/:campaignId/leads
```

### 3. Lead Management

**Create Lead:**
```http
POST /api/leads
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "campaignId": "181bcf83-9e93-4ca3-8683-20868df9fa9b"
}
```

**Update Lead:**
```http
PUT /api/leads/:leadId
Content-Type: application/json

{
  "name": "John Doe Updated",
  "email": "john.new@example.com"
}
```

**Bulk Import Leads:**
```http
POST /api/leads/import
Content-Type: application/json

{
  "campaignId": "181bcf83-9e93-4ca3-8683-20868df9fa9b",
  "leads": [
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "company": "TechCorp",
      "linkedinUrl": "https://linkedin.com/in/janesmith"
    }
  ]
}
```

### 4. Lead State Management

**Get Leads by State:**
```http
GET /api/leads?state=READY_TO_SEND
```

**Update Lead State (for HeyReach → LinkedIn outreach):**
```http
PATCH /api/integrations/webhook/state-update
Content-Type: application/json

{
  "leadId": "abc-123",
  "state": "CONTACTED",
  "messageId": "msg-456",
  "sentAt": "2025-12-20T20:00:00Z"
}
```

### 5. Message Classification

**Classify Incoming Reply:**
```http
POST /api/classify
Content-Type: application/json

{
  "leadId": "abc-123",
  "messageContent": "Thanks for reaching out! I'd love to learn more."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classification": {
      "intent": "positive",
      "confidence": 0.95,
      "reasoning": "Lead expressed interest"
    },
    "newState": "INTERESTED",
    "timestamp": "2025-12-20T20:00:00Z"
  }
}
```

---

## n8n Workflow Integration Points

### Workflow 1: Lead Import from HeyReach
1. **Trigger**: HeyReach webhook (new lead added)
2. **Action**: `POST /api/leads` to create lead
3. **Store**: Save lead ID for future reference

### Workflow 2: Outreach Message Delivery
1. **Trigger**: Scheduled (check for leads in `READY_TO_SEND` state)
2. **Fetch**: `GET /api/leads?state=READY_TO_SEND`
3. **Send**: Via HeyReach API
4. **Update**: `PATCH /api/integrations/webhook/state-update` with `state=CONTACTED`

### Workflow 3: Reply Classification
1. **Trigger**: HeyReach webhook (new reply received)
2. **Classify**: `POST /api/classify` with lead ID and message content
3. **Action**: Based on classification:
   - `INTERESTED` → Notify sales team
   - `POSITIVE` → Schedule follow-up
   - `NEGATIVE` → Mark as LOST
   - `NEUTRAL` → Continue sequence

### Workflow 4: Follow-up Sequence
1. **Trigger**: Scheduled (daily check)
2. **Fetch**: `GET /api/leads?state=INTERESTED`
3. **Generate**: `POST /api/leads/:leadId/draft-followup`
4. **Send**: Via HeyReach
5. **Update**: State to `CONTACTED`

---

## Next Steps

### For Production Deployment:

1. **Set Real API Key:**
   ```bash
   # Edit .env file
   ANTHROPIC_API_KEY=your_actual_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_key_here  # For research features
   ```

2. **Enable PostgreSQL (Optional but Recommended):**
   ```bash
   # Create database
   createdb linkedin_outreach

   # Update .env
   STORAGE_TYPE=postgres
   DB_HOST=localhost
   DB_NAME=linkedin_outreach
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Run migrations
   npm run db:migrate
   npm run db:migrate-data
   ```

3. **Configure HeyReach:**
   - Set up webhooks to point to your API server
   - Configure authentication headers if needed
   - Test webhook delivery

4. **Build n8n Workflows:**
   - Import lead workflow
   - Outreach delivery workflow
   - Reply classification workflow
   - Follow-up automation workflow

---

## Testing Checklist

- ✅ Server starts without errors
- ✅ Health endpoint responds
- ✅ Can create campaign
- ✅ Can create lead
- ✅ Can update lead state
- [ ] Can classify message (requires valid ANTHROPIC_API_KEY)
- [ ] Can generate follow-up (requires valid ANTHROPIC_API_KEY)
- [ ] HeyReach webhook delivers to API
- [ ] State transitions work correctly
- [ ] n8n can authenticate to API
- [ ] End-to-end lead journey works

---

## Troubleshooting

**Server won't start:**
- Check `.env` file exists and has valid values
- Ensure port 3000 is available
- Check logs: `npm run dev`

**Classification not working:**
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check Claude API quota/limits
- Review error logs

**Database errors:**
- If using PostgreSQL, ensure database is created
- Run migrations: `npm run db:migrate`
- Check database connection settings

**HeyReach webhook fails:**
- Verify API server is publicly accessible (use ngrok for local testing)
- Check webhook authentication
- Review request/response logs

---

## Quick Start Commands

```bash
# Start server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Create a test lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "campaignId": "181bcf83-9e93-4ca3-8683-20868df9fa9b"
  }'

# Get leads ready to send
curl http://localhost:3000/api/leads?state=READY_TO_SEND

# Classify a message (requires valid API key)
curl -X POST http://localhost:3000/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "your-lead-id",
    "messageContent": "I am interested in learning more"
  }'
```

---

## Support

For issues or questions:
- Check existing documentation in `/docs`
- Review API reference: `docs/api-reference.md`
- Check database migration guide: `docs/database-migration.md`
- Review observability guide: `docs/observability.md`
