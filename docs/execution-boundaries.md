# Execution Boundaries

## 🔒 Locked Responsibility Lines

This document freezes the execution boundary to prevent scope creep and ensure clean licensability.

**DO NOT REVISIT THESE BOUNDARIES LATER.**

---

## The Boundary: READY_TO_SEND

Our system **STOPS** at `READY_TO_SEND` state.

Everything beyond this point is handled by external tools.

---

## Responsibility Matrix

### ✅ Our System (Intelligence Layer)

**What we do:**
- Intent classification (interested, booked, neutral, negative)
- Sentiment analysis
- Lead state management (up to READY_TO_SEND)
- Company research (Perplexity)
- Message generation (Claude)
- Follow-up drafting
- A/B testing hooks
- Conversation history tracking
- Analytics and reporting

**Where we stop:**
- State: `READY_TO_SEND`
- Output: Generated message content ready to send
- Storage: Message saved to `lead.conversationHistory`

**What we DON'T do:**
- ❌ Actually send LinkedIn messages
- ❌ Manage LinkedIn rate limits
- ❌ Handle LinkedIn authentication
- ❌ Track LinkedIn compliance
- ❌ Schedule message delivery
- ❌ Monitor LinkedIn account health

---

### 🚀 HeyReach (Execution Layer)

**What HeyReach does:**
- Sends messages to LinkedIn
- Manages rate limits (messages per day, per hour)
- Handles LinkedIn compliance
- Tracks delivery status
- Manages LinkedIn sessions
- Monitors account health
- Handles CAPTCHAs and challenges

**Integration point:**
- Listens for leads in `READY_TO_SEND` state
- Pulls message content from `lead.conversationHistory`
- Updates lead state to `CONTACTED` after sending
- Reports delivery failures back

---

### 🔗 n8n (Orchestration Layer)

**What n8n does:**
- Orchestrates workflow between systems
- Triggers message generation when needed
- Polls for `READY_TO_SEND` leads
- Calls HeyReach API to send messages
- Updates lead states after actions
- Handles error recovery and retries
- Manages timing and scheduling

**Integration point:**
- Webhook triggers from our API
- Scheduled polls for eligible leads
- State updates via our API
- Error handling and notifications

---

## State Machine with Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│ OUR SYSTEM (Intelligence)                                    │
│                                                              │
│  NEW → QUALIFIED → Research → Message Gen → READY_TO_SEND   │
│   ↓                                              ↑           │
│  LOST ←──────────────────────────────────────────┘           │
│                                                              │
└──────────────────────────────────┬───────────────────────────┘
                                   │
                    🔒 EXECUTION BOUNDARY
                                   │
┌──────────────────────────────────┴───────────────────────────┐
│ EXTERNAL TOOLS (Execution + Orchestration)                   │
│                                                              │
│  READY_TO_SEND → [HeyReach sends] → CONTACTED               │
│                                         ↓                    │
│  REPLIED → [We classify] → INTERESTED → READY_TO_SEND        │
│                              ↓                               │
│                            BOOKED                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## API Contract

### Our Output (READY_TO_SEND)

When a lead reaches `READY_TO_SEND`, we provide:

```json
{
  "lead": {
    "id": "lead-123",
    "state": "READY_TO_SEND",
    "conversationHistory": [
      {
        "id": "msg-456",
        "content": "Hi {{firstName}}, I noticed...",
        "sender": "user",
        "timestamp": "2024-01-15T10:00:00Z",
        "variant": "A"
      }
    ],
    "research_snapshot": { ... },
    "lastClassification": null
  }
}
```

### External Tool Input

HeyReach/n8n polls for leads:

```bash
GET /api/leads?state=READY_TO_SEND
```

Response:
```json
{
  "leads": [
    {
      "id": "lead-123",
      "state": "READY_TO_SEND",
      "nextMessage": "Hi {{firstName}}, I noticed...",
      "variant": "A"
    }
  ]
}
```

### External Tool Updates State

After sending:

```bash
POST /api/leads/lead-123/state
{
  "state": "CONTACTED",
  "sentAt": "2024-01-15T10:05:00Z",
  "messageId": "msg-456"
}
```

---

## Integration Flow

### Initial Message Flow

1. **Lead enters system** → `NEW` state
2. **We qualify lead** → `QUALIFIED` state
3. **We research company** (if enabled) → Research snapshot saved
4. **We generate message** → Message in conversationHistory
5. **We set state** → `READY_TO_SEND` 🔒 **WE STOP HERE**
6. **n8n polls** → Finds `READY_TO_SEND` leads
7. **n8n calls HeyReach** → HeyReach sends to LinkedIn
8. **HeyReach confirms** → n8n updates lead to `CONTACTED`

### Reply Flow

1. **HeyReach detects reply** → Pulls message content
2. **n8n calls our API** → POST /api/classify
3. **We classify intent** → interested/booked/neutral/negative
4. **We advance state** → `REPLIED` → `INTERESTED` (if applicable)
5. **We generate follow-up** (if interested/neutral) → Message in history
6. **We set state** → `READY_TO_SEND` 🔒 **WE STOP HERE**
7. **n8n polls** → Finds follow-up ready
8. **n8n calls HeyReach** → Sends follow-up
9. **HeyReach confirms** → n8n updates state

---

## Why This Matters

### 1. Clean Licensability
- Our system is a **pure intelligence layer**
- No LinkedIn scraping or automation = No TOS violations
- Safe to license to enterprises
- Clear value proposition: "We do the thinking, you do the sending"

### 2. Prevents Scope Creep
- No requests to "add rate limiting"
- No requests to "handle LinkedIn auth"
- No requests to "send messages directly"
- Clear answer: "That's HeyReach's job"

### 3. Integration Flexibility
- Works with any sending tool (HeyReach, Phantombuster, custom)
- Works with any orchestrator (n8n, Zapier, Make)
- Works with any storage backend
- Pure API contract

### 4. Reduces Liability
- We never touch LinkedIn directly
- Users bring their own sending infrastructure
- Compliance is their responsibility
- We just provide intelligence

---

## Enforcement

### Code Level

The `READY_TO_SEND` state is enforced in:
- `src/types/index.ts` - State enum with clear boundary comment
- Controllers - Never transition beyond READY_TO_SEND
- API endpoints - Provide read-only access to READY_TO_SEND leads

### Documentation Level

All docs reference the boundary:
- README.md - State machine shows boundary
- Integration guides - Explain handoff
- API docs - Show where we stop

### Communication Level

When users ask about sending:
- ✅ "We generate the message and set state to READY_TO_SEND"
- ✅ "Your sending tool polls for READY_TO_SEND leads"
- ❌ "We can add LinkedIn sending for you"
- ❌ "We'll handle rate limits"

---

## External Tool Requirements

For a tool to integrate with our system:

**Required capabilities:**
1. Poll our API for `READY_TO_SEND` leads
2. Pull message content from conversationHistory
3. Send to LinkedIn (their responsibility)
4. Update lead state via our API after sending
5. Push replies back to our classification endpoint

**Example tools:**
- HeyReach (recommended)
- Phantombuster
- LinkedIn API wrappers
- Custom automation

---

## API Endpoints for External Tools

### Get Leads Ready to Send

```
GET /api/leads?state=READY_TO_SEND
```

Returns leads with messages ready to send.

### Update Lead State

```
POST /api/leads/:leadId/state
{
  "state": "CONTACTED",
  "sentAt": "ISO8601",
  "messageId": "string"
}
```

Updates state after external sending.

### Submit Reply for Classification

```
POST /api/classify
{
  "leadId": "string",
  "messageContent": "string"
}
```

Returns intent classification and may generate follow-up.

### Check for Follow-ups

```
GET /api/followup/campaign/:campaignId/eligible
```

Returns leads needing follow-ups (will be in READY_TO_SEND after generation).

---

## Future Additions (Still Within Boundary)

We CAN add:
- ✅ More sophisticated intent classification
- ✅ Better message personalization
- ✅ Advanced A/B testing
- ✅ Sentiment tracking
- ✅ Conversation analytics
- ✅ Research enhancements
- ✅ Multi-channel intelligence (email, Twitter, etc.)

We CANNOT add:
- ❌ Direct LinkedIn sending
- ❌ Rate limit management
- ❌ Account health monitoring
- ❌ Session management
- ❌ CAPTCHA solving

---

## Summary

**LOCK:** `READY_TO_SEND` is the execution boundary.

**OUR JOB:** Intelligence, decisions, state management, message generation.

**THEIR JOB:** Sending, limits, LinkedIn compliance, delivery.

**CLEAN HANDOFF:** API contract at READY_TO_SEND state.

**NEVER REVISIT:** These boundaries are frozen.

This makes the system:
- Licensable
- Focused
- Maintainable
- Compliant
- Valuable

**Any feature request that crosses this boundary should be rejected.**
