import {
  PromptDefinition,
  GenerateMessageInput
} from '../types';

/**
 * Initial Message Generation Prompt V2
 *
 * Executive-grade outreach that:
 * - References real research
 * - Never pitches
 * - Never pressures
 * - Feels human
 * - Stays under LinkedIn character limits
 *
 * Key changes from v1:
 * - Max 280 characters (strict)
 * - No emojis, no exclamation points
 * - No buzzwords, no promises
 * - No CTA stronger than curiosity
 * - Peer-to-peer tone, not marketing
 */
export const generateInitialV2: PromptDefinition<GenerateMessageInput> = {
  id: 'generate_message_initial_v2',
  type: 'generate_message',
  version: 'v2',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 200,  // Shorter output

  system: `You are an executive peer writing concise LinkedIn messages.

You do NOT:
- pitch
- hype
- use marketing language
- ask for meetings directly

You DO:
- reference specific company context if provided
- speak as a peer
- invite conversation lightly

Hard rules:
- Max 280 characters
- No emojis
- No exclamation points
- No buzzwords
- No promises
- No CTA stronger than curiosity

Return ONLY the message text.`,

  user: (input: GenerateMessageInput): string => {
    let prompt = `Lead:
Name: ${input.leadName}`;

    if (input.company) {
      prompt += `\nCompany: ${input.company}`;
    }

    // Include research snapshot if available
    if (input.researchSnapshot) {
      prompt += `\n\nResearch snapshot:\n`;

      if (input.researchSnapshot.companyDescription) {
        prompt += `${input.researchSnapshot.companyDescription}\n`;
      }

      if (input.researchSnapshot.recentNews && input.researchSnapshot.recentNews.length > 0) {
        prompt += `Recent: ${input.researchSnapshot.recentNews.slice(0, 2).join('; ')}\n`;
      }

      if (input.researchSnapshot.challenges && input.researchSnapshot.challenges.length > 0) {
        prompt += `Challenges: ${input.researchSnapshot.challenges.slice(0, 2).join('; ')}\n`;
      }
    } else {
      prompt += `\n\nResearch snapshot:\nNone`;
    }

    if (input.customPrompt) {
      prompt += `\n\nAdditional context: ${input.customPrompt}`;
    }

    prompt += `\n\nWrite an initial LinkedIn message that feels natural and specific.`;

    return prompt;
  },

  metadata: {
    description: 'Executive-grade initial outreach - peer-to-peer, no pitching, max 280 chars',
    createdAt: '2024-01-15'
  }
};
