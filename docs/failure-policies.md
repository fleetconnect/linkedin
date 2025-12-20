# Failure Policies

## Core Principles

1. **Never advance state on partial intelligence** - If classification fails, don't guess
2. **Never block pipeline if enrichment fails** - Research failure ≠ pipeline stop
3. **Retry transient failures** - Network blips, timeouts
4. **Don't retry permanent failures** - Invalid API keys, malformed requests

---

## Claude Failures

### Timeout

**Scenario:** Claude API doesn't respond within reasonable time

**Policy:**
- Initial timeout: 30 seconds (implicit in Anthropic SDK)
- Retry: 3 attempts with exponential backoff (1s, 2s, 4s)
- After 3 failures: **Throw error, do NOT advance state**

**Implementation:** `src/services/LLMService.ts`

**Observability:**
```bash
# Check Claude timeouts
GET /api/observability/logs?category=LLM_CALL&level=ERROR
```

**Rationale:**
- Classification is critical intelligence
- State advancement requires confident classification
- Partial/failed classification = corrupt state machine

**Example:**
```typescript
// Lead stays in current state
lead.state = 'REPLIED'  // No advancement to INTERESTED

// Error logged
observability.logLLMCall({
  operation: 'classify',
  success: false,
  error: 'Claude classification failed after 3 attempts: timeout'
});
```

---

### Malformed Output

**Scenario:** Claude returns text but no valid JSON

**Policy:**
- Retry: Yes (malformed output can be transient)
- Max attempts: 3
- After 3 failures: **Throw error, do NOT advance state**

**Detection:**
```typescript
// No JSON found
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('No JSON found in Claude response (malformed output)');
}

// Invalid JSON structure
try {
  parsed = JSON.parse(jsonMatch[0]);
} catch (e) {
  throw new Error(`Invalid JSON in Claude response: ${e.message}`);
}

// Schema validation failure
const classification = IntentClassificationSchema.parse(parsed);
// Throws if schema mismatch
```

**Implementation:** `src/services/LLMService.ts` - `classifyIntent()`

**Observability:**
```bash
# Check malformed outputs
GET /api/observability/logs?category=LLM_CALL&level=ERROR
```

**Rationale:**
- Prompt issues can cause malformed output
- Retrying may succeed (temperature variation)
- Never guess intent from partial output

**Example:**
```typescript
// Claude returns: "I think this lead is interested..."
// No JSON → Retry
// Still no JSON → Error, no state change
```

---

### Message Generation Failure

**Scenario:** Claude fails to generate message/follow-up

**Policy:**
- Retry: 3 attempts
- After 3 failures: **Throw error, block message sending**

**Rationale:**
- Don't send malformed/partial messages
- Message quality is non-negotiable
- Better to not send than send garbage

**Fallback:** Manual intervention required

**Example:**
```typescript
// Message generation fails
throw new Error('Claude generation failed after 3 attempts');

// Lead state: READY_TO_SEND
// Next action: Manual message draft OR retry later
```

---

## Perplexity Failures

### Partial Response

**Scenario:** Perplexity returns incomplete data (some fields missing)

**Policy:**
- **Accept partial data**
- Continue with available fields
- Don't block pipeline

**Detection:**
```typescript
private parseResearchResponse(content: string, companyName: string) {
  try {
    const parsed = JSON.parse(content);
    return {
      companyName: parsed.companyName || companyName,
      companyDescription: parsed.companyDescription || '',  // ← Graceful default
      industry: parsed.industry || '',
      recentNews: Array.isArray(parsed.recentNews) ? parsed.recentNews : [],
      // ... etc
    };
  } catch (error) {
    // JSON parsing fails → Create basic snapshot
    console.warn('Failed to parse JSON, creating basic snapshot:', error);
    return {
      companyName,
      companyDescription: content.substring(0, 500),  // ← Use raw text
      industry: '',
      recentNews: [],
      // ... empty fields
    };
  }
}
```

**Implementation:** `src/services/PerplexityService.ts` - `parseResearchResponse()`

**Rationale:**
- Partial research > no research
- Message generation can work with limited data
- Research is enrichment, not critical path

**Example:**
```typescript
// Perplexity returns only companyDescription + industry
// Missing: recentNews, challenges, opportunities

// ✅ Accept it
snapshot = {
  companyDescription: "Tech company...",
  industry: "SaaS",
  recentNews: [],  // Empty
  challenges: [],   // Empty
  opportunities: [] // Empty
}

// ✅ Continue to message generation
// Message will be less personalized but still valid
```

---

### Total Research Failure

**Scenario:** Perplexity fails after retries OR API is down

**Policy:**
- **Continue without research**
- Generate message without personalization
- Log research failure
- Don't block pipeline

**Implementation:** `src/hooks/PreMessageHook.ts`

```typescript
async executeResearchHook(context: PreMessageHookContext): Promise<HookResult> {
  const result = await this.researchTool.execute({
    leadId: lead.id,
    companyName,
    additionalContext: `Lead name: ${lead.name}. Lead state: ${lead.state}.`
  });

  if (result.success) {
    return {
      success: true,
      shouldProceed: true,  // ← Continue
      data: result.snapshot
    };
  } else {
    console.error(`❌ Research failed: ${result.error}`);
    return {
      success: false,
      shouldProceed: true,  // ← STILL CONTINUE
      error: result.error
    };
  }
}
```

**Observability:**
```bash
# Check research failures
GET /api/observability/logs?category=RESEARCH&level=WARN
```

**Rationale:**
- Research is enrichment, not requirement
- Generic message > blocked pipeline
- Can retry research later (7-day cache)

**Example Flow:**
```
Lead → QUALIFIED
  ↓
Research → FAILS (Perplexity down)
  ↓
Message Generation → Proceeds (no research_snapshot)
  ↓
Lead → READY_TO_SEND  ✅ Pipeline continues
```

---

## External API Downtime

### Anthropic API Down

**Policy:**
- Retry: 3 attempts with exponential backoff
- After 3 failures: **Block operation, throw error**
- Manual intervention required

**Detection:**
```typescript
// 500, 502, 503, 504 errors
if (error.message.includes('500') || error.message.includes('503')) {
  // Retryable
}
```

**Fallback:** None (Claude is critical for classification)

**Example:**
```
Classification request → Claude API down
  ↓
Retry 1 (1s delay) → Still down
  ↓
Retry 2 (2s delay) → Still down
  ↓
Retry 3 (4s delay) → Still down
  ↓
Throw error: "Claude classification failed after 3 attempts: 503 Service Unavailable"
  ↓
Lead state: UNCHANGED
Action required: Wait for Claude API, retry later
```

---

### Perplexity API Down

**Policy:**
- Retry: 3 attempts with exponential backoff (2s, 4s, 8s)
- After 3 failures: **Continue without research**
- Pipeline NOT blocked

**Detection:**
```typescript
// 500, 502, 503, 504 errors
retryWithBackoff(async () => {
  return await perplexity.researchCompany(company);
}, {
  maxAttempts: 3,
  initialDelayMs: 2000,  // Longer delay for research
  maxDelayMs: 10000
});
```

**Fallback:** Generic message without research

**Example:**
```
Research request → Perplexity API down
  ↓
Retry 1 (2s delay) → Still down
  ↓
Retry 2 (4s delay) → Still down
  ↓
Retry 3 (8s delay) → Still down
  ↓
Research fails → Continue without research
  ↓
Message generation → Use generic prompt (no company specifics)
  ↓
Lead → READY_TO_SEND  ✅ Pipeline continues
```

---

## Retry Configuration

### Classification (Claude)
```typescript
{
  maxAttempts: 3,
  initialDelayMs: 1000,  // 1 second
  maxDelayMs: 5000,      // 5 seconds max
  backoffMultiplier: 2   // 1s → 2s → 4s
}
```

### Message Generation (Claude)
```typescript
{
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2
}
```

### Research (Perplexity)
```typescript
{
  maxAttempts: 3,
  initialDelayMs: 2000,  // 2 seconds (longer for research)
  maxDelayMs: 10000,     // 10 seconds max
  backoffMultiplier: 2   // 2s → 4s → 8s
}
```

---

## Error Types

### Retryable Errors
- `timeout` - Request timeout
- `ECONNRESET` - Connection reset
- `ECONNREFUSED` - Connection refused
- `ETIMEDOUT` - Operation timed out
- `network error` - Generic network issue
- `socket hang up` - Socket closed unexpectedly
- `429` - Rate limit (will succeed after backoff)
- `500` - Internal server error
- `502` - Bad gateway
- `503` - Service unavailable
- `504` - Gateway timeout

### Permanent Errors (Don't Retry)
- `400` - Bad request (our fault)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (auth issue)
- `404` - Not found (wrong endpoint)
- `invalid api key` - Auth failure
- `authentication failed` - Auth failure
- `malformed request` - Our request is wrong

**Implementation:** `src/utils/retry.ts`

---

## State Advancement Rules

### ✅ ALLOWED State Advancements

**Condition:** Successful classification with confidence >= threshold

```typescript
if (classification.success && classification.confidence >= 0.7) {
  // Advance state
  lead.state = classification.next_state;
}
```

### ❌ BLOCKED State Advancements

**Condition:** Classification failed OR confidence below threshold

```typescript
// Classification failed
if (!classification.success) {
  // DO NOT advance state
  lead.state = lead.state;  // Stay in current state
}

// Confidence too low
if (classification.confidence < 0.7) {
  console.warn('Confidence below threshold, skipping state advancement');
  lead.state = lead.state;  // Stay in current state
}
```

---

## Pipeline Continuation Rules

### ✅ CONTINUE Pipeline

**Even if:**
- Research fails (Perplexity down)
- Research returns partial data
- Message generation fallback succeeds

**Rationale:** Enrichment failure ≠ pipeline failure

### ❌ BLOCK Pipeline

**Only if:**
- Classification fails (Claude down/malformed)
- Message generation fails completely
- State transition validation fails

**Rationale:** Critical intelligence failure OR invalid operation

---

## Observability Queries

### Check Retry Patterns
```bash
# Classification retries
grep "Classification retry" /var/log/app.log

# Research retries
grep "Research retry" /var/log/app.log

# Message generation retries
grep "Message generation retry" /var/log/app.log
```

### Check Failure Rates
```bash
# Error rate by category
GET /api/observability/stats
# Returns: { errorRate: 0.05, ... }

# Failed classifications
GET /api/observability/logs?category=LLM_CALL&level=ERROR&limit=100

# Failed research (warnings)
GET /api/observability/logs?category=RESEARCH&level=WARN
```

---

## Testing Failure Scenarios

### 1. Test Claude Timeout
```typescript
// Mock timeout
jest.spyOn(anthropic, 'messages.create').mockImplementation(() => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), 31000);
  });
});

// Expect: 3 retries, then error, state unchanged
```

### 2. Test Malformed Output
```typescript
// Mock malformed response
jest.spyOn(anthropic, 'messages.create').mockResolvedValue({
  content: [{ type: 'text', text: 'This lead seems interested but no JSON' }]
});

// Expect: 3 retries, then error, state unchanged
```

### 3. Test Research Failure
```typescript
// Mock Perplexity failure
jest.spyOn(perplexity, 'researchCompany').mockRejectedValue(new Error('503 Service Unavailable'));

// Expect: 3 retries, then continue without research, pipeline proceeds
```

### 4. Test Partial Research
```typescript
// Mock partial response
jest.spyOn(perplexity, 'researchCompany').mockResolvedValue({
  companyDescription: 'Tech company',
  industry: 'SaaS',
  recentNews: [],  // Missing
  challenges: []   // Missing
});

// Expect: Accept partial data, continue pipeline
```

---

## Summary

| Failure Type | Retry | Fallback | Block Pipeline? |
|--------------|-------|----------|-----------------|
| Claude timeout | 3x | None | ✅ YES |
| Claude malformed | 3x | None | ✅ YES |
| Message gen failure | 3x | None | ✅ YES |
| Perplexity timeout | 3x | No research | ❌ NO |
| Perplexity partial | 0x | Use partial | ❌ NO |
| Perplexity down | 3x | No research | ❌ NO |
| State validation | 0x | Block transition | ✅ YES |

**Key Takeaway:**
- Critical intelligence (classification) = Block on failure
- Enrichment (research) = Continue on failure
- Never advance state on partial/failed intelligence
- Always retry transient failures

---

**This is production-ready failure handling. Ship it.**
