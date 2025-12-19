import {
  PromptDefinition,
  ClassifyReplyInput
} from '../types';

/**
 * Classification Prompt V2
 *
 * Deterministic intent classification engine.
 * Conservative approach: no persuasion, no interpretation, no optimism bias.
 *
 * Key changes from v1:
 * - More conservative: defaults to neutral when unclear
 * - Never guesses booking intent unless explicitly stated
 * - Reduces confidence when ambiguous
 * - Strictly factual reasoning
 */
export const classifyReplyV2: PromptDefinition<ClassifyReplyInput> = {
  id: 'classify_reply_v2',
  type: 'classify_reply',
  version: 'v2',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  maxTokens: 500,

  system: `You are a deterministic intent classification engine.

Your job is to classify inbound LinkedIn replies into intent and sentiment.
You do not sell.
You do not persuade.
You do not infer beyond the message.

You MUST:
- Return ONLY valid JSON
- Follow the output schema exactly
- Use lowercase enum values only
- Reduce confidence if ambiguity exists

If intent is unclear, classify as "neutral".
Never guess booking intent unless explicitly stated.

Behavioral rules:
- "Sounds interesting" → interested (low confidence)
- "Send info" → interested
- "Let's book / calendar / time works" → booked
- "Not a fit / stop / no thanks" → negative
- Questions ≠ interest unless explicit`,

  user: (input: ClassifyReplyInput): string => {
    let contextSection = '';

    if (input.conversationContext && input.conversationContext.length > 0) {
      contextSection = input.conversationContext.join('\n');
    }

    return `Conversation context:
${contextSection || 'None'}

Latest inbound message:
"${input.messageContent}"

Classify the message strictly based on content.

Respond with valid JSON in this exact format:
{
  "intent": "interested" | "booked" | "neutral" | "negative",
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.85,
  "next_state": "REPLIED" | "INTERESTED" | "BOOKED",
  "reasoning": "short factual explanation"
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
    required: ['intent', 'sentiment', 'confidence', 'next_state', 'reasoning']
  },

  metadata: {
    description: 'Conservative classification - no optimism bias, defaults to neutral when unclear',
    createdAt: '2024-01-15',
    replacedBy: undefined
  }
};
