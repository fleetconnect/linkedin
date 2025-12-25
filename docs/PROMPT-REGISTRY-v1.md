# Prompt Registry v1

**AI Executive Outbound OS**

**Version:** 1.0
**Status:** Active
**Last Updated:** December 25, 2024
**Owner:** Outbound Systems Team

---

## 1. Purpose

This document defines the approved prompt inventory used across the AI Executive Outbound OS.

**The Prompt Registry exists to:**
- Enforce consistency across AI generated messages
- Protect high performing language that drives conversions
- Define clear human approval boundaries
- Prevent prompt drift, unauthorized edits, or unsafe automation
- Enable clean installs for new clients and dev partners

> Only prompts listed in this registry are permitted in production workflows.

---

## 2. Prompt Governance Principles

All prompts in this registry must comply with the following rules:

- **Static framework phrases are immutable**
- **Human approval is required before any follow up or post reply message is sent**
- **Prompts must bias toward conservative outputs**
- **No prompt may directly trigger a send action**
- **All prompts must avoid sales language**
- **No dash or em dash characters are permitted in any generated output**

Any modification requires a version bump and explicit approval.

---

## 3. Prompt Architecture Overview

Each prompt is classified by:

1. **Prompt ID**
2. **Prompt Type**
3. **Invocation Context**
4. **Input Requirements**
5. **Output Contract**
6. **Human Approval Boundary**
7. **Allowed Variation**
8. **Prohibited Behavior**

---

## 4. Prompt Inventory

### PROMPT 01: Opener Generation Prompt

**Prompt ID:** `P01_OPENER_GENERATION`
**Prompt Type:** System + Task
**Invocation Context:** First message only, no prior contact

#### Purpose

Generate LinkedIn icebreakers that achieve 15 to 20 percent reply rates using observational personalization.

#### Inputs

- Perplexity research data object
- Prospect profile fields
- Language setting

#### Output Contract

- 20 to 40 words
- Observational tone only
- No CTA
- No questions
- One personalization element only
- No dashes or dash like punctuation
- Single paragraph output

#### Required Framework

**Pattern:**
```
[Observation about their work or profile], [why it caught attention]
```

#### Forbidden

- Generic compliments
- Sales language
- Questions
- Calls to action
- Dash characters

#### Human Approval Boundary

**None required. Openers may be auto sent.**

---

### PROMPT 02: Follow Up Generation Prompt

**Prompt ID:** `P02_FOLLOWUP_GENERATION`
**Prompt Type:** System + Task
**Invocation Context:** Prospect replied to opener

#### Purpose

Convert engaged prospects using proven frameworks that produce 40 to 50 percent conversion rates.

#### Inputs

- Perplexity research data object
- Prospect reply text
- Rotating colleague name

#### Required Static Phrases

**These must appear exactly as written:**

- `My colleague {Name} found you on LinkedIn while looking for`
- `stood out`
- `We are featuring` OR `We are spotlighting`
- `Would you be open to`
- `appreciate the reply` OR `appreciate it`

#### Output Contract

- 60 to 100 words
- Peer to peer tone
- Permission based CTA
- No links
- No dashes or dash like punctuation

#### Human Approval Boundary

**Required.**
Message must be reviewed and approved by a human before sending.

---

### PROMPT 03: Conversion Message Prompt

**Prompt ID:** `P03_CONVERSION_MESSAGE`
**Prompt Type:** System + Task
**Invocation Context:** Prospect expresses interest

#### Purpose

Make the next step frictionless and specific without pressure.

#### Inputs

- Perplexity research data object
- Prospect response
- Desired next step type

#### Supported Next Step Types

- Meeting request
- Send questions
- Email exchange

#### Output Contract

- 40 to 80 words
- Clear next action
- No urgency language
- No dashes or dash like punctuation

#### Human Approval Boundary

**Required.**
All conversion messages require explicit human approval.

---

### PROMPT 04: Intent Classification Prompt

**Prompt ID:** `P04_INTENT_CLASSIFICATION`
**Prompt Type:** System
**Invocation Context:** Incoming prospect replies

#### Purpose

Classify replies to route visibility and determine next action eligibility.

#### Output Classes

- `HIGH_INTEREST`
- `MEDIUM_INTEREST`
- `LOW_INTEREST`
- `DISENGAGED`
- `STOP`

#### Output Contract

- Classification label
- One sentence reasoning
- No suggested send action

#### Human Approval Boundary

**Classification only.**
This prompt may never trigger a send.

---

### PROMPT 05: Follow Up Suggestion Prompt

**Prompt ID:** `P05_FOLLOWUP_SUGGESTION`
**Prompt Type:** System + Task
**Invocation Context:** API determines lead is eligible for follow up

#### Purpose

Suggest follow up messaging without arming a send.

#### Output Types

- `WAIT`
- `SUGGEST` with message and reasoning

#### Output Contract

- Suggested message only
- Clear reasoning for suggestion
- No state mutation
- No dashes or dash like punctuation

#### Human Approval Boundary

**Mandatory.**
Suggestion only. Sending requires explicit human action.

---

## 5. Perplexity Research Prompt

**Prompt ID:** `R01_PERPLEXITY_RESEARCH`

#### Purpose

Extract structured personalization data to power message generation.

#### Output Schema

```json
{
  "first_name": "",
  "company": "",
  "title": "",
  "industry_niche": "",
  "years_experience": "",
  "credentials": "",
  "recent_content_topics": "",
  "company_positioning": "",
  "target_audience": "",
  "problems_they_solve": ""
}
```

#### Priority Rules

- Specific over generic
- Observable facts only
- No assumptions

---

## 6. Forbidden Language and Patterns

The following are prohibited across all prompts:

- opportunity
- solution
- pitch
- demo
- schedule
- hop on a call
- dash or em dash punctuation

---

## 7. Quality Assurance Checklist

Every generated message must pass:

- ✅ Static phrases intact
- ✅ Personalization is specific
- ✅ Correct word count
- ✅ No forbidden language
- ✅ No dash characters
- ✅ Correct human approval boundary

**Failures must be rejected and regenerated.**

---

## 8. Change Management

Any modification to:
- Static phrases
- Output structure
- Approval boundaries

**Requires:**
- New version number
- Written justification
- Approval from system owner

---

## 9. Success Criteria

This registry is considered correctly implemented when:

- ✅ No automated follow ups occur post reply
- ✅ All follow ups require human approval
- ✅ Output maintains observed conversion benchmarks
- ✅ Prompt drift is prevented across clients
