# System Wiring Guide for AI Assistant

**Complete briefing for wiring LinkedIn Intelligence API + n8n + HeyReach**

---

## 🎯 Mission

Wire together a production LinkedIn outreach system with:
- **Intelligence Layer** (Node.js API) - Classifies replies, manages state, applies rules
- **Workflow Automation** (n8n) - Orchestrates data flow
- **Execution Layer** (HeyReach) - Sends LinkedIn messages

**Goal:** End-to-end automated LinkedIn outreach with intelligent reply handling.

---

## 🔒 Non-Negotiable Wiring Rules (Read Before Starting)

**These rules protect system integrity. Violating them breaks the architecture.**

### 1. n8n Must NEVER Contain Prompt Logic
- ❌ No prompt templates in n8n workflows
- ❌ No message generation in n8n
- ❌ No classification logic in n8n
- ✅ n8n only calls API endpoints
- ✅ n8n only routes based on API responses

**Why:** Prompts are versioned, tested, and optimized in the API. Duplicating them in n8n creates drift and breaks reproducibility.

### 2. n8n Must NEVER Decide Message Content
- ❌ No "if interested, send this message" logic
- ❌ No message templates stored in n8n
- ❌ No conditional message assembly
- ✅ API decides what to send (or if to send)
- ✅ n8n only delivers what API provides

**Why:** Message content is intelligence. Intelligence lives in the API, not the orchestrator.

### 3. All Outbound Decisions Originate in the API
- ❌ n8n cannot decide to send a message
- ❌ n8n cannot skip a message
- ❌ n8n cannot modify message content
- ✅ API sets lead state to READY_TO_SEND
- ✅ n8n reads state and executes

**Why:** The API is the single source of truth for lead state and messaging rules. n8n is a delivery mechanism.

### 4. HeyReach is Execution-Only
- ❌ Don't use HeyReach's "AI features"
- ❌ Don't use HeyReach's scheduling logic
- ❌ Don't use HeyReach's message templates
- ✅ Use HeyReach only to send exact messages
- ✅ Use HeyReach only for delivery tracking

**Why:** HeyReach is the "hands on keyboard." Your API is the "brain." Don't give the hands a brain.

### 5. If Unsure, Do Nothing Rather Than Force a Send
- ❌ Don't send "default" messages on error
- ❌ Don't retry failed classifications with dummy data
- ❌ Don't assume intent if API times out
- ✅ Log the error
- ✅ Alert on failure
- ✅ Wait for manual intervention

**Why:** A missed message is better than a wrong message. This system is licensable software—every action must be deterministic and auditable.

---

## ⚠️ Common Violations to Avoid

**Scenario 1:** "The API is slow, let me cache the message template in n8n"
- **Why it's wrong:** Creates version drift, breaks A/B testing, not reproducible
- **Correct approach:** Optimize API response time, add caching in the API

**Scenario 2:** "I'll add a fallback message if classification fails"
- **Why it's wrong:** Sends unintended messages, violates determinism
- **Correct approach:** Return error, log, alert, manual review

**Scenario 3:** "I'll use HeyReach's built-in personalization"
- **Why it's wrong:** Intelligence is now in HeyReach, not your API
- **Correct approach:** API generates fully personalized message, HeyReach sends it verbatim

**Scenario 4:** "I'll add logic to skip weekends in n8n"
- **Why it's wrong:** Business logic in orchestrator, not intelligence layer
- **Correct approach:** API checks schedule, sets state accordingly

---

## ✅ Correct Wiring Pattern

**What n8n SHOULD do:**
1. Listen for webhooks (triggers)
2. Call API endpoints (HTTP requests)
3. Read API responses (parse JSON)
4. Route based on responses (switch/if nodes)
5. Call external services (HeyReach, Slack, etc.)
6. Log results

**What n8n should NEVER do:**
1. Generate message content
2. Decide intent from message text
3. Apply business rules
4. Store prompt templates
5. Make sending decisions
6. Modify API responses

**Golden Rule:**
> If you're typing a prompt, classification rule, or message template into n8n, you're doing it wrong. Stop. Move it to the API.

---

## 📐 System Architecture

```
                     ┌─────────────────┐
                     │   HeyReach      │
                     │ (LinkedIn Msgs) │
                     └────────┬────────┘
                              │
                              │ Webhooks
                              ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   n8n        │────▶│  LinkedIn API   │────▶│   PostgreSQL     │
│ (Workflows)  │     │ (Intelligence)  │     │   (Database)     │
└──────────────┘     └─────────────────┘     └──────────────────┘
                              │
                              │
                     ┌────────▼────────┐
                     │   Anthropic     │
                     │ (Classification)│
                     └─────────────────┘
```

**Data Flow:**
1. HeyReach → n8n webhook (new reply received)
2. n8n → API: Classify intent
3. API → Anthropic Claude: Get classification
4. API → PostgreSQL: Update lead state
5. API → n8n: Return classification result
6. n8n → Decision: Route based on intent
7. n8n → HeyReach: Send follow-up (if needed)

---

## ✅ What's Already Built

### 1. LinkedIn Intelligence API
**Repository:** `fleetconnect/linkedin`
**Branch:** `claude/classify-reply-intent-I3wT0`
**Status:** ✅ Complete, ready to deploy

**Location Options:**
- **Local:** Running on `http://localhost:3000` (for testing)
- **Production:** Deploy to Render via Blueprint (see `docs/render-deployment.md`)

**What it does:**
- Classifies LinkedIn reply intent (positive/negative/neutral/interested)
- Manages lead state machine (NEW → QUALIFIED → READY_TO_SEND → CONTACTED → REPLIED → INTERESTED/LOST)
- Stores all data in PostgreSQL (transactional, concurrency-safe)
- Applies messaging rules (max messages/day, tone, personalization)
- Generates follow-up messages (optional, with Perplexity research)

**Key Files:**
- `src/api/routes.ts` - All API endpoints
- `src/controllers/ClassificationController.ts` - Intent classification logic
- `src/services/LLMService.ts` - Claude integration
- `src/db/schema.ts` - PostgreSQL schema
- `render.yaml` - Infrastructure-as-code (Render deployment)

### 2. Database Schema
**Tables:**
- `campaigns` - Campaign configuration
- `leads` - Lead entities with state
- `messages` - Conversation history
- `classifications` - Intent classification results
- `research_snapshots` - Company research data

**Current Test Data:**
- Campaign ID: `91f7072f-5e44-4372-84bc-423504823906`
- Campaign Name: "PostgreSQL Test Campaign"

### 3. n8n Workflows
**Status:** ⏳ Created in n8n, needs wiring

**Workflows to wire:**
1. Lead Import (HeyReach → API)
2. Outreach Delivery (API → HeyReach)
3. Reply Classification (HeyReach → API → Decision)
4. Follow-up Automation (API → HeyReach)

### 4. DigitalOcean Agent
**Status:** ⏳ Created, needs configuration

---

## 🔌 What Needs to be Wired

### Step 1: Deploy API to Production

**Option A: Render (Recommended)**
1. Go to https://render.com
2. New + → Blueprint
3. Select repo: `fleetconnect/linkedin`
4. Branch: `main` or `claude/classify-reply-intent-I3wT0`
5. Click Apply
6. Add secrets:
   - `ANTHROPIC_API_KEY=sk-ant-api03-...`
   - `PERPLEXITY_API_KEY=pplx-...` (optional)
7. Get production URL: `https://linkedin-api.onrender.com`

**Option B: DigitalOcean (Alternative)**
If deploying to DigitalOcean instead:
1. Use App Platform or Droplet
2. Set environment variables (see `.env.example`)
3. Ensure PostgreSQL is provisioned
4. Run `npm run db:migrate`

**Verification:**
```bash
curl https://YOUR-API-URL/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

### Step 2: Configure n8n HTTP Nodes

**API Base URL:** Replace all instances with your production URL

**Critical Endpoints:**

**1. Create Lead**
```
Method: POST
URL: https://YOUR-API-URL/api/leads
Headers:
  Content-Type: application/json
Body:
{
  "name": "{{ $json.name }}",
  "email": "{{ $json.email }}",
  "company": "{{ $json.company }}",
  "linkedinUrl": "{{ $json.linkedinUrl }}",
  "campaignId": "91f7072f-5e44-4372-84bc-423504823906"
}
```

**2. Classify Reply**
```
Method: POST
URL: https://YOUR-API-URL/api/classify
Headers:
  Content-Type: application/json
Body:
{
  "leadId": "{{ $json.leadId }}",
  "messageContent": "{{ $json.message }}"
}
Response:
{
  "success": true,
  "data": {
    "classification": {
      "intent": "positive" | "negative" | "neutral" | "interested",
      "confidence": 0.95,
      "reasoning": "..."
    },
    "newState": "INTERESTED",
    "timestamp": "..."
  }
}
```

**3. Get Leads Ready to Send**
```
Method: GET
URL: https://YOUR-API-URL/api/leads?state=READY_TO_SEND
Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "...",
      "state": "READY_TO_SEND",
      "campaignId": "..."
    }
  ]
}
```

**4. Update Lead State (After HeyReach Sends)**
```
Method: PATCH
URL: https://YOUR-API-URL/api/integrations/webhook/state-update
Headers:
  Content-Type: application/json
Body:
{
  "leadId": "{{ $json.leadId }}",
  "state": "CONTACTED",
  "messageId": "{{ $json.messageId }}",
  "sentAt": "{{ $json.sentAt }}"
}
```

---

### Step 3: Configure HeyReach Webhooks

**Webhook URLs (point to n8n):**

**1. New Reply Received**
```
Webhook URL: https://YOUR-N8N-URL/webhook/heyreach-reply
Method: POST
Payload:
{
  "leadId": "...",
  "message": "...",
  "timestamp": "...",
  "conversationId": "..."
}
```

**2. Message Sent**
```
Webhook URL: https://YOUR-N8N-URL/webhook/heyreach-sent
Method: POST
Payload:
{
  "leadId": "...",
  "messageId": "...",
  "sentAt": "...",
  "status": "delivered"
}
```

---

### Step 4: Wire n8n Workflows

**Workflow 1: Lead Import**
```
Trigger: HeyReach Webhook (new lead added)
  ↓
HTTP Request: POST /api/leads (create in API)
  ↓
Set Variable: Save leadId for tracking
  ↓
(Optional) Slack/Email: Notify team
```

**Workflow 2: Outreach Delivery**
```
Trigger: Schedule (every hour)
  ↓
HTTP Request: GET /api/leads?state=READY_TO_SEND
  ↓
For Each Lead:
  ↓
  HTTP Request: HeyReach API (send message)
  ↓
  HTTP Request: PATCH /api/integrations/webhook/state-update (mark CONTACTED)
  ↓
  Wait: 30 seconds (rate limiting)
```

**Workflow 3: Reply Classification**
```
Trigger: HeyReach Webhook (new reply)
  ↓
HTTP Request: POST /api/classify
  ↓
Switch Node: Based on intent
  ├─ positive → Notify sales team
  ├─ interested → Schedule meeting
  ├─ neutral → Continue sequence
  └─ negative → Mark as LOST
```

**Workflow 4: Follow-up Automation**
```
Trigger: Schedule (daily)
  ↓
HTTP Request: GET /api/leads?state=INTERESTED
  ↓
For Each Lead:
  ↓
  HTTP Request: POST /api/leads/:leadId/draft-followup
  ↓
  HTTP Request: HeyReach API (send follow-up)
  ↓
  HTTP Request: PATCH /api/integrations/webhook/state-update
```

---

## 🧪 Testing Procedures

### Test 1: API Health
```bash
curl https://YOUR-API-URL/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test 2: Create Campaign
```bash
curl -X POST https://YOUR-API-URL/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "messaging_rules": {
      "personalization": true,
      "maxMessagesPerDay": 10,
      "researchRequired": false,
      "toneOfVoice": "professional"
    }
  }'
# Save the returned campaign ID
```

### Test 3: Create Lead
```bash
curl -X POST https://YOUR-API-URL/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "company": "Test Corp",
    "linkedinUrl": "https://linkedin.com/in/test",
    "campaignId": "YOUR_CAMPAIGN_ID"
  }'
# Save the returned lead ID
```

### Test 4: Classify Intent
```bash
curl -X POST https://YOUR-API-URL/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "YOUR_LEAD_ID",
    "messageContent": "Thanks for reaching out! I am definitely interested in learning more."
  }'
# Expected: intent="interested", newState="INTERESTED"
```

### Test 5: n8n → API Connection
1. Create simple workflow in n8n
2. HTTP Request node → GET /api/health
3. Execute workflow
4. Verify response

### Test 6: End-to-End Flow
1. Import lead via n8n
2. Mark lead as READY_TO_SEND
3. Trigger outreach workflow
4. Simulate reply via HeyReach webhook
5. Verify classification updates lead state
6. Check database for state changes

---

## 🔑 Required Credentials

### API (Render Environment Variables)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
PERPLEXITY_API_KEY=pplx-...  # Optional
STORAGE_TYPE=postgres
DATABASE_URL=<auto-wired by Render>
NODE_ENV=production
PORT=3000
```

### n8n
- Access URL: Your n8n instance URL
- Webhook endpoints configured
- HTTP nodes authenticated (if needed)

### HeyReach
- API Key/Token
- Webhook URLs pointing to n8n
- LinkedIn account connected

---

## 📊 Monitoring & Debugging

### API Logs
**Location:** Render Dashboard → linkedin-api → Logs

**What to look for:**
```
✅ PostgreSQL storage initialized
✅ Database connected
✅ Server running on port 3000
```

**Errors to watch:**
```
❌ Database connection failed
❌ Classification failed
❌ Invalid state transition
```

### n8n Logs
- Check execution history for each workflow
- Look for HTTP request failures
- Verify webhook triggers are firing

### Database Queries
```bash
# Connect via Render Shell or pgAdmin
SELECT id, name, state, updated_at FROM leads ORDER BY updated_at DESC LIMIT 10;
SELECT * FROM classifications WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 🚨 Common Issues & Solutions

### Issue 1: API Returns 404
**Symptom:** All routes return 404
**Solution:**
- Check API is deployed correctly
- Verify `npm run build` succeeded
- Check logs for startup errors

### Issue 2: Classification Fails
**Symptom:** "Invalid API key" or timeout
**Solution:**
- Verify `ANTHROPIC_API_KEY` is set in Render
- Check Claude API quota/limits
- Review classification logs

### Issue 3: State Transition Error
**Symptom:** "Invalid state transition"
**Solution:**
- Check current lead state
- Verify transition is allowed (see state machine)
- Use `skipStateValidation: true` if intentional

### Issue 4: n8n Can't Reach API
**Symptom:** Connection timeout or refused
**Solution:**
- Verify API URL is correct (https://)
- Check API is deployed and running
- Test with curl from n8n server

### Issue 5: HeyReach Webhook Fails
**Symptom:** Webhook doesn't trigger n8n
**Solution:**
- Verify webhook URL is accessible
- Check n8n webhook trigger is active
- Test with curl/Postman

---

## 📚 Key Documentation

**In Repository:**
- `docs/api-reference.md` - Complete API documentation
- `docs/render-deployment.md` - Deployment guide
- `docs/n8n-integration-setup.md` - n8n setup guide
- `docs/observability.md` - Monitoring guide
- `docs/database-migration.md` - Database guide

**External:**
- Render Docs: https://render.com/docs/infrastructure-as-code
- n8n Docs: https://docs.n8n.io
- HeyReach API: (check HeyReach documentation)

---

## 🎯 Success Criteria

**System is wired when:**
- ✅ API deployed and health check responds
- ✅ PostgreSQL connected and tables created
- ✅ n8n can create leads via API
- ✅ n8n can classify replies via API
- ✅ HeyReach webhooks reach n8n
- ✅ Lead state transitions work correctly
- ✅ End-to-end flow completes without errors

**Test with:**
1. Import 1 test lead
2. Classify 1 test reply
3. Verify state updates in database
4. Send 1 message via HeyReach
5. Receive and classify 1 reply
6. Confirm full cycle works

---

## 🔄 State Machine Reference

```
NEW
  ↓ (qualification)
QUALIFIED
  ↓ (messaging rules met)
READY_TO_SEND
  ↓ (message sent via HeyReach)
CONTACTED
  ↓ (reply received)
REPLIED
  ↓ (classification)
  ├─ INTERESTED (positive/interested intent)
  ├─ NURTURE (neutral intent)
  └─ LOST (negative intent)
```

**Valid Transitions:**
- NEW → QUALIFIED
- QUALIFIED → READY_TO_SEND
- READY_TO_SEND → CONTACTED
- CONTACTED → REPLIED
- REPLIED → INTERESTED
- REPLIED → NURTURE
- REPLIED → LOST
- Any state → LOST (manual disqualification)

---

## 💡 Tips for Your AI Assistant

1. **Start Simple:**
   - Wire one workflow at a time
   - Test each connection before moving on
   - Use curl to verify API responses

2. **Use Test Data:**
   - Campaign ID: `91f7072f-5e44-4372-84bc-423504823906`
   - Create fake leads for testing
   - Don't use real LinkedIn data initially

3. **Check Logs Frequently:**
   - API logs in Render
   - n8n execution history
   - Database for state changes

4. **Follow the Blueprint Method:**
   - NEVER manually create Render services
   - Always use render.yaml
   - Let Render wire DATABASE_URL automatically

5. **Test Incrementally:**
   - API health → Create campaign → Create lead → Classify → Full flow
   - Don't skip steps
   - Verify each step works before proceeding

---

## 🚀 Next Actions

**Immediate:**
1. Deploy API to Render via Blueprint
2. Get production API URL
3. Update n8n HTTP nodes with API URL
4. Test API health endpoint
5. Create test campaign via API

**Then:**
6. Wire first n8n workflow (Lead Import)
7. Test lead creation
8. Wire classification workflow
9. Test reply classification
10. Wire HeyReach webhooks
11. Test end-to-end flow

**Finally:**
12. Monitor for 24 hours
13. Fix any issues
14. Scale to production data

---

**You have everything needed to wire this system. Good luck!** 🚀
