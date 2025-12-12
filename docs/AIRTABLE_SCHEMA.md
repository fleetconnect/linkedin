# Airtable Base Schema for Operator Dashboard

## Overview

Each client gets their own Airtable base for tracking positive replies and outcomes.

---

## Table 1: Positive Replies

### Fields

| Field Name | Type | Description | Formula/Options |
|------------|------|-------------|-----------------|
| **Reply ID** | Single line text | Unique identifier | Auto-generated UUID |
| **Status** | Single select | Current status | Options: `new`, `approved`, `sent`, `manual_followup`, `meeting_booked`, `closed_won`, `closed_lost` |
| **Lead Name** | Single line text | Full name of prospect | From system |
| **Company** | Single line text | Company name | From system |
| **Title** | Single line text | Job title | From system |
| **Reply Date** | Date | When they replied | Auto-populated |
| **Their Reply** | Long text | Full reply text | From system |
| **Intent** | Single select | Classified intent | Options: `interested`, `timing`, `question`, `objection`, `not_interested` |
| **Sentiment** | Single select | Reply sentiment | Options: `positive`, `neutral`, `negative` |
| **Confidence** | Percent | AI confidence score | 0-100% |
| **Draft Reply** | Long text | AI-generated draft | From system |
| **Sent Reply** | Long text | Actual reply sent | Populated after send |
| **Operator** | Single line text | Who handled | Auto-populated |
| **Approval Date** | Date | When approved | Auto-populated |
| **Send Date** | Date | When sent | Auto-populated |
| **Thread URL** | URL | Link to conversation | HeyReach/LinkedIn URL |
| **Notes** | Long text | Operator notes | Manual entry |
| **Next Action** | Single select | Recommended next step | Options: `book_call`, `answer_question`, `nurture`, `close_lost`, `handoff` |
| **Meeting Scheduled** | Checkbox | Calendar invite sent | Manual check |
| **Meeting Date** | Date | When meeting is scheduled | Manual entry |
| **Deal Value** | Currency | Potential/actual deal size | Manual entry |
| **Tags** | Multiple select | Custom tags | Options: customizable per client |

---

## Table 2: Safety Alerts

### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| **Alert ID** | Single line text | Unique identifier |
| **Alert Date** | Date | When alert triggered |
| **Alert Type** | Single select | Type of alert (Options: `spam_risk`, `acceptance_rate`, `connection_limit`, `message_quality`, `account_health`) |
| **Severity** | Single select | Alert severity (Options: `warning`, `critical`) |
| **Details** | Long text | Full alert description |
| **Action Taken** | Long text | What operator did |
| **Resolved** | Checkbox | Is it resolved? |
| **Resolved Date** | Date | When resolved |
| **Resolved By** | Single line text | Who resolved it |

---

## Table 3: Weekly Summary

### Fields

| Field Name | Type | Description | Formula |
|------------|------|-------------|---------|
| **Week Start** | Date | Monday of week | - |
| **Week End** | Date | Sunday of week | - |
| **Total Positive Replies** | Number | Count of replies | Linked to Positive Replies table |
| **Approved & Sent** | Number | Approved count | `COUNTIF({Positive Replies}, {Status} = "sent")` |
| **Manual Follow-up** | Number | Manual count | `COUNTIF({Positive Replies}, {Status} = "manual_followup")` |
| **Dismissed** | Number | Dismissed count | `COUNTIF({Positive Replies}, {Status} = "dismissed")` |
| **Meetings Booked** | Number | Meeting count | `COUNTIF({Positive Replies}, {Meeting Scheduled} = TRUE)` |
| **Approval Rate** | Percent | % approved | `{Approved & Sent} / {Total Positive Replies}` |
| **Conversion Rate** | Percent | % to meeting | `{Meetings Booked} / {Total Positive Replies}` |
| **Issues** | Long text | Problems this week | Manual entry |
| **Status** | Single select | Week health | Options: `✅ Healthy`, `⚠️ Needs Attention`, `🚨 Critical` |
| **Operator Notes** | Long text | Weekly summary | Manual entry |

---

## Table 4: Lead Processing Log (Optional)

### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| **Batch ID** | Single line text | Lead batch identifier |
| **Upload Date** | Date | When leads uploaded |
| **Source** | Single select | Lead source (Options: `sales_nav`, `csv`, `heyreach`, `jotform`, `api`) |
| **Total Leads** | Number | Leads in batch |
| **ICP Kept** | Number | Passed ICP |
| **ICP Review** | Number | Needs review |
| **ICP Dropped** | Number | Failed ICP |
| **Average Fit Score** | Number | Mean ICP score |
| **Messages Generated** | Number | Messages created |
| **Messages Sent** | Number | Actually sent |
| **Status** | Single select | Batch status (Options: `processing`, `completed`, `failed`) |

---

## Views

### View 1: Pending Approvals
- **Filter**: `Status = "new"`
- **Sort**: `Reply Date` (oldest first)
- **Purpose**: Daily operator queue

### View 2: Sent This Week
- **Filter**: `Send Date >= "1 week ago"`
- **Sort**: `Send Date` (newest first)
- **Purpose**: Recent activity tracking

### View 3: Meetings Booked
- **Filter**: `Meeting Scheduled = TRUE`
- **Sort**: `Meeting Date` (upcoming first)
- **Purpose**: Conversion tracking

### View 4: Manual Follow-ups
- **Filter**: `Status = "manual_followup"`
- **Sort**: `Reply Date` (oldest first)
- **Purpose**: Operator action items

### View 5: High-Intent Replies
- **Filter**: `Intent = "interested"` AND `Confidence >= 80%`
- **Sort**: `Reply Date` (newest first)
- **Purpose**: Hot leads

---

## Automations

### Automation 1: New Reply Alert
- **Trigger**: When record created in Positive Replies
- **Action**: Send Slack notification to client channel
- **Include**: Lead name, company, their reply, draft reply, action buttons

### Automation 2: Weekly Summary
- **Trigger**: Every Monday 9am
- **Action**:
  1. Create new record in Weekly Summary
  2. Calculate metrics from previous week
  3. Send Slack summary to client channel

### Automation 3: Stale Approval Alert
- **Trigger**: Daily at 5pm
- **Condition**: `Status = "new"` AND `Reply Date > 24 hours ago`
- **Action**: Send Slack reminder to operator

---

## Integration with n8n

### n8n → Airtable Flow

1. **Reply Classifier** runs in n8n
2. **If intent = positive** → Create Airtable record
3. **Populate fields**:
   - Reply ID (UUID)
   - Status = "new"
   - Lead Name, Company, Title
   - Reply Date = now
   - Their Reply (full text)
   - Intent, Sentiment, Confidence
   - Draft Reply (from AI)
   - Thread URL (HeyReach)

4. **Trigger**: Slack notification via Airtable automation

### Airtable → n8n Flow (Future)

- Slack button clicks → Webhook to n8n
- n8n processes approval/edit/manual/dismiss
- n8n updates Airtable record with outcome

---

## Permissions

### Operator Role
- **Can view**: All records
- **Can edit**: Notes, Next Action, Meeting Scheduled, Meeting Date, Tags
- **Cannot edit**: System-generated fields (Reply ID, AI fields, timestamps)
- **Cannot delete**: Any records

### Manager Role
- **Can view**: All records
- **Can edit**: All fields
- **Can delete**: Records (with caution)
- **Can configure**: Views, automations, schema

---

## Reporting

### Daily Report (Operator)
```
Check Pending Approvals view
Handle each reply (approve/edit/manual/dismiss)
Update Notes if needed
```

### Weekly Report (Manager)
```
Review Weekly Summary table
Check Approval Rate (target: >60%)
Review Manual Follow-ups (should be <20%)
Check Meetings Booked trend
```

### Monthly Report (Client)
```
Total Positive Replies (all time)
Meetings Booked (all time + this month)
Conversion Rate trend
Top performing message angles (via Tags)
```

---

## Sample Data

### Example Positive Reply Record

| Field | Value |
|-------|-------|
| Reply ID | `reply_abc123` |
| Status | `sent` |
| Lead Name | Sarah Johnson |
| Company | TechCorp |
| Title | VP of Sales |
| Reply Date | 2025-12-10 |
| Their Reply | "Interesting timing — we're actually looking at this for Q1. Can you send over pricing?" |
| Intent | interested |
| Sentiment | positive |
| Confidence | 85% |
| Draft Reply | "Great timing! I'll send over our pricing structure. Would a 15-min call this week help contextualize it for your specific situation?" |
| Sent Reply | "Great timing! I'll send over our pricing structure. Would a 15-min call this week help..." (slightly edited) |
| Operator | jane.doe |
| Approval Date | 2025-12-10 |
| Send Date | 2025-12-10 |
| Thread URL | https://heyreach.io/thread/xyz |
| Notes | "Asked about pricing early - high intent" |
| Next Action | book_call |
| Meeting Scheduled | ✅ |
| Meeting Date | 2025-12-15 |

---

## Setup Instructions

### Step 1: Create Base
1. Go to Airtable
2. Create new base: `{Client Name} - Outbound Tracker`
3. Create 4 tables (or start with 2: Positive Replies + Weekly Summary)

### Step 2: Configure Fields
1. Copy field definitions from above
2. Set field types exactly as specified
3. Configure single-select options

### Step 3: Create Views
1. Pending Approvals (primary operator view)
2. Sent This Week
3. Meetings Booked
4. Manual Follow-ups

### Step 4: Set Up Automations
1. New Reply Alert → Slack
2. Weekly Summary (optional)
3. Stale Approval Alert (optional)

### Step 5: Share with Team
1. Invite operators (Editor role)
2. Invite managers (Creator role)
3. Set up integrations (n8n webhook)

---

## Best Practices

✅ **Do:**
- Update Notes field when doing manual actions
- Check Pending Approvals view daily
- Keep Meeting Scheduled accurate
- Use Tags for pattern tracking

❌ **Don't:**
- Delete records (archive if needed)
- Change system-generated timestamps
- Edit AI-generated fields (Draft Reply, Intent, etc.)

---

**This schema is the operator's source of truth.**

All metrics, reporting, and client billing should reference this Airtable base.
