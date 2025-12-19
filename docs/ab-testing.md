# A/B Testing Hooks

## Overview

This system includes lightweight A/B testing hooks for message prompt variants. This is NOT a full A/B testing platform - just the minimal infrastructure to test different messaging approaches and track performance.

## Purpose

Use A/B testing to:
- Test different messaging approaches (question-led vs. value-led)
- Optimize response rates and conversion
- Make data-driven decisions about messaging strategy
- Differentiate your offering with enterprise-grade testing capabilities

## How It Works

### 1. Configure Variant in Campaign

Add `prompt_variant` to your campaign's messaging rules:

```typescript
const campaign: Campaign = {
  id: 'campaign-1',
  name: 'Q1 Outbound',
  messaging_rules: {
    personalization: true,
    toneOfVoice: 'professional',
    prompt_variant: 'A'  // or 'B'
  },
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### 2. Variant Behavior

**Variant A**: Question-led approach
- Leads with questions or insights
- More conversational and exploratory
- Best for relationship building

**Variant B**: Value-led approach
- Leads with clear value proposition
- More direct and actionable
- Best for time-constrained prospects

The variant is automatically applied when generating messages through `MessageGenerationService`.

### 3. Variant Tracking

Every message generated includes the variant:

```typescript
const message: Message = {
  id: 'msg-123',
  leadId: 'lead-456',
  content: 'Your message...',
  sender: 'user',
  timestamp: new Date(),
  variant: 'A'  // Automatically set from campaign
};
```

### 4. Analyze Results

Use the analytics endpoints to compare performance:

#### Get Overall Variant Comparison

```bash
GET /api/analytics/variants
```

Response:
```json
{
  "success": true,
  "data": {
    "variantA": {
      "variant": "A",
      "totalSent": 50,
      "totalResponses": 15,
      "responseRate": 0.30,
      "positiveResponses": 10,
      "positiveResponseRate": 0.20,
      "interestedResponses": 7,
      "bookedResponses": 3,
      "neutralResponses": 3,
      "negativeResponses": 2
    },
    "variantB": {
      "variant": "B",
      "totalSent": 48,
      "totalResponses": 12,
      "responseRate": 0.25,
      "positiveResponses": 6,
      "positiveResponseRate": 0.125,
      "interestedResponses": 4,
      "bookedResponses": 2,
      "neutralResponses": 4,
      "negativeResponses": 2
    },
    "winner": "A",
    "confidenceLevel": "medium",
    "recommendation": "Variant A is performing better with medium confidence. 60.0% improvement in positive response rate. Consider using Variant A for all future messages."
  }
}
```

#### Get Formatted Report

```bash
GET /api/analytics/variants/report
```

Returns a human-readable report with winner and recommendation.

#### Campaign-Specific Analytics

```bash
GET /api/analytics/variants/campaign/:campaignId
```

Compare variants within a specific campaign.

## Analytics Methodology

### Metrics Tracked

1. **Total Sent**: Number of messages sent with this variant
2. **Total Responses**: Number of leads who replied
3. **Response Rate**: Percentage of messages that got a response
4. **Positive Responses**: Interested + Booked responses
5. **Positive Response Rate**: Key conversion metric

### Intent Classification

Responses are analyzed using Claude classification:
- **Interested**: Lead shows interest, wants to learn more
- **Booked**: Lead agrees to meeting/call
- **Neutral**: Non-committal response
- **Negative**: Not interested

Positive responses = Interested + Booked

### Statistical Confidence

- **Low Confidence**: < 20 messages per variant
- **Medium Confidence**: 20-49 messages per variant
- **High Confidence**: 50+ messages per variant

A winner is only declared when:
1. Both variants have ≥20 messages
2. Difference in positive response rate > 5%

## Best Practices

### 1. Split Traffic Evenly

Create two campaigns with identical settings except variant:

```typescript
const campaignA = {
  messaging_rules: {
    personalization: true,
    toneOfVoice: 'professional',
    prompt_variant: 'A'
  }
};

const campaignB = {
  messaging_rules: {
    personalization: true,
    toneOfVoice: 'professional',
    prompt_variant: 'B'
  }
};
```

Assign leads randomly to each campaign.

### 2. Run Long Enough

- Minimum: 20 messages per variant
- Recommended: 50+ messages per variant
- Allow 1-2 weeks for responses to come in

### 3. One Variable at a Time

Only test prompt variant. Keep these constant:
- Tone of voice
- Personalization settings
- Message type (initial/follow-up)
- Target audience

### 4. Monitor Results Weekly

```bash
# Check progress
curl http://localhost:3000/api/analytics/variants/report
```

Don't make decisions until you have sufficient data.

### 5. Iterate

Once you have a winner:
1. Switch all traffic to winning variant
2. Create new variant to test against winner
3. Repeat to continuously optimize

## Custom Variants

To test different prompt strategies, modify `MessageGenerationService.getSystemPrompt()`:

```typescript
// Example: Test different approaches
if (variant === 'A') {
  basePrompt += `\n\n[Variant A: Lead with industry insight]`;
} else if (variant === 'B') {
  basePrompt += `\n\n[Variant B: Lead with social proof]`;
}
```

The variant system is minimal by design - customize it for your specific testing needs.

## Example Workflow

```bash
# 1. Create campaigns with variants
# 2. Send messages over 2 weeks
# 3. Check interim results

curl http://localhost:3000/api/analytics/variants/report

# 4. Wait for statistical significance
# 5. Make decision based on recommendation
# 6. Switch to winning variant
# 7. Test new variant against winner
```

## Limitations

This is a **lightweight hook system**, not a full platform:

- ❌ No automatic traffic splitting
- ❌ No real-time dashboards
- ❌ No advanced statistical tests
- ❌ No multi-variant testing (only A/B)

For enterprise needs, integrate with:
- Optimizely
- VWO
- LaunchDarkly
- Custom data warehouse

## Future Enhancements

Potential additions:
- Automated traffic splitting
- Multi-armed bandit algorithm
- Bayesian statistics
- Webhook notifications
- Export to data warehouse
- Real-time dashboards

This minimal implementation provides the hooks for these features while keeping complexity low.
