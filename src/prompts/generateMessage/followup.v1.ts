import {
  PromptDefinition,
  GenerateMessageInput
} from '../types';

/**
 * Follow-up Message Generation Prompt V1
 *
 * Generates persistent but respectful follow-up messages.
 * Adds new value instead of just checking in.
 */
export const generateFollowupV1: PromptDefinition<GenerateMessageInput> = {
  id: 'generate_message_followup_v1',
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
    let prompt = `Generate a follow-up LinkedIn message for:\n\n`;
    prompt += `**Lead Name:** ${input.leadName}\n`;

    if (input.company) {
      prompt += `**Company:** ${input.company}\n`;
    }

    // Include conversation history
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      prompt += `\n**Previous Conversation:**\n`;
      input.conversationHistory.slice(-3).forEach(msg => {
        prompt += `- [${msg.sender}]: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    // Include research snapshot if available
    if (input.researchSnapshot) {
      prompt += `\n**Company Research (use this to add new value):**\n`;
      if (input.researchSnapshot.recentNews && input.researchSnapshot.recentNews.length > 0) {
        prompt += `Recent News:\n`;
        input.researchSnapshot.recentNews.forEach((news: string) => {
          prompt += `- ${news}\n`;
        });
      }
      if (input.researchSnapshot.opportunities && input.researchSnapshot.opportunities.length > 0) {
        prompt += `Opportunities:\n`;
        input.researchSnapshot.opportunities.forEach((opp: string) => {
          prompt += `- ${opp}\n`;
        });
      }
      prompt += `\n---\n\n`;
    }

    if (input.customPrompt) {
      prompt += `**Additional Instructions:** ${input.customPrompt}\n\n`;
    }

    prompt += `
Guidelines for follow-up message:
- Reference the previous message briefly
- Add new value or insight (don't just check in)
- Show you've done more research
- Be persistent but respectful
- Keep it even shorter than the initial message (under 75 words)
- Do NOT say "just following up" or "circling back"

Generate only the message text, no subject line or extra formatting.`;

    return prompt;
  },

  metadata: {
    description: 'Original follow-up generation prompt - adds value instead of just checking in',
    createdAt: '2024-01-15'
  }
};
