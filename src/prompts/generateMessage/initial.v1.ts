import {
  PromptDefinition,
  GenerateMessageInput
} from '../types';

/**
 * Initial Message Generation Prompt V1
 *
 * Generates compelling initial LinkedIn outreach messages.
 * Focuses on specific insights and value-driven opening.
 */
export const generateInitialV1: PromptDefinition<GenerateMessageInput> = {
  id: 'generate_message_initial_v1',
  type: 'generate_message',
  version: 'v1',
  // Model determined by config (single source of truth)
  temperature: 0.7,
  maxTokens: 300,

  system: (input: GenerateMessageInput): string => {
    const toneInstructions = {
      professional: 'Use a professional, business-appropriate tone. Be respectful and formal.',
      casual: 'Use a casual, friendly tone. Be approachable but still professional.',
      friendly: 'Use a warm, friendly tone. Be personable and conversational.'
    };

    let basePrompt = `You are an expert LinkedIn outreach specialist. Your goal is to write compelling, personalized messages that get responses.

Tone: ${toneInstructions[input.toneOfVoice]}

Key principles:
- Keep messages concise (2-3 short paragraphs max)
- Lead with value or insight, not with "I'm reaching out because..."
- Use research to demonstrate genuine interest
- Include a clear, low-friction call to action
- Avoid overly salesy language
- Be authentic and human

Formatting Constraint (Non-Negotiable):
You must NOT use dashes of any kind in your output.
This includes hyphens (-), en dashes (–), em dashes (—), and bullet points using dashes.
If a sentence would normally use a dash, rewrite it using commas, periods, or line breaks instead.
Before returning your final answer, scan the entire message and confirm that zero dash characters appear. If any dash appears, rewrite the message until none remain.`;

    // A/B variant modifications
    if (input.variant === 'A') {
      basePrompt += `\n\n[Variant A: Lead with a question or insight]`;
    } else if (input.variant === 'B') {
      basePrompt += `\n\n[Variant B: Lead with a value proposition]`;
    }

    return basePrompt;
  },

  user: (input: GenerateMessageInput): string => {
    let prompt = `Generate an initial LinkedIn message for:\n\n`;
    prompt += `**Lead Name:** ${input.leadName}\n`;

    if (input.company) {
      prompt += `**Company:** ${input.company}\n`;
    }

    // Include research snapshot if available
    if (input.researchSnapshot) {
      prompt += `\n**Company Research:**\n`;
      if (input.researchSnapshot.companyDescription) {
        prompt += `Description: ${input.researchSnapshot.companyDescription}\n`;
      }
      if (input.researchSnapshot.industry) {
        prompt += `Industry: ${input.researchSnapshot.industry}\n`;
      }
      if (input.researchSnapshot.recentNews && input.researchSnapshot.recentNews.length > 0) {
        prompt += `Recent News:\n`;
        input.researchSnapshot.recentNews.forEach((news: string) => {
          prompt += `- ${news}\n`;
        });
      }
      if (input.researchSnapshot.challenges && input.researchSnapshot.challenges.length > 0) {
        prompt += `Challenges:\n`;
        input.researchSnapshot.challenges.forEach((challenge: string) => {
          prompt += `- ${challenge}\n`;
        });
      }
      prompt += `\n---\n\n`;
    }

    if (input.customPrompt) {
      prompt += `**Additional Instructions:** ${input.customPrompt}\n\n`;
    }

    prompt += `
Guidelines for initial message:
- Start with a specific insight or observation about their company
- Briefly mention how you can help with their challenges
- End with a simple question or soft CTA (e.g., "Would you be open to a brief conversation?")
- Keep it under 100 words
- Do NOT use generic templates or obvious flattery

Generate only the message text, no subject line or extra formatting.`;

    return prompt;
  },

  metadata: {
    description: 'Original initial message generation prompt - focuses on value and specificity',
    createdAt: '2024-01-15'
  }
};
