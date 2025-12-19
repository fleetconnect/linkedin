# State Transition Hardening

## Overview

This document describes the defensive state transition guards, idempotency checks, and terminal state protection implemented to prevent silent corruption at scale.

**These guards are boring infrastructure work — but critical for production reliability.**

---

## Problem Statement

Without hardening:
- ❌ States can skip transitions (NEW → BOOKED directly)
- ❌ Duplicate messages/classifications cause double-writes
- ❌ Terminal states (CLOSED, LOST) can be accidentally overwritten
- ❌ Silent data corruption accumulates over time
- ❌ No protection against race conditions or retries

With hardening:
- ✅ All state transitions are validated
- ✅ Duplicate operations are idempotent (no-op, not error)
- ✅ Terminal states are protected
- ✅ Clear error messages for invalid transitions
- ✅ Warnings for edge cases

---

## Implementation

### 1. State Transition Guard

**Location**: `src/utils/stateTransitionGuard.ts`

Defines valid state transitions and enforces them defensively.

#### Valid Transitions Map

```typescript
const VALID_TRANSITIONS: Record<LeadState, LeadState[]> = {
  NEW: [QUALIFIED, LOST],
  QUALIFIED: [READY_TO_SEND, LOST],
  READY_TO_SEND: [CONTACTED, LOST],
  CONTACTED: [REPLIED, LOST],
  REPLIED: [INTERESTED, READY_TO_SEND, LOST],
  INTERESTED: [BOOKED, READY_TO_SEND, LOST],
  BOOKED: [CLOSED, LOST],  // Semi-terminal
  CLOSED: [],              // Truly terminal
  LOST: []                 // Truly terminal
};
```

#### Terminal States

**Semi-Terminal**:
- `BOOKED` - Can transition to CLOSED or LOST

**Truly Terminal**:
- `CLOSED` - No transitions out (final success state)
- `LOST` - No transitions out (final failure state)

#### Usage

```typescript
import { validateTransition, assertValidTransition } from '../utils/stateTransitionGuard';

// Validate without throwing
const validation = validateTransition(currentState, nextState);
if (!validation.valid) {
  console.error(validation.reason);
}

// Assert (throws if invalid)
assertValidTransition(currentState, nextState);
```

#### Options

```typescript
validateTransition(currentState, nextState, {
  allowIdempotent: true,           // Allow same state transitions (default: true)
  allowTerminalOverride: false     // Allow overriding terminal states (default: false)
});
```

---

### 2. Idempotency Guard

**Location**: `src/utils/idempotencyGuard.ts`

Prevents duplicate messages and classifications from causing double-writes.

#### Duplicate Message Detection

Uses content hashing + time windows to detect duplicates:

```typescript
import { isDuplicateMessage } from '../utils/idempotencyGuard';

const check = isDuplicateMessage(lead, messageContent, sender, {
  timeWindowMs: 60000,  // 1 minute window
  exactMatch: false     // Use hash matching (default)
});

if (check.isDuplicate) {
  console.warn(`Duplicate: ${check.reason}`);
  return check.existingMessage;
}
```

**How it works**:
1. Generates SHA-256 hash of `${leadId}:${content.toLowerCase()}`
2. Checks recent messages from same sender (within time window)
3. Returns existing message if duplicate found
4. Time window defaults to 60 seconds (configurable)

#### Duplicate Classification Detection

Prevents re-classifying the same message:

```typescript
import { isDuplicateClassification } from '../utils/idempotencyGuard';

const check = isDuplicateClassification(lead, messageContent, {
  timeWindowMs: 60000  // 1 minute window
});

if (check.isDuplicate) {
  return lead.lastClassification;  // Return existing
}
```

#### Duplicate Follow-up Detection

Prevents generating multiple follow-ups rapidly:

```typescript
import { isDuplicateFollowup } from '../utils/idempotencyGuard';

const check = isDuplicateFollowup(lead, {
  timeWindowMs: 300000  // 5 minute window (default)
});

if (check.isDuplicate) {
  console.warn(`Follow-up already generated: ${check.reason}`);
  return check.lastFollowup;
}
```

---

### 3. Integration Points

#### StorageService

**`saveLead(lead, options)`**:
- Validates state transitions before saving
- Option to skip validation if already validated

**`updateLeadState(leadId, newState, options)`**:
- Asserts valid transition (throws on invalid)
- Option to override terminal states (dangerous!)

**`addMessage(leadId, message, options)`**:
- Checks for duplicate messages
- Returns existing lead if duplicate (idempotent)
- Option to skip duplicate check

#### ClassificationController

**`classifyReply(leadId, messageContent, options)`**:
- Checks for duplicate classification at start
- Returns existing classification if duplicate
- Validates state transition before advancing
- Option to skip idempotency check

#### API Routes (External Integration)

**`POST /api/leads/:leadId/state`**:
- Validates transition via StorageService
- Used by external tools (HeyReach, n8n)
- Returns clear error messages on invalid transitions

---

## State Transition Rules

### Valid State Paths

**Initial Message Flow**:
```
NEW → QUALIFIED → READY_TO_SEND → CONTACTED → REPLIED
```

**Interested Flow**:
```
REPLIED → INTERESTED → READY_TO_SEND → CONTACTED
              ↓
           BOOKED → CLOSED
```

**Neutral Flow**:
```
REPLIED → READY_TO_SEND → CONTACTED
(Follow-up generated)
```

**Negative Flow**:
```
REPLIED → LOST
(No follow-up)
```

**Any State → LOST**:
```
All states can transition to LOST (except CLOSED/LOST)
```

### Invalid Transitions (Will Error)

❌ NEW → CONTACTED (must go through QUALIFIED → READY_TO_SEND first)
❌ QUALIFIED → CONTACTED (must go through READY_TO_SEND)
❌ READY_TO_SEND → REPLIED (external tool must set CONTACTED first)
❌ CLOSED → anything (truly terminal)
❌ LOST → anything (truly terminal)
❌ BOOKED → READY_TO_SEND (can only go to CLOSED or LOST)

---

## Error Handling

### State Transition Errors

```typescript
try {
  await storageService.updateLeadState(leadId, invalidState);
} catch (error) {
  if (error instanceof StateTransitionError) {
    console.error(`Invalid transition: ${error.currentState} → ${error.attemptedState}`);
    console.error(`Reason: ${error.reason}`);
    // Handle gracefully
  }
}
```

### Idempotency Errors

```typescript
try {
  assertNotDuplicateMessage(lead, content, sender, {
    throwOnDuplicate: true  // Default
  });
} catch (error) {
  if (error instanceof IdempotencyError) {
    console.error(`Duplicate detected: ${error.operation}`);
    console.error(`Reason: ${error.reason}`);
    // Return existing data (idempotent)
    return error.existingData;
  }
}
```

### Warnings (Non-Fatal)

Warnings are logged but don't throw errors:
- ⚠️ Idempotent transition (same state → same state)
- ⚠️ Duplicate message detected (returns existing)
- ⚠️ Duplicate classification detected (returns existing)
- ⚠️ Duplicate follow-up detected (returns existing)

---

## Configuration

### Time Windows

Default time windows for idempotency:

```typescript
const DEFAULTS = {
  duplicateMessageWindow: 60000,        // 1 minute
  duplicateClassificationWindow: 60000, // 1 minute
  duplicateFollowupWindow: 300000       // 5 minutes
};
```

Override per-operation:

```typescript
// Stricter duplicate detection
await storageService.addMessage(leadId, message, {
  duplicateWindowMs: 30000  // 30 seconds
});

// More lenient for follow-ups
isDuplicateFollowup(lead, {
  timeWindowMs: 600000  // 10 minutes
});
```

### Terminal State Override

**DANGEROUS**: Only use in recovery scenarios

```typescript
// Allow overriding terminal states
await storageService.updateLeadState(leadId, newState, {
  allowTerminalOverride: true  // ⚠️ Use with caution!
});
```

This will log a warning:
```
⚠️  Overriding terminal state CLOSED → INTERESTED (dangerous!)
```

---

## Testing State Transitions

### Valid Transition Example

```typescript
const lead = await storage.createLead({
  id: 'test-1',
  name: 'Test Lead'
});
// State: NEW

await storage.updateLeadState(lead.id, LeadState.QUALIFIED);
// ✅ Valid: NEW → QUALIFIED

await storage.updateLeadState(lead.id, LeadState.READY_TO_SEND);
// ✅ Valid: QUALIFIED → READY_TO_SEND

await storage.updateLeadState(lead.id, LeadState.CONTACTED);
// ✅ Valid: READY_TO_SEND → CONTACTED
```

### Invalid Transition Example

```typescript
const lead = await storage.createLead({
  id: 'test-2',
  name: 'Test Lead'
});
// State: NEW

await storage.updateLeadState(lead.id, LeadState.CONTACTED);
// ❌ Error: Invalid transition: NEW → CONTACTED
// Reason: Valid next states: QUALIFIED, LOST
```

### Idempotency Example

```typescript
// First classification
const result1 = await controller.classifyReply(leadId, "Thanks!");
// ✅ Classification performed

// Duplicate classification (within 1 minute)
const result2 = await controller.classifyReply(leadId, "Thanks!");
// ⚠️ Duplicate detected, returns existing classification
// result2 === result1 (idempotent)
```

---

## Benefits

### 1. Data Integrity
- No invalid state transitions
- No duplicate data
- Terminal states protected

### 2. Reliability
- Retries are safe (idempotent)
- Race conditions handled
- Clear error messages

### 3. Debugging
- Warnings logged for edge cases
- Detailed error reasons
- Audit trail in logs

### 4. Production Safety
- Prevents silent corruption
- Fails loudly on bugs
- Safe to retry operations

---

## Monitoring

### Metrics to Track

**State Transition Violations**:
```typescript
// Count invalid transition attempts
metrics.increment('state_transition.invalid', {
  from: currentState,
  to: attemptedState
});
```

**Idempotency Hits**:
```typescript
// Count duplicate operations
metrics.increment('idempotency.duplicate_detected', {
  operation: 'classification',
  leadId: lead.id
});
```

**Terminal State Overrides**:
```typescript
// Alert on dangerous operations
if (allowTerminalOverride) {
  alerting.warn('Terminal state override', {
    leadId,
    from: currentState,
    to: newState
  });
}
```

### Logs to Watch

```bash
# Invalid transitions
grep "❌ Invalid state transition" logs/app.log

# Idempotency warnings
grep "⚠️  Duplicate" logs/app.log

# Terminal overrides
grep "⚠️  Overriding terminal state" logs/app.log
```

---

## Migration

If you have existing data with invalid states:

```typescript
// Audit existing leads
const leads = await storage.getLeads();

for (const lead of leads) {
  const validNextStates = getValidNextStates(lead.state);

  if (validNextStates.length === 0 && !isTrulyTerminalState(lead.state)) {
    console.warn(`Lead ${lead.id} in invalid state: ${lead.state}`);
    // Manual intervention required
  }
}
```

---

## Summary

**State Transition Guard**:
- Defines valid transitions
- Protects terminal states
- Throws on invalid transitions

**Idempotency Guard**:
- Detects duplicate messages
- Detects duplicate classifications
- Returns existing data (idempotent)

**Integration**:
- StorageService validates all state changes
- ClassificationController checks duplicates
- API routes use guards for external tools

**Result**:
- No silent corruption
- Safe retries
- Data integrity guaranteed

This is boring infrastructure work — but it prevents catastrophic bugs in production.
