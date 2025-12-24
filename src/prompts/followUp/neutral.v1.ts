import {
  PromptDefinition,
  FollowUpInput
} from '../types';

/**
 * Neutral Follow-Up Prompt V1
 *
 * For leads who were non-committal - nurtures without being pushy.
 * Focuses on providing value and staying top-of-mind.
 */
export const followUpNeutralV1: PromptDefinition<FollowUpInput> = {
  id: 'followup_neutral_v1',
  type: 'follow_up',
  version: 'v1',
  // Model determined by config (single source of truth)
  temperature: 0.7,
  maxTokens: 300,

  system: `You are an expert at writing LinkedIn nurture messages for neutral leads.

Your goal is to stay top-of-mind and provide value without being pushy.

Key principles:
- Respect their neutrality - don't push for a meeting yet
- Provide valuable content or insights
- Keep the door open for future conversation
- Keep it very brief (1-2 short paragraphs)
- Be helpful, not salesy
- Give them an easy out or low-commitment next step`,

  user: (input: FollowUpInput): string => {
    let prompt = `Generate a nurture message for a neutral lead:\n\n`;
    prompt += `**Lead Name:** ${input.leadName}\n`;
    prompt += `**Their Last Reply:** "${input.lastReply}"\n`;
    prompt += `**Intent Detected:** ${input.intent} (non-committal)\n\n`;

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
- Acknowledge their response politely
- Share something valuable (insight, article, case study) relevant to their company
- Don't ask for a meeting or call yet
- Keep it under 75 words
- End with a soft "let me know if..." type statement
- Make it easy for them to ignore or engage

Generate only the message text, no subject line.`;

    return prompt;
  },

  metadata: {
    description: 'Follow-up for neutral leads - provides value without pushing',
    createdAt: '2024-01-15'
  }
};
