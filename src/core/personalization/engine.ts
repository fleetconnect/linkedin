/**
 * Personalization Engine
 * Generates highly personalized messages using AI based on lead context
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { containsSpamIndicators, validateMessageLength } from '../../utils/validators.js';
import type {
  Lead,
  Message,
  Campaign,
  PersonalizedMessage,
  MessageGenerationContext,
  Channel,
} from '../../types/index.js';

export class PersonalizationEngine {
  private anthropic: Anthropic;
  private contextCache: Map<string, MessageGenerationContext> = new Map();

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.api.anthropic.apiKey,
    });
  }

  /**
   * Generate a personalized message for a lead
   */
  async generateMessage(params: {
    leadId: string;
    campaignId: string;
    stepNumber?: number;
    context?: Record<string, any>;
  }): Promise<PersonalizedMessage> {
    logger.info(`Generating message for lead ${params.leadId}`);

    try {
      const context = await this.buildContext(params);
      const prompt = this.buildPrompt(context, params.stepNumber);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = this.parseResponse(rawContent);

      // Validate the generated message
      const validation = this.validateGeneratedMessage(parsed, context.lead);
      if (!validation.valid) {
        logger.warn(`Generated message failed validation: ${validation.reason}`);
        // Retry with stricter prompt
        return await this.retryWithStricterPrompt(context, validation.reason || '');
      }

      logger.info(`Successfully generated message for lead ${params.leadId}`);
      return parsed;
    } catch (error) {
      logger.error(`Failed to generate message for lead ${params.leadId}`, error);
      throw new Error('Message generation failed');
    }
  }

  /**
   * Generate multiple message variations for A/B testing
   */
  async generateVariations(params: {
    leadId: string;
    campaignId: string;
    count: number;
  }): Promise<PersonalizedMessage[]> {
    logger.info(`Generating ${params.count} variations for lead ${params.leadId}`);

    const variations: PersonalizedMessage[] = [];
    const context = await this.buildContext(params);

    for (let i = 0; i < params.count; i++) {
      const prompt = this.buildPrompt(context, undefined, {
        variation: i + 1,
        focus: this.getVariationFocus(i),
      });

      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
        variations.push(this.parseResponse(rawContent));
      } catch (error) {
        logger.error(`Failed to generate variation ${i + 1}`, error);
      }
    }

    return variations;
  }

  /**
   * Improve an existing message based on feedback
   */
  async improveMessage(
    originalMessage: string,
    feedback: string,
    lead: Lead
  ): Promise<PersonalizedMessage> {
    logger.info('Improving message based on feedback');

    const prompt = `You are an expert at writing personalized cold outreach messages.

Original message:
${originalMessage}

Feedback/Issue:
${feedback}

Lead information:
Name: ${lead.firstName} ${lead.lastName}
Title: ${lead.title}
Company: ${lead.company}

Please rewrite the message to address the feedback while maintaining personalization and effectiveness.

Respond in JSON format:
{
  "content": "improved message here",
  "reasoning": "explanation of changes made",
  "confidence": 0.0-1.0,
  "personalizationFactors": ["factor1", "factor2"]
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.parseResponse(rawContent);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async buildContext(params: {
    leadId: string;
    campaignId: string;
    context?: Record<string, any>;
  }): Promise<MessageGenerationContext> {
    // In a real implementation, this would fetch from database/storage
    // For now, return a mock context
    const cacheKey = `${params.leadId}-${params.campaignId}`;

    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    const context: MessageGenerationContext = {
      lead: {
        id: params.leadId,
        firstName: 'John',
        lastName: 'Doe',
        title: 'VP of Sales',
        company: 'TechCorp',
        status: 'new' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      campaign: {} as Campaign,
      previousMessages: [],
      replyHistory: [],
      insights: params.context?.insights,
    };

    this.contextCache.set(cacheKey, context);
    return context;
  }

  private buildPrompt(
    context: MessageGenerationContext,
    stepNumber?: number,
    options?: { variation?: number; focus?: string }
  ): string {
    const { lead, previousMessages, insights } = context;

    let prompt = `You are an expert at writing highly personalized, effective cold outreach messages.

Your task is to write a ${stepNumber === 1 || !stepNumber ? 'first' : 'follow-up'} message for the following lead:

Lead Information:
- Name: ${lead.firstName} ${lead.lastName}
- Title: ${lead.title}
- Company: ${lead.company}
${lead.location ? `- Location: ${lead.location}` : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${lead.companySize ? `- Company Size: ${lead.companySize}` : ''}

${lead.enrichmentData ? `Additional Context:\n${JSON.stringify(lead.enrichmentData, null, 2)}` : ''}

${previousMessages.length > 0 ? `Previous Messages:\n${previousMessages.map(m => `- ${m.content}`).join('\n')}` : ''}

${insights ? `Campaign Insights:\n${insights.join('\n')}` : ''}

Guidelines:
1. Keep it concise (2-4 sentences max)
2. Focus on value, not features
3. Reference something specific about their role, company, or recent events
4. Avoid generic templates or spam triggers
5. Natural, conversational tone
6. Clear call-to-action
${options?.focus ? `7. Focus on: ${options.focus}` : ''}

Respond in JSON format:
{
  "subject": "optional email subject line",
  "content": "your personalized message here",
  "reasoning": "brief explanation of your personalization approach",
  "confidence": 0.0-1.0,
  "personalizationFactors": ["specific factors used for personalization"]
}`;

    return prompt;
  }

  private parseResponse(rawContent: string): PersonalizedMessage {
    try {
      // Try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        subject: parsed.subject,
        content: parsed.content,
        reasoning: parsed.reasoning || '',
        confidence: parsed.confidence || 0.8,
        personalizationFactors: parsed.personalizationFactors || [],
      };
    } catch (error) {
      logger.error('Failed to parse AI response', error);
      // Fallback: use raw content as message
      return {
        content: rawContent,
        reasoning: 'Fallback: raw response used',
        confidence: 0.5,
        personalizationFactors: [],
      };
    }
  }

  private validateGeneratedMessage(
    message: PersonalizedMessage,
    lead: Lead
  ): { valid: boolean; reason?: string } {
    // Check for spam indicators
    if (containsSpamIndicators(message.content)) {
      return { valid: false, reason: 'Contains spam indicators' };
    }

    // Check message length
    const lengthValidation = validateMessageLength(message.content, 'linkedin_message');
    if (!lengthValidation.valid) {
      return lengthValidation;
    }

    // Check for personalization
    const hasPersonalization =
      message.content.includes(lead.firstName) ||
      message.content.includes(lead.company) ||
      message.personalizationFactors.length > 0;

    if (!hasPersonalization) {
      return { valid: false, reason: 'Message lacks personalization' };
    }

    return { valid: true };
  }

  private async retryWithStricterPrompt(
    context: MessageGenerationContext,
    issue: string
  ): Promise<PersonalizedMessage> {
    logger.info('Retrying message generation with stricter prompt');

    const strictPrompt = this.buildPrompt(context) + `\n\nIMPORTANT: The previous attempt failed because: ${issue}. Please ensure you avoid this issue.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: strictPrompt }],
    });

    const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.parseResponse(rawContent);
  }

  private getVariationFocus(index: number): string {
    const focuses = [
      'value proposition and ROI',
      'pain points and challenges',
      'social proof and success stories',
      'curiosity and intrigue',
      'direct and straightforward approach',
    ];

    return focuses[index % focuses.length];
  }

  /**
   * Extract key insights from message performance
   */
  async extractInsights(
    messages: Message[],
    replies: any[]
  ): Promise<string[]> {
    if (messages.length === 0) {
      return [];
    }

    const successfulMessages = messages.filter(m =>
      replies.some(r => r.messageId === m.id && r.sentiment === 'positive')
    );

    const insights: string[] = [];

    // Analyze patterns in successful messages
    if (successfulMessages.length > 0) {
      const avgLength =
        successfulMessages.reduce((sum, m) => sum + m.content.length, 0) /
        successfulMessages.length;

      insights.push(`Successful messages average ${Math.round(avgLength)} characters`);

      // Check for common patterns
      const hasQuestions = successfulMessages.filter(m => m.content.includes('?'));
      if (hasQuestions.length > successfulMessages.length * 0.7) {
        insights.push('Messages with questions perform well');
      }
    }

    return insights;
  }
}
