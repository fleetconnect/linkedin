# Research Architecture

## Core Principle (Non-Negotiable)

**Perplexity research is baseline message quality infrastructure, not a premium feature.**

All licensing tiers get:
- Same research depth
- Same message-generation inputs
- Same output quality

## Research Layer Position

Research lives **below licensing**, inside the OS core:

```
Lead → QUALIFIED
        ↓
[Research Layer — Perplexity] ← Non-optional, non-tiered
        ↓
[Message Generation — Claude]
        ↓
READY_TO_SEND → External execution (HeyReach/n8n)
```

## Execution Rule

```typescript
if (lead.state === LeadState.QUALIFIED && personalization === true) {
  // Research ALWAYS runs (subject to caching)
  // No tier checks
  // No feature flags
  // No conditional depth/quality
}
```

## What's the Same Across ALL Tiers

✅ **Never gate these:**

- PerplexityService implementation
- ResearchCompanyTool logic
- PreMessageHook research execution
- Research snapshot fields
- Research depth and quality
- Prompt structure and context
- Model choice (never use "cheap model" tiering)
- Context windows
- Number of research fields collected
- Perplexity API model used

## What Actually Differs by Tier

Licensing tiers should ONLY differ in:

- **Who operates it** (self-serve, white-glove, managed service)
- **Control level** (API access, UI only, fully automated)
- **Scale** (volume limits, rate limits, concurrent campaigns)
- **Support** (community, email, dedicated)
- **Deployment** (cloud, on-premise, hybrid)

Never:
- Research availability
- Personalization depth
- Message intelligence
- Prompt quality

## Implementation Checkpoints

When adding new features, verify:

1. ✅ Does research run for QUALIFIED leads with personalization enabled?
2. ✅ Is research quality the same across all tiers?
3. ✅ Are we using the same Perplexity model for everyone?
4. ✅ Do all tiers get the same research fields?
5. ✅ Is Claude using the same prompts regardless of tier?

If the answer to any is "no", **fix it immediately**.

## Code References

**Research execution:**
- `src/tools/researchCompany.ts` - `shouldRunResearch()` method
- `src/hooks/PreMessageHook.ts` - `executeResearchHook()` method

**Research usage:**
- `src/services/MessageGenerationService.ts` - `buildMessagePrompt()` includes research_snapshot
- `src/prompts/generateMessage/initial.v2.ts` - Uses researchSnapshot in user prompt

**Service layer:**
- `src/services/PerplexityService.ts` - No tier logic, clean service implementation

## Anti-Patterns to Avoid

❌ **Never do this:**

```typescript
// BAD: Tier-based research depth
if (user.tier === 'premium') {
  return await perplexity.researchCompany(company, { depth: 'full' });
} else {
  return await perplexity.researchCompany(company, { depth: 'basic' });
}

// BAD: Conditional research quality
const model = user.tier === 'premium'
  ? 'sonar-pro'
  : 'sonar-basic';

// BAD: Gating research fields
if (user.tier !== 'premium') {
  delete snapshot.challenges;
  delete snapshot.opportunities;
}
```

✅ **Always do this:**

```typescript
// GOOD: Same research for everyone
if (lead.state === LeadState.QUALIFIED && personalization) {
  return await perplexity.researchCompany(company);
}

// GOOD: Same model for all tiers
const model = perplexityConfig.model; // Always 'sonar'

// GOOD: Same fields for everyone
return {
  companyName,
  companyDescription,
  industry,
  recentNews,
  keyProducts,
  challenges,      // ✅ Everyone gets this
  opportunities,   // ✅ Everyone gets this
  fundingInfo,
  employeeCount,
  sources
};
```

## Why This Matters

**Message quality is not negotiable.**

If we gate research by tier:
- Lower-tier messages become spam
- Brand damage for "basic" users
- Two-class system undermines trust
- LinkedIn flags low-quality automation

Instead:
- Everyone gets executive-grade messages
- Tier differentiation happens at scale/control/support
- All messages maintain high quality baseline
- Platform risk is minimized

## Licensing Strategy

Tiers differentiate on:

**Starter** (Self-serve)
- Same message quality
- Same research depth
- Lower volume limits
- Community support
- Cloud-only

**Professional** (Managed)
- Same message quality
- Same research depth
- Higher volume limits
- Email support
- API access

**Enterprise** (White-glove)
- Same message quality
- Same research depth
- Unlimited scale
- Dedicated support
- On-premise option
- Custom integrations

**Never:**
- "Basic" vs "Advanced" research
- "Standard" vs "Premium" prompts
- "Lite" vs "Full" message generation

## Final Rule

**If you're considering adding tier-based logic to research or message generation, stop.**

Ask instead:
1. Is this about scale/volume? → Rate limiting, not quality gating
2. Is this about control? → API access, not feature depth
3. Is this about support? → SLA tiers, not message quality
4. Is this about deployment? → Hosting options, not functionality

Research and message quality are **OS-level infrastructure**, not license-gated features.

---

**This document is canonical. Do not deviate without explicit architectural approval.**
