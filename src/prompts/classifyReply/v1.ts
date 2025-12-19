import {
  PromptDefinition,
  ClassifyReplyInput
} from '../types';

/**
 * Classification Prompt V1
 *
 * Expert at analyzing LinkedIn message replies to classify intent and sentiment.
 * Returns structured JSON with intent, sentiment, confidence, and next_state.
 */
export const classifyReplyV1: PromptDefinition<ClassifyReplyInput> = {
  id: 'classify_reply_v1',
  type: 'classify_reply',
  version: 'v1',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,  // Low temperature for consistent classification
  maxTokens: 500,

  system: `You are an expert at analyzing LinkedIn message replies to classify the recipient's intent and sentiment.

Your task is to analyze a LinkedIn message reply and determine:
1. **Intent**: What action or interest level the recipient is showing
   - "interested": Shows genuine interest, asks questions, wants to learn more
   - "booked": Confirms a meeting, agrees to a call, commits to next steps
   - "neutral": Polite acknowledgment, non-committal, or unclear intent
   - "negative": Not interested, declines, or shows resistance

2. **Sentiment**: The emotional tone of the message
   - "positive": Friendly, enthusiastic, warm tone
   - "neutral": Professional, matter-of-fact, no strong emotion
   - "negative": Dismissive, cold, annoyed, or frustrated

3. **Confidence**: How certain you are about this classification (0.0 to 1.0)
   - Use 0.9-1.0 for very clear signals
   - Use 0.7-0.89 for reasonably clear signals
   - Use 0.5-0.69 for ambiguous cases
   - Use below 0.5 for very unclear messages

4. **Next State**: The recommended lead state transition
   - "REPLIED": Generic reply received, no clear intent
   - "INTERESTED": Shows interest, wants more information
   - "BOOKED": Meeting/call confirmed`,

  user: (input: ClassifyReplyInput): string => {
    let contextSection = '';

    if (input.leadInfo?.name) {
      contextSection += `Lead Name: ${input.leadInfo.name}\n`;
    }

    if (input.leadInfo?.previousState) {
      contextSection += `Previous Lead State: ${input.leadInfo.previousState}\n`;
    }

    if (input.conversationContext && input.conversationContext.length > 0) {
      contextSection += `\nConversation History:\n`;
      input.conversationContext.forEach((msg, idx) => {
        contextSection += `${idx + 1}. ${msg}\n`;
      });
    }

    if (!contextSection) {
      contextSection = 'No additional context provided.';
    }

    return `## Context:
${contextSection}

## Message to Classify:
"${input.messageContent}"

## Instructions:
Analyze the message carefully considering:
- Explicit statements (e.g., "Yes, let's schedule a call" → booked)
- Questions about the offer (e.g., "Tell me more about..." → interested)
- Timing indicators (e.g., "Maybe later" → neutral, "Not interested" → negative)
- Tone and language choice

Respond ONLY with a valid JSON object in this exact format:
{
  "intent": "interested" | "booked" | "neutral" | "negative",
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.85,
  "next_state": "REPLIED" | "INTERESTED" | "BOOKED",
  "reasoning": "Brief explanation of your classification"
}`;
  },

  outputSchema: {
    type: 'object',
    properties: {
      intent: { type: 'string', enum: ['interested', 'booked', 'neutral', 'negative'] },
      sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      next_state: { type: 'string', enum: ['REPLIED', 'INTERESTED', 'BOOKED'] },
      reasoning: { type: 'string' }
    },
    required: ['intent', 'sentiment', 'confidence', 'next_state']
  },

  metadata: {
    description: 'Original classification prompt - analyzes LinkedIn replies for intent and sentiment',
    createdAt: '2024-01-15'
  }
};
