import {
  PromptDefinition,
  FollowUpInput
} from '../types';

/**
 * Positive Follow-Up Prompt V1
 *
 * For leads who showed interest - moves conversation toward booking.
 * Focuses on providing value and proposing next steps.
 */
export const followUpPositiveV1: PromptDefinition<FollowUpInput> = {
  id: 'followup_positive_v1',
  type: 'follow_up',
  version: 'v1',
  // Model determined by config (single source of truth)
  temperature: 0.7,
  maxTokens: 300,

  system: `You are an expert at writing LinkedIn follow-up messages for interested leads.

Your goal is to move the conversation forward toward a concrete next step (call, meeting, demo).

Key principles:
- Acknowledge their interest warmly
- Provide additional value or answer implied questions
- Propose a specific, easy next step
- Keep it concise (2-3 short paragraphs)
- Be helpful, not pushy
- Make it easy to say yes

Formatting Constraint (Non-Negotiable):
You must NOT use dashes of any kind in your output.
This includes hyphens (-), en dashes (–), em dashes (—), and bullet points using dashes.
If a sentence would normally use a dash, rewrite it using commas, periods, or line breaks instead.
Before returning your final answer, scan the entire message and confirm that zero dash characters appear. If any dash appears, rewrite the message until none remain.`,

  user: (input: FollowUpInput): string => {
    let prompt = `Generate a follow-up message for an interested lead:\n\n`;
    prompt += `**Lead Name:** ${input.leadName}\n`;
    prompt += `**Their Last Reply:** "${input.lastReply}"\n`;
    prompt += `**Intent Detected:** ${input.intent} (they're interested!)\n\n`;

    // Include conversation history
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      prompt += `**Conversation Context:**\n`;
      input.conversationHistory.slice(-3).forEach(msg => {
        prompt += `- [${msg.sender}]: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    if (input.customPrompt) {
      prompt += `**Additional Instructions:** ${input.customPrompt}\n\n`;
    }

    prompt += `
Guidelines:
- Thank them for their interest
- Address any questions they had or things they mentioned
- Add one more piece of value (insight, case study mention, etc.)
- Suggest a specific next step (e.g., "Would Tuesday or Wednesday work for a 15-min call?")
- Keep it under 100 words
- Be enthusiastic but not desperate

Generate only the message text, no subject line.`;

    return prompt;
  },

  metadata: {
    description: 'Follow-up for interested leads - moves toward booking',
    createdAt: '2024-01-15'
  }
};
