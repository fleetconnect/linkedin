import OpenAI from 'openai';
import { llmConfig } from '../config/llm.config';
import { ResearchCompanyTool } from '../tools/researchCompany';
import { Lead, Campaign, ResearchSnapshot } from '../types';

/**
 * Message Generation Service
 *
 * Generates personalized LinkedIn messages using research snapshots
 */
export class MessageGenerationService {
  private client: OpenAI;
  private researchTool: ResearchCompanyTool;

  constructor(researchTool: ResearchCompanyTool, apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || llmConfig.apiKey
    });
    this.researchTool = researchTool;
  }

  /**
   * Generate a personalized message for a lead
   */
  async generateMessage(
    lead: Lead,
    campaign: Campaign,
    messageType: 'initial' | 'follow-up' | 'reply',
    customPrompt?: string
  ): Promise<string> {
    const prompt = this.buildMessagePrompt(lead, campaign, messageType, customPrompt);

    try {
      const completion = await this.client.chat.completions.create({
        model: llmConfig.model,
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(campaign)
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const message = completion.choices[0]?.message?.content;

      if (!message) {
        throw new Error('No message generated');
      }

      return message.trim();

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
   */
  private getSystemPrompt(campaign: Campaign): string {
    const tone = campaign.messaging_rules.toneOfVoice || 'professional';

    const toneInstructions = {
      professional: 'Use a professional, business-appropriate tone. Be respectful and formal.',
      casual: 'Use a casual, friendly tone. Be approachable but still professional.',
      friendly: 'Use a warm, friendly tone. Be personable and conversational.'
    };

    return `You are an expert LinkedIn outreach specialist. Your goal is to write compelling, personalized messages that get responses.

Tone: ${toneInstructions[tone]}

Key principles:
- Keep messages concise (2-3 short paragraphs max)
- Lead with value or insight, not with "I'm reaching out because..."
- Use research to demonstrate genuine interest
- Include a clear, low-friction call to action
- Avoid overly salesy language
- Be authentic and human`;
  }

  /**
   * Get message-specific guidelines
   */
  private getMessageGuidelines(campaign: Campaign, messageType: string): string {
    const guidelines: Record<string, string> = {
      initial: `
Guidelines for initial message:
- Start with a specific insight or observation about their company
- Briefly mention how you can help with their challenges
- End with a simple question or soft CTA (e.g., "Would you be open to a brief conversation?")
- Keep it under 100 words
- Do NOT use generic templates or obvious flattery`,

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
   * Generate multiple message variations
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
