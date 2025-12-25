# Human Approval Boundary

**AI Executive Outbound OS**

## Purpose

This document defines exactly where automation stops and human judgment begins inside the AI Executive Outbound OS.

**The Human Approval Boundary is what makes this system:**
- Safe to operate
- Defensible to clients
- Licensable at scale
- Resistant to spam behavior

> The system may suggest.
> Only humans may decide.

---

## Core Definition

**The Human Approval Boundary is crossed when:**

> A message would be sent after a prospect has replied.

From that moment forward, no message may be sent without explicit human approval.

**This is absolute.**

---

## What Automation Is Allowed to Do (Before the Boundary)

### ✅ Allowed Without Human Approval

**Before any prospect reply exists:**

- Generate initial outreach messages
- Decide who is eligible for first contact
- Decide when a first message is appropriate
- Send first messages via HeyReach
- Update state from READY_TO_SEND → CONTACTED

**Rationale:**
There is no active conversation yet.
Risk is limited and reversible.

---

## What Automation May Do (After the Boundary, With Restrictions)

**Once a prospect has replied (any reply):**

### ⚠️ Allowed Only as Suggestions

- Classify reply intent
- Summarize conversation context
- Suggest a follow-up message
- Recommend WAIT vs FOLLOW-UP
- Explain why a follow-up might be appropriate

**Strict Rule:**

> These actions must never arm a send.

---

## What Automation Must NEVER Do (After the Boundary)

### ❌ Explicitly Prohibited

**After a reply exists, the system must never:**

- Send a message automatically
- Modify a message after human approval
- Decide timing of follow-up execution
- Escalate urgency
- Override a human rejection
- Retry after rejection
- "Improve" a human-edited message

**If any of the above occurs → system violation.**

---

## Human Approval Actions (Explicit)

A human must choose one of the following:

### ✅ Approve & Send
- Message is sent verbatim
- State transitions are logged
- Conversation continues

### ✏️ Edit & Send
- Human edits content
- Edited content becomes the source of truth
- System does not rephrase or optimize

### ❌ Reject
- No message is sent
- System records rejection reason
- Lead returns to WAIT state

### ⏸️ Snooze
- Human defers decision
- API re-evaluates later
- No automatic send occurs

---

## Boundary Enforcement Points (System-Level)

The boundary must be enforced at multiple layers:

### API Layer (Primary Enforcement)
- Follow-up endpoints never send
- Suggest endpoints never change state to READY_TO_SEND
- Eligibility endpoints bias toward WAIT

### n8n Layer (Secondary Enforcement)
- No HeyReach send node after reply without approval signal
- No fallback sends
- No "temporary" auto-send logic

### UI / Slack Layer
- Buttons required for action
- No hidden defaults
- Silence is treated as NO

---

## Non-Negotiable Bias Rules

When unsure, the system must default to:

- **WAIT**
- **Silence**
- **Human review**

> A missed follow-up is acceptable.
> A forced follow-up is not.

---

## Why This Boundary Exists (Important)

**Outbound fails when:**
- Automation pretends to be human
- Systems chase momentum instead of meaning
- Replies are treated as triggers instead of conversations

**This boundary ensures:**
- Respect for real humans
- Protection of LinkedIn accounts
- Trust with prospects
- High-quality sales conversations

---

## Violation Examples (Do Not Justify)

❌ "It was only a soft follow-up"
❌ "The model was confident"
❌ "We needed to keep momentum"
❌ "The client wanted it automated"

**None of these override the boundary.**

---

## Audit & Logging Requirements

Every post-reply message must log:
- Who approved it
- When it was approved
- Which prompt version suggested it
- Whether it was edited

**If this cannot be reconstructed → the system is non-compliant.**

---

## Final Rule (The One That Matters)

> Automation earns the right to speak once.
> After that, humans decide.

This boundary is not a feature.
It is the line that keeps the system ethical, scalable, and real.
