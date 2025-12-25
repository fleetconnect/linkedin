# Prompt Governance Document

**AI Executive Outbound OS**

## Purpose

This document defines how prompts are written, stored, modified, tested, and deployed within the AI Executive Outbound OS.

**The goal is simple:**

Protect messaging quality, system integrity, and long-term performance while enabling controlled iteration.

> Prompts are core intellectual property of this system.
> They are not configuration. They are not automation glue.
> **They are the product.**

---

## Core Principles (Non-Negotiable)

### 1. Prompts Live in the API — Nowhere Else

✅ **Prompts are stored in version-controlled code**

❌ **Prompts must never live in:**
- n8n
- HeyReach
- Slack
- Client dashboards
- Operator notes

**Golden Rule:**

> If it influences what is said to a prospect, it belongs in the API.

### 2. One Brain, Many Executors

- **The API is the only system allowed to reason**
- **n8n executes instructions, nothing more**
- **Humans approve or reject—never rewrite prompts directly**

This guarantees:
- Determinism
- Auditability
- Clean handoffs
- No prompt drift

### 3. Conservative by Default

All prompts must bias toward:
- Asking questions over explaining
- WAIT over SEND
- Curiosity over persuasion
- Fewer words over more words

> A missed message is acceptable.
> A wrong message is not.

---

## Prompt Taxonomy

### 1. System Prompts (Foundational)

**Define:**
- Agent role
- Tone constraints
- Behavioral rules
- Prohibited actions

**Examples:**
- Intent classification system prompt
- Follow-up suggestion system prompt
- Research synthesis system prompt

**These change rarely.**

### 2. Task Prompts (Operational)

**Used for:**
- Generating openers
- Suggesting follow-ups
- Interpreting replies
- Summarizing threads

**These change carefully and only after review.**

### 3. Output Constraints (Guardrails)

Every prompt must specify:
- Max length
- Prohibited phrases
- CTA rules
- Allowed ambiguity

**No prompt is valid without explicit output constraints.**

---

## Prompt Lifecycle

### Step 1: Proposal

A prompt change must include:
- What is changing
- Why it's changing
- Expected behavioral difference
- Failure modes it addresses

**No vague improvements allowed.**

### Step 2: Offline Testing

All prompts must be tested against:
- Neutral replies
- Curious but non-committal replies
- Polite disengagement
- Hard objections
- Time-wasting replies

**If it fails one scenario → revise.**

### Step 3: Shadow Deployment

New prompts run in suggest-only mode:
- No auto-send
- Human review required
- Slack visibility enabled

**Minimum observation window: 3–5 days.**

### Step 4: Promotion

Only after:
- No negative sentiment spikes
- No escalation complaints
- No tone regressions

**Promote to active use.**

---

## Change Control Rules

### Who Can Modify Prompts

✅ Core system owner
✅ Authorized dev partner (via PR)
❌ Never operators
❌ Never clients

### What Operators Can Do

✅ Approve / Reject suggestions
✅ Flag "Bad Suggestion"
✅ Leave feedback notes

**Operators cannot:**
- Rewrite prompts
- Hot-fix copy
- Add custom phrasing

### Versioning & Rollback

- Every prompt change must be versioned
- Rollback must be possible in <5 minutes
- Prompt version must be logged with:
  - Lead ID
  - Message ID
  - Timestamp

This enables:
- Post-mortems
- Client audits
- Performance analysis

### Performance Interpretation Rules

**Do not change prompts based on:**
- <50 replies
- One bad day
- One aggressive prospect
- Anecdotal feedback

**Prompts are evaluated on:**
- Conversation depth
- Reply continuation rate
- Human approval rate
- Time-to-meeting (not opens)

---

## Prohibited Prompt Practices

🚫 "Make it sound more salesy"
🚫 "Push harder for the meeting"
🚫 "Add urgency language"
🚫 "Handle objections more aggressively"
🚫 "Personalize more at all costs"

**If a prompt requires force, it's compensating for:**
- Bad targeting
- Bad ICP
- Bad sequencing

> Prompts should surface truth, not force outcomes.

---

## Prompt Quality Checklist (Before Any Deploy)

Every prompt must answer **YES** to all:

1. Would this sound normal if sent by a human?
2. Does this advance understanding, not pressure?
3. Is ambiguity allowed?
4. Does it avoid assuming intent?
5. Would silence be better than a bad send?

**If any answer is NO → do not deploy.**

---

## Final Rule (The One That Matters)

> Outbound performance is not an automation problem.
> It is a messaging discipline problem.

Prompt governance is how this system stays:
- **Defensible**
- **Scalable**
- **Licensable**
- **Trustworthy**
