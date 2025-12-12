# Outbound AI System – Operator SOP

**Version**: 1.0
**Last Updated**: 2025-12-12
**Audience**: System Operators

---

## Overview

This SOP explains exactly how operators run, monitor, and control the AI outbound system for each client. Follow this step by step. **No improvisation is required.**

---

## 1. Operator Role & Responsibility

As an operator, your job is **not** to write copy, research leads, or tweak prompts.

### Your Responsibilities Are:

✅ Ensure each client is installed correctly
✅ Monitor system health
✅ Approve or reject positive replies
✅ Escalate issues early
✅ Report results clearly

**The system does the thinking. You manage outcomes.**

---

## 2. Tools You Will Use Daily

You will only interact with:

| Tool | Purpose |
|------|---------|
| **Slack** | Approvals & alerts |
| **Airtable** | Tracking positive replies |
| **HeyReach** | Visibility only (no editing) |
| **n8n dashboards** | Health checks |

### You Do NOT:
❌ Edit MCP prompts
❌ Change AI logic
❌ Manually send cold messages

---

## 3. Client Installation Checklist (Day 0–1)

### Step 1: Confirm Client Config

Verify the following are complete:

- [ ] ICP submitted via Jotform
- [ ] Offer description clear and specific
- [ ] Slack channel created (e.g. `#client-acme-replies`)
- [ ] Airtable base created and shared
- [ ] HeyReach account connected

**If anything is missing** → pause install and notify the manager.

### Step 2: Verify System Readiness

In n8n, confirm:

- [ ] Client config stored correctly (`config/clients/{client_id}.json`)
- [ ] Lead intake workflow enabled
- [ ] Reply handling workflow enabled
- [ ] Run a test lead if needed

**Status Check Command:**
```bash
npm run check:client -- --client-id=acme-corp
```

---

## 4. Daily Operator Workflow

### Daily Time Commitment

- **Low-volume clients**: 10–20 minutes/day
- **High-volume clients**: 30–45 minutes/day

---

### Step 1: Slack Check (Primary Task)

Open each client's Slack channel.

**You are looking for:**
- 🔥 **Positive Reply Detected** messages
- ⚠️ Safety or approval alerts

**Ignore:**
- System logs
- Non-positive replies (handled automatically)

---

### Step 2: Handle Positive Replies

For each Slack alert:

1. Read the prospect's reply
2. Read the AI-generated summary
3. Review the suggested reply draft
4. Choose ONE action:

---

#### ✅ **Approve & Send**

**Use when:**
- Prospect shows clear interest
- Draft sounds natural
- No pricing or legal risk

**Action:**
1. Click **Approve & Send**
2. System sends reply via HeyReach
3. Airtable status updates automatically

---

#### ✏️ **Approve with Edit**

**Use when:**
- Draft is mostly correct
- Minor tone or wording changes needed

**Action:**
1. Click **Approve with Edit**
2. Make small edits only (no rewrites)
3. Submit → message sends

**Editing Guidelines:**
- Fix typos or awkward phrasing
- Adjust tone slightly (more/less formal)
- Add one clarifying sentence max
- **Do NOT** rewrite entire message

---

#### ⛔ **Send Manually**

**Use when:**
- Prospect asks for pricing details
- Prospect requests a call immediately
- Client prefers human response

**Action:**
1. Click **Send Manually**
2. Reply directly in HeyReach or LinkedIn
3. Update Airtable notes if needed

---

#### ❌ **Dismiss**

**Use when:**
- Reply is vague with no intent
- Auto-reply or irrelevant response

**Action:**
1. Click **Dismiss**
2. No follow-up sent

**Examples of dismissable replies:**
- "Thanks for reaching out"
- "I'm currently out of office"
- Auto-replies with no substance

---

## 5. Airtable Management (Proof & Reporting)

Each positive reply is logged automatically.

### Operator Responsibilities

**Do:**
- Update notes only if needed
- Ensure status reflects reality

**Do NOT:**
- Delete records
- Change timestamps
- Modify AI-generated fields

### Status Field Values

| Status | Meaning |
|--------|---------|
| `new` | Just detected, awaiting approval |
| `approved` | Approved but not yet sent |
| `sent` | Reply sent successfully |
| `manual_followup` | Operator handling manually |
| `meeting_booked` | Calendar invite sent |
| `closed_won` | Deal closed |
| `closed_lost` | No longer interested |

**Airtable is the source of truth for results.**

---

## 6. Weekly Operator Tasks

### Once Per Week (Per Client)

- [ ] Review Airtable summary:
  - Total positive replies
  - Approved vs dismissed
  - Sent vs manual
- [ ] Check Slack for unresolved approvals
- [ ] Confirm campaigns are still active in HeyReach
- [ ] Report issues (if any) to manager

**You do not optimize campaigns unless instructed.**

### Weekly Report Template

```
CLIENT: Acme Corp
WEEK: Dec 4-10, 2025

METRICS:
- Positive Replies: 12
- Approved & Sent: 8
- Manual Follow-up: 3
- Dismissed: 1

ISSUES:
- None / [Describe any issues]

STATUS: ✅ Healthy / ⚠️ Needs Attention / 🚨 Critical
```

---

## 7. Common Issues & What To Do

### Issue: No Positive Replies for 7+ Days

**Do:**
1. Check Slack for blocked approvals
2. Confirm leads are flowing (check n8n logs)
3. Notify manager

**Do NOT:**
- Change copy
- Restart campaigns
- Edit ICP

**Likely Causes:**
- Campaign paused
- Lead flow stopped
- ICP too narrow (no quality leads)

---

### Issue: Too Many Approvals Needed

**Symptom:** 20+ pending approvals per day

**Do:**
1. Flag to manager
2. Mark examples in Airtable
3. Suggest pattern review

**Likely Cause:**
- ICP too broad
- Offer unclear
- Safety thresholds too strict

**Manager Action Required:**
- Adjust ICP scoring weights
- Refine offer messaging
- Update approval thresholds

---

### Issue: Spam / Account Risk Alerts

**Do:**
1. ⚠️ **Pause approvals immediately**
2. Notify manager with screenshot
3. Do NOT send any messages until cleared

**Do NOT:**
- Force sends
- Override safety flags
- Continue approving

**Examples of Risk Alerts:**
- "Message flagged as spam-like"
- "Account acceptance rate <30%"
- "Connection request limit reached"

**This is critical.** Account bans cost clients thousands.

---

### Issue: Reply Classification Seems Wrong

**Symptom:** Positive replies marked as "objection" or vice versa

**Do:**
1. Note specific examples in Airtable
2. Include both the reply text and classification
3. Report to manager weekly

**Manager Action Required:**
- Review classification accuracy
- Update classification rules if needed

---

## 8. What Operators Must NEVER Do

### Absolute Rules

❌ **Edit AI prompts** → Breaks system consistency
❌ **Change ICP rules** → Affects all clients
❌ **Send cold messages manually** → Bypasses safety
❌ **Bypass approval flow** → Legal/compliance risk
❌ **Ignore safety warnings** → Account bans
❌ **Delete Airtable records** → Loses proof of results
❌ **Promise specific outcomes** → Sets wrong expectations

**Violating these breaks the system and creates liability.**

---

## 9. Success Metrics for Operators

### You Are Successful If:

✅ Approvals are handled within 24 hours
✅ No unsafe messages are sent
✅ Airtable records are accurate
✅ Clients see consistent positive replies
✅ Issues are escalated early

### You Are NOT Judged On:

❌ Reply rate (system controls this)
❌ Copy quality (AI generates this)
❌ Campaign strategy (manager sets this)
❌ ICP match rate (configuration determines this)

**Your job is execution and oversight, not strategy.**

---

## 10. Escalation Rules

### Escalate Immediately If:

🚨 Client complains about messaging
🚨 Account safety warning appears
🚨 System errors block sending
🚨 Replies reference incorrect personalization
🚨 Legal or compliance concern
🚨 Pricing or contract questions from prospect

### How to Escalate

**Slack:** Use `@manager` in client channel with:
- Client name
- Issue description
- Screenshot (if applicable)
- Impact level (Low / Medium / High / Critical)

**Example:**
```
@manager [CRITICAL]
Client: Acme Corp
Issue: Safety alert - acceptance rate dropped to 28%
Impact: Cannot approve new messages until resolved
Screenshot: [attached]
```

---

## 11. Quality Control Checklist

Before approving ANY reply, verify:

- [ ] Draft is relevant to their reply
- [ ] Tone matches client preferences
- [ ] No obvious errors or placeholders
- [ ] No pricing/legal commitments (unless approved)
- [ ] No promises we can't keep
- [ ] Sounds human, not robotic

**If in doubt → Send Manually or Escalate.**

---

## 12. Training & Onboarding

### New Operator Onboarding

**Week 1: Shadow**
- Observe senior operator for 5 days
- Review 20+ reply approval decisions
- Ask questions

**Week 2: Assisted**
- Handle approvals with senior review
- Make 30+ approval decisions
- Learn escalation triggers

**Week 3: Solo (Low-Volume Client)**
- Manage 1-2 low-volume clients
- Daily check-ins with senior operator

**Week 4: Full Capacity**
- Manage assigned client load
- Weekly check-ins only

---

## 13. Operator Dashboard (Future)

**Coming Soon:**
- Real-time approval queue
- Client health scores
- Weekly performance summary
- One-click approval actions

---

## Final Rule

✅ **Trust the system.**
✅ **Protect the client.**
✅ **Approve with care.**

**If unsure — do not guess. Escalate.**

---

## Quick Reference Card

### Daily Checklist
1. ☐ Check Slack for positive replies
2. ☐ Approve/Edit/Manual/Dismiss each reply
3. ☐ Update Airtable notes if needed
4. ☐ Flag any issues to manager

### Approval Decision Tree
```
Is the reply positive?
  └─ Yes → Is draft appropriate?
      ├─ Yes → Approve & Send
      ├─ Mostly → Approve with Edit
      ├─ No → Send Manually
      └─ Complex → Escalate

  └─ No → Dismiss
```

### Emergency Contacts
- **Manager**: [Slack @manager]
- **Technical Issues**: [Slack #system-alerts]
- **Client Escalations**: [Email / Slack protocol]

---

**Document Version**: 1.0
**Next Review**: 2025-12-26
**Owner**: Operations Manager
