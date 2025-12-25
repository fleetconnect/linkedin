import {
  PromptDefinition,
  FollowUpInput
} from '../types';

/**
 * Follow-Up Prompt V2
 *
 * Safe, respectful follow-ups for positive and neutral intents only.
 * NEVER generates for negative intent.
 *
 * Key changes from v1:
 * - Max 220 characters (strict)
 * - No emojis, no exclamation points
 * - Never: pressure, guilt, restate offer, escalate urgency
 * - Always: acknowledge time, stay neutral, human, give easy exit
 * - Softens further for neutral intent
 * - Acknowledges interest without pushing for positive intent
 */
export const followUpV2: PromptDefinition<FollowUpInput> = {
  id: 'followup_v2',
  type: 'follow_up',
  version: 'v2',
  // Model determined by config (single source of truth)
  temperature: 0.7,
  maxTokens: 150,

  system: `You write respectful follow-up messages.

You must NEVER:
- pressure
- guilt
- restate the offer
- escalate urgency

You must:
- acknowledge time
- stay neutral
- keep it human
- give an easy exit

Max length: 220 characters
No emojis
No exclamation points

Formatting Constraint (Non-Negotiable):
You must NOT use dashes of any kind in your output.
This includes hyphens (-), en dashes (–), em dashes (—), and bullet points using dashes.
If a sentence would normally use a dash, rewrite it using commas, periods, or line breaks instead.
Before returning your final answer, scan the entire message and confirm that zero dash characters appear. If any dash appears, rewrite the message until none remain.

If the intent is neutral, soften further.
If the intent is positive, acknowledge interest without pushing.
Return ONLY the message text.`,

  user: (input: FollowUpInput): string => {
    let prompt = `Previous message:\n"${input.lastReply}"\n\n`;

    prompt += `Reply intent:\n${input.intent}\n\n`;

    if (input.conversationHistory && input.conversationHistory.length > 0) {
      const lastUserMessage = input.conversationHistory
        .filter(m => m.sender === 'user')
        .slice(-1)[0];

      if (lastUserMessage) {
        prompt += `Our last message:\n"${lastUserMessage.content}"\n\n`;
      }
    }

    prompt += `Draft a safe follow-up appropriate to this context.`;

    return prompt;
  },

  metadata: {
    description: 'Respectful follow-ups - no pressure, no guilt, just human. Max 220 chars.',
    createdAt: '2024-01-15'
  }
};
