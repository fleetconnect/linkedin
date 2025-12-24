# n8n Workflow Designs (OS-Compliant)

**The correct 4 workflows that respect human approval and architectural boundaries**

---

## 🔒 Core Principles (Before Building Anything)

**Rule 1:** Initial messages = auto-send (if READY_TO_SEND)
**Rule 2:** Follow-ups after reply = human approval REQUIRED
**Rule 3:** n8n never decides timing, content, or recipients
**Rule 4:** API is the source of truth for all intelligence

---

## ✅ Workflow 1: Lead Import from HeyReach

**Purpose:** Import new leads into the system

**Trigger:** HeyReach webhook (new lead added)

```
┌─────────────────────┐
│   Webhook Trigger   │ ← HeyReach sends new lead data
│  /webhook/new-lead  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  POST /api/leads    │ ← Create lead in API
│                     │
│  Body:              │
│  {                  │
│    "name": "{{...}}"│
│    "email": "{{...}}"│
│    "company": "{{...}}"│
│    "linkedinUrl": "{{...}}"│
│    "campaignId": "{{...}}"│
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Set Variable      │ ← Save leadId
│  leadId = {{...}}   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Slack (Optional)  │ ← Log import
│  "Lead imported"    │
└─────────────────────┘
```

**n8n Nodes:**

1. **Webhook Trigger**
   - Path: `/webhook/new-lead`
   - Method: POST

2. **HTTP Request**
   - URL: `{{$env.API_BASE_URL}}/api/leads`
   - Method: POST
   - Body: Pass through HeyReach data

3. **Set Variable**
   - Name: `leadId`
   - Value: `{{$json.data.id}}`

**✅ What this does:** Intake only
**❌ What this does NOT do:** Qualify, score, or decide

---

## ✅ Workflow 2: Initial Outreach Delivery

**Purpose:** Send first messages to qualified leads

**Trigger:** Schedule (hourly)

**CRITICAL:** This only sends initial messages (no prior conversation)

```
┌─────────────────────┐
│  Schedule Trigger   │ ← Every hour
│   Cron: 0 * * * *   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  GET /api/leads     │ ← Get leads ready for FIRST contact
│  ?state=READY_TO_   │
│   SEND              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Split In Batches  │ ← Process one at a time
│   Batch Size: 1     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  HeyReach API       │ ← Send message
│  POST /send         │
│                     │
│  Body:              │
│  {                  │
│    "leadId": "{{...}}"│
│    "message": "{{$json.messageContent}}"│
│  }                  │    ↑ FROM API ONLY
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  PATCH /api/.../    │ ← Mark as CONTACTED
│  state-update       │
│                     │
│  Body:              │
│  {                  │
│    "leadId": "{{...}}"│
│    "state": "CONTACTED"│
│    "messageId": "{{...}}"│
│    "sentAt": "{{$now}}"│
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Wait              │ ← Rate limit
│   30 seconds        │
└─────────────────────┘
```

**n8n Nodes:**

1. **Schedule Trigger**
   - Cron: `0 * * * *`

2. **HTTP Request (Get Leads)**
   - URL: `{{$env.API_BASE_URL}}/api/leads?state=READY_TO_SEND`
   - Method: GET

3. **Split In Batches**
   - Batch size: 1

4. **HTTP Request (HeyReach)**
   - URL: HeyReach send endpoint
   - Method: POST
   - Body: Lead ID + message from API response

5. **HTTP Request (Update State)**
   - URL: `{{$env.API_BASE_URL}}/api/integrations/webhook/state-update`
   - Method: PATCH

**✅ What this does:** Executes first touches only
**❌ What this does NOT do:** Send follow-ups, decide content, skip weekends

---

## ✅ Workflow 3: Reply Classification

**Purpose:** Classify incoming replies and route visibility

**Trigger:** HeyReach webhook (reply received)

```
┌─────────────────────┐
│   Webhook Trigger   │ ← HeyReach: reply received
│  /webhook/reply     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  POST /api/classify │ ← Classify intent
│                     │
│  Body:              │
│  {                  │
│    "leadId": "{{...}}"│
│    "messageContent": "{{...}}"│
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Switch Node       │ ← Route based on intent
│  {{$json.data.      │
│   classification.   │
│   intent}}          │
└─────┬───┬───┬───────┘
      │   │   │
  ┌───┘   │   └───┐
  │       │       │
  ▼       ▼       ▼
┌─────┐ ┌────┐ ┌────┐
│ POS │ │NEU │ │NEG │
│     │ │    │ │    │
│Slack│ │Log │ │Log │
│Alert│ │    │ │    │
└─────┘ └────┘ └────┘
```

**n8n Nodes:**

1. **Webhook Trigger**
   - Path: `/webhook/reply`
   - Method: POST

2. **HTTP Request (Classify)**
   - URL: `{{$env.API_BASE_URL}}/api/classify`
   - Method: POST

3. **Switch Node**
   - Output: `{{$json.data.classification.intent}}`
   - Routes:
     - `positive` → Slack alert
     - `interested` → Slack alert
     - `neutral` → Log only
     - `negative` → Log only

4. **Slack Notification** (for positive/interested only)
```json
{
  "channel": "#sales",
  "text": "🔥 {{$json.data.classification.intent}} reply from {{$json.data.leadName}}\n\nMessage: {{$json.data.message}}\n\nReasoning: {{$json.data.classification.reasoning}}"
}
```

**✅ What this does:** Routes visibility, alerts humans
**❌ What this does NOT do:**
- ❌ Send calendar links
- ❌ Book meetings
- ❌ Send follow-ups
- ❌ Make decisions

---

## ✅ Workflow 4: Follow-up Recommendation (Human-in-the-Loop)

**Purpose:** Suggest follow-ups for human approval

**Trigger:** Schedule (daily or on-demand)

**CRITICAL:** This NEVER auto-sends. Always requires human approval.

**CRITICAL:** API may return `WAIT` - this is a valid outcome, not an error.

```
┌─────────────────────┐
│  Schedule Trigger   │ ← Daily at 9 AM
│   Cron: 0 9 * * *   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  GET /api/leads/    │ ← API decides who needs follow-up
│  eligible-for-      │   (timing logic in API)
│  followup           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Split In Batches  │ ← Process each eligible lead
│   Batch Size: 1     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HTTP Request      │
│  POST /api/leads/   │ ← Generate suggestion OR WAIT
│  :id/suggest-       │   (does NOT set READY_TO_SEND)
│  followup           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Switch Node       │ ← Check action field
│  {{$json.data.      │
│   action}}          │
└─────┬───────┬───────┘
      │       │
   SUGGEST   WAIT
      │       │
      ▼       ▼
┌──────────┐ ┌────────┐
│  Slack   │ │  End   │ ← Silence is valid
│  Approval│ │  (Log) │
│  with    │ └────────┘
│  Buttons │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Wait for │ ← Human decision required
│ Button   │
└────┬─────┘
     │
     ▼
┌──────────┐
│ If       │
│ Approved │
│ → Send   │
│ via      │
│ HeyReach │
└──────────┘
```

**n8n Nodes:**

1. **Schedule Trigger**
   - Cron: `0 9 * * *` (or on-demand via webhook)

2. **HTTP Request (Get Eligible Leads)**
   - URL: `{{$env.API_BASE_URL}}/api/leads/eligible-for-followup`
   - Method: GET
   - **Note:** API decides eligibility (not n8n)
   - **May return 0 leads** - this is valid

3. **Split In Batches**
   - Batch Size: 1
   - Process each eligible lead

4. **HTTP Request (Suggest Follow-up)**
   - URL: `{{$env.API_BASE_URL}}/api/leads/{{$json.leadId}}/suggest-followup`
   - Method: POST
   - **Returns:**
     ```json
     // Option 1: SUGGEST
     {
       "success": true,
       "data": {
         "action": "SUGGEST",
         "suggestedMessage": "...",
         "reasoning": "...",
         "confidence": "high|medium|low"
       }
     }

     // Option 2: WAIT (silence is valid)
     {
       "success": true,
       "data": {
         "action": "WAIT",
         "reasoning": "Last response was a polite brush-off..."
       }
     }
     ```

5. **Switch Node** (based on action)
   - Route 0: `action === "SUGGEST"` → Continue to Slack
   - Route 1: `action === "WAIT"` → End workflow (log only)

6. **Slack Interactive Message** (only if SUGGEST)
```json
{
  "channel": "#sales",
  "text": "Follow-up recommendation for {{$json.data.metadata.leadName}}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Lead:* {{$json.data.metadata.leadName}}\n*Company:* {{$json.data.metadata.company}}\n*State:* {{$json.data.metadata.state}}\n*Intent:* {{$json.data.metadata.lastIntent}}\n*Sentiment:* {{$json.data.metadata.lastSentiment}}\n*Confidence:* {{$json.data.confidence}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Reasoning:*\n{{$json.data.reasoning}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Suggested Message:*\n{{$json.data.suggestedMessage}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "✅ Approve & Send"},
          "value": "approve",
          "action_id": "approve_followup",
          "style": "primary"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "✏️ Edit & Send"},
          "value": "edit",
          "action_id": "edit_followup"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "❌ Reject"},
          "value": "reject",
          "action_id": "reject_followup",
          "style": "danger"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "⏸️ Snooze 3 days"},
          "value": "snooze",
          "action_id": "snooze_followup"
        }
      ]
    }
  ]
}
```

7. **Wait for Slack Response**
   - Webhook trigger for Slack button response

8. **Switch Node** (based on button clicked)
   - Route 0: Approve → Send via HeyReach
   - Route 1: Edit → Show edit modal, then send
   - Route 2: Reject → Log and do nothing
   - Route 3: Snooze → Update API (snooze until date)

9. **HTTP Request (Send if Approved)**
   - Only executes if approved/edited
   - URL: HeyReach send endpoint
   - Body: Approved message

10. **HTTP Request (Update State)**
    - URL: `{{$env.API_BASE_URL}}/api/leads/{{$json.leadId}}/state`
    - Only after successful send
    - Body: `{"state": "CONTACTED", "sentAt": "{{$now}}", "messageId": "..."}`

**✅ What this does:** Recommends, respects WAIT, requires human approval for SUGGEST
**❌ What this does NOT do:**
- ❌ Auto-send anything
- ❌ Decide timing (API decides)
- ❌ Bypass human approval
- ❌ Force sends when API says WAIT
- ❌ Treat WAIT as an error

**Key Difference from Other Workflows:**
- API may return `action: "WAIT"` and workflow just logs it and ends
- Silence is a first-class, valid outcome
- No Slack message if API says WAIT

---

## 🚫 What Moved to the API

These decisions now live in the API (NOT n8n):

| Decision | Where It Lives |
|----------|----------------|
| Is follow-up appropriate? | ✅ API |
| When to follow up? | ✅ API |
| Should we wait? | ✅ API |
| Is silence better? | ✅ API |
| Is meeting ask allowed? | ✅ API |
| Message content | ✅ API |
| Personalization | ✅ API |
| Timing rules | ✅ API |

n8n only:
- Fetches suggestions
- Presents to human
- Executes human decision

---

## 📋 API Endpoints Required

### New Endpoint Needed:

**GET /api/leads/eligible-for-followup**
```json
// Returns leads that MIGHT need follow-up
// API decides eligibility based on:
// - Time since last contact
// - Current state
// - Campaign rules
// - Conversation context
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "...",
      "state": "INTERESTED",
      "lastContactedAt": "...",
      "classification": "positive",
      "conversationContext": "..."
    }
  ]
}
```

**POST /api/leads/:leadId/suggest-followup**
```json
// Generates suggested follow-up
// Does NOT change state
// Does NOT mark as READY_TO_SEND
{
  "success": true,
  "data": {
    "leadId": "...",
    "suggestedMessage": "Hi {{name}}, following up on...",
    "reasoning": "Lead showed interest in...",
    "recommendedTiming": "now" | "wait_3_days" | "wait_1_week"
  }
}
```

---

## 🔒 Final Litmus Test

Ask this about every workflow:

> "Can this workflow cause a message to be sent after a prospect has replied, without a human approving it?"

**If YES:** Workflow is wrong. Fix it.
**If NO:** Workflow is safe.

---

## ✅ Correct Workflow Summary

| Workflow | Trigger | Auto-Send? | Human Approval? |
|----------|---------|------------|-----------------|
| 1. Lead Import | HeyReach webhook | N/A | No |
| 2. Initial Outreach | Schedule | ✅ Yes (first message only) | No |
| 3. Reply Classification | HeyReach webhook | ❌ Never | N/A (visibility only) |
| 4. Follow-up Recommendation | Schedule | ❌ Never | ✅ Required |

**Golden Rule:**
- First message = auto (if qualified)
- Everything after reply = human approval

---

**These workflows are now OS-compliant, safe, and licensable.** 🔒
