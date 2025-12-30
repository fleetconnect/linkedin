import { LLMService } from './LLMService';
import { ResearchCompanyTool } from '../tools/researchCompany';
import { Lead, Campaign, ResearchSnapshot } from '../types';

/**
 * Message Generation Service
 *
 * Generates personalized LinkedIn messages using Claude
 * ENFORCED: Claude-only for message generation
 */
export class MessageGenerationService {
  private llmService: LLMService;
  private researchTool: ResearchCompanyTool;

  constructor(researchTool: ResearchCompanyTool, llmService?: LLMService) {
    this.llmService = llmService || new LLMService();
    this.researchTool = researchTool;
  }

  /**
   * Generate a personalized message for a lead using Claude
   * Supports A/B testing via campaign.messaging_rules.prompt_variant
   */
  async generateMessage(
    lead: Lead,
    campaign: Campaign,
    messageType: 'initial' | 'follow-up' | 'reply',
    customPrompt?: string
  ): Promise<string> {
    const variant = campaign.messaging_rules.prompt_variant;
    const systemPrompt = this.getSystemPrompt(campaign, variant);
    const userPrompt = this.buildMessagePrompt(lead, campaign, messageType, customPrompt);

    try {
      const message = await this.llmService.generate(systemPrompt, userPrompt, {
        temperature: 0.7,
        maxTokens: 300
      });

      return message;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Message generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build message generation prompt with research snapshot
   */
  private buildMessagePrompt(
    lead: Lead,
    campaign: Campaign,
    messageType: string,
    customPrompt?: string
  ): string {
    let prompt = `Generate a ${messageType} LinkedIn message for:\n\n`;
    prompt += `**Lead Name:** ${lead.name}\n`;

    if (lead.company) {
      prompt += `**Company:** ${lead.company}\n`;
    }

    prompt += `**Lead State:** ${lead.state}\n`;
    prompt += `**Message Type:** ${messageType}\n\n`;

    // Include research snapshot if available
    if (lead.research_snapshot && campaign.messaging_rules.personalization) {
      prompt += this.researchTool.formatSnapshotForPrompt(lead.research_snapshot);
      prompt += `\n---\n\n`;
    }

    // Include conversation history for follow-ups
    if (messageType !== 'initial' && lead.conversationHistory.length > 0) {
      prompt += `**Previous Conversation:**\n`;
      lead.conversationHistory.slice(-3).forEach(msg => {
        prompt += `- [${msg.sender}]: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    if (customPrompt) {
      prompt += `**Additional Instructions:** ${customPrompt}\n\n`;
    }

    prompt += this.getMessageGuidelines(campaign, messageType);

    return prompt;
  }

  /**
   * Get system prompt based on campaign settings
   * Supports A/B testing with variant-specific instructions
   */
  private getSystemPrompt(campaign: Campaign, variant?: 'A' | 'B'): string {
    const tone = campaign.messaging_rules.toneOfVoice || 'professional';

    const toneInstructions = {
      professional: 'Use a professional, business-appropriate tone. Be respectful and formal.',
      casual: 'Use a casual, friendly tone. Be approachable but still professional.',
      friendly: 'Use a warm, friendly tone. Be personable and conversational.'
    };

    let basePrompt = `You are an expert LinkedIn outreach specialist. Your goal is to write compelling, personalized messages that get responses.

Tone: ${toneInstructions[tone]}

Key principles:
- Keep messages concise (2-3 short paragraphs max)
- Lead with value or insight, not with "I'm reaching out because..."
- Use research to demonstrate genuine interest
- Include a clear, low-friction call to action
- Avoid overly salesy language
- Be authentic and human

⚠️ CRITICAL VALIDATION RULES FOR INITIAL MESSAGES:
When generating an "initial" message type, you MUST follow these STRICT rules:
1. Exactly 20-40 words (count every word!)
2. Absolutely NO dashes of any kind (-, –, —)
3. NO line breaks - must be a single continuous paragraph
4. NO call-to-action - be purely observational (no questions, no "open to", no "would you", no "?")
5. Make a specific, genuine observation about their work/company

These rules are ENFORCED by automated validation. Messages that violate ANY rule will be rejected.`;

    // A/B variant modifications (still must follow strict rules for initial messages)
    if (variant === 'A') {
      basePrompt += `\n\n[Variant A: For initial messages, lead with an insight about their recent work/achievement]`;
    } else if (variant === 'B') {
      basePrompt += `\n\n[Variant B: For initial messages, lead with an observation about their company/industry]`;
    }

    return basePrompt;
  }

  /**
   * Get message-specific guidelines
   */
  private getMessageGuidelines(campaign: Campaign, messageType: string): string {
    const guidelines: Record<string, string> = {
      initial: `
Guidelines for initial message (STRICT RULES - MUST FOLLOW):
- CRITICAL: Must be 20-40 words ONLY (count carefully!)
- CRITICAL: NO dashes of any kind (-, –, —)
- CRITICAL: NO line breaks - single paragraph only
- CRITICAL: NO call-to-action (no questions, no "open to", no "would you", no "?")
- Be purely OBSERVATIONAL - make a specific insight about their company/work
- Sound natural and conversational, like a genuine observation
- Do NOT use generic templates or obvious flattery
- Example tone: "I noticed your team's recent work on X. The approach to Y seems really innovative given the challenges in Z."`,

      'follow-up': `
Guidelines for follow-up message:
- Reference the previous message briefly
- Add new value or insight
- Show you've done more research
- Be persistent but respectful
- Keep it even shorter than the initial message`,

      reply: `
Guidelines for reply:
- Respond directly to their message
- Address any questions they asked
- Provide value in your response
- Move the conversation forward with a clear next step
- Match their tone and level of formality`
    };

    return guidelines[messageType] || guidelines.initial;
  }

  /**
   * Generate multiple message variations using Claude
   */
  async generateVariations(
    lead: Lead,
    campaign: Campaign,
    messageType: 'initial' | 'follow-up' | 'reply',
    count: number = 3
  ): Promise<string[]> {
    const variations: string[] = [];

    for (let i = 0; i < count; i++) {
      const message = await this.generateMessage(lead, campaign, messageType);
      variations.push(message);

      // Small delay between generations
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return variations;
  }

  /**
   * Validate message quality
   */
  validateMessage(message: string): {
    valid: boolean;
    issues: string[];
    wordCount: number;
  } {
    const issues: string[] = [];
    const wordCount = message.split(/\s+/).length;

    // Check length
    if (wordCount > 150) {
      issues.push('Message is too long (over 150 words)');
    }

    if (wordCount < 20) {
      issues.push('Message is too short (under 20 words)');
    }

    // Check for generic patterns
    const genericPatterns = [
      /I hope this message finds you well/i,
      /I came across your profile/i,
      /I wanted to reach out/i,
      /I'd like to connect/i
    ];

    genericPatterns.forEach(pattern => {
      if (pattern.test(message)) {
        issues.push('Message contains generic opening phrase');
      }
    });

    // Check for CTA
    const hasQuestion = message.includes('?');
    const hasCtaWords = /open to|interested in|available for|thoughts on|quick (call|chat|conversation)/i.test(message);

    if (!hasQuestion && !hasCtaWords) {
      issues.push('Message lacks clear call-to-action');
    }

    return {
      valid: issues.length === 0,
      issues,
      wordCount
    };
  }
}

export default MessageGenerationService;
