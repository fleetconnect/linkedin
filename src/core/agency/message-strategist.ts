/**
 * Message Strategist
 * Decides messaging strategy (angle, style, CTA) based on lead context
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import type { NormalizedLead } from './lead-normalizer.js';
import type { ICPScoreResult } from './icp-scorer.js';
import type { ClientConfig } from '../../types/client-config.js';
import type { StructuredResearch } from '../../clients/perplexity-extractors.js';

export interface MessageStrategy {
  primary_angle: string;
  supporting_points: string[];
  cta_style: 'soft' | 'direct';
  sequence_type: 'connect_then_dm' | 'dm_only' | 'email_only' | 'multichannel';
  personalization_level: 'light' | 'medium' | 'deep';
  tone_guidance: string;
  avoid_list: string[];
}

export interface LinkedInMessages {
  connect_note?: string;
  dm_1: string;
  followups: string[];
  spam_risk: {
    score: number;
    flags: string[];
  };
}

export interface MessageValidation {
  ok: boolean;
  risk_score: number;
  flags: string[];
  suggested_edits: string[];
}

export class MessageStrategist {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Build message strategy based on lead context
   */
  async buildStrategy(params: {
    lead: NormalizedLead;
    config: ClientConfig;
    fit_score: number;
    company_research?: StructuredResearch;
    person_research?: any;
  }): Promise<MessageStrategy> {
    logger.info('Building message strategy', {
      lead_id: params.lead.lead_id,
      fit_score: params.fit_score,
    });

    const prompt = this.buildStrategyPrompt(params);

    try {
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

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const strategy = JSON.parse(content.text) as MessageStrategy;

      logger.info('Message strategy created', {
        lead_id: params.lead.lead_id,
        angle: strategy.primary_angle,
      });

      return strategy;
    } catch (error) {
      logger.error('Strategy creation failed', { error });

      // Fallback strategy
      return this.createFallbackStrategy(params);
    }
  }

  /**
   * Generate LinkedIn messages based on strategy
   */
  async generateMessages(params: {
    lead: NormalizedLead;
    strategy: MessageStrategy;
    config: ClientConfig;
    research?: StructuredResearch;
  }): Promise<LinkedInMessages> {
    logger.info('Generating LinkedIn messages', {
      lead_id: params.lead.lead_id,
      sequence_type: params.strategy.sequence_type,
    });

    const prompt = this.buildMessagePrompt(params);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const messages = JSON.parse(content.text) as LinkedInMessages;

      // Validate and score spam risk
      messages.spam_risk = this.checkSpamRisk(messages);

      logger.info('Messages generated', {
        lead_id: params.lead.lead_id,
        spam_risk: messages.spam_risk.score,
      });

      return messages;
    } catch (error) {
      logger.error('Message generation failed', { error });
      throw error;
    }
  }

  /**
   * Validate message safety
   */
  validateMessageSafety(
    messages: LinkedInMessages,
    channel: 'linkedin' | 'email',
    policy: {
      no_creepy: boolean;
      no_guarantees: boolean;
    }
  ): MessageValidation {
    const flags: string[] = [];
    const suggested_edits: string[] = [];
    let risk_score = 0;

    const allText = [
      messages.connect_note || '',
      messages.dm_1,
      ...messages.followups,
    ]
      .join(' ')
      .toLowerCase();

    // Creepy personalization check
    if (policy.no_creepy) {
      const creepyPatterns = [
        'congrat',
        'saw you',
        'noticed you',
        'saw that you',
        'i see that',
        'stalking',
        'following you',
      ];

      for (const pattern of creepyPatterns) {
        if (allText.includes(pattern)) {
          flags.push(`Potentially creepy: "${pattern}"`);
          risk_score += 15;
        }
      }
    }

    // Guarantees check
    if (policy.no_guarantees) {
      const guaranteePatterns = [
        'guarantee',
        'promise',
        'will definitely',
        '100%',
        'no risk',
      ];

      for (const pattern of guaranteePatterns) {
        if (allText.includes(pattern)) {
          flags.push(`Makes guarantees: "${pattern}"`);
          suggested_edits.push(`Remove guarantee language: "${pattern}"`);
          risk_score += 20;
        }
      }
    }

    // Spam indicators
    const spamPatterns = [
      { pattern: 'limited time', weight: 10 },
      { pattern: 'act now', weight: 15 },
      { pattern: 'exclusive offer', weight: 10 },
      { pattern: 'click here', weight: 20 },
      { pattern: '!!!', weight: 15 },
      { pattern: 'free money', weight: 25 },
    ];

    for (const { pattern, weight } of spamPatterns) {
      if (allText.includes(pattern)) {
        flags.push(`Spam indicator: "${pattern}"`);
        risk_score += weight;
      }
    }

    // Length checks for LinkedIn
    if (channel === 'linkedin') {
      if (messages.connect_note && messages.connect_note.length > 300) {
        flags.push('Connect note too long (>300 chars)');
        suggested_edits.push('Shorten connect note to under 300 characters');
        risk_score += 10;
      }

      if (messages.dm_1.length > 1000) {
        flags.push('DM too long (>1000 chars)');
        suggested_edits.push('Shorten DM to under 1000 characters');
        risk_score += 5;
      }
    }

    return {
      ok: risk_score < 50 && flags.length < 5,
      risk_score: Math.min(100, risk_score),
      flags,
      suggested_edits,
    };
  }

  /**
   * Build strategy prompt
   */
  private buildStrategyPrompt(params: {
    lead: NormalizedLead;
    config: ClientConfig;
    fit_score: number;
    company_research?: StructuredResearch;
  }): string {
    const { lead, config, fit_score, company_research } = params;

    return `
You are a B2B outreach strategist. Your job is to decide HOW to approach this lead (not write copy yet).

LEAD CONTEXT:
- Name: ${lead.firstName} ${lead.lastName}
- Title: ${lead.title}
- Company: ${lead.company} (${lead.companySize ? lead.companySize + ' employees' : 'size unknown'})
- Industry: ${lead.industry}
- ICP Fit Score: ${fit_score}/100

${
  company_research?.company_signals
    ? `COMPANY SIGNALS:\n${company_research.company_signals.map((s) => `- ${s}`).join('\n')}`
    : ''
}

${
  company_research?.buying_triggers
    ? `BUYING TRIGGERS:\n${company_research.buying_triggers.map((t) => `- ${t}`).join('\n')}`
    : ''
}

CLIENT OFFER:
- Product: ${config.offer.product_name}
- Value Prop: ${config.offer.value_proposition}
- Target Outcome: ${config.offer.target_outcome}

CLIENT PREFERENCES:
- Tone: ${config.preferences.tone}
- CTA Style: ${config.preferences.cta_style}
- Risk Tolerance: ${config.preferences.risk_tolerance}
- Personalization Level: ${config.preferences.personalization_level}

YOUR TASK:
Decide the messaging strategy for this lead. Return ONLY valid JSON with this structure:

{
  "primary_angle": "The single strongest hook/angle to open with",
  "supporting_points": ["2-3 supporting points to reinforce the angle"],
  "cta_style": "soft|direct",
  "sequence_type": "connect_then_dm|dm_only",
  "personalization_level": "light|medium|deep",
  "tone_guidance": "Brief guidance on tone/voice",
  "avoid_list": ["Things NOT to mention that might backfire"]
}

RULES:
- Pick ONE strong angle, not multiple
- Prefer timing/signals over generic pain points
- Avoid creepy over-personalization
- Match client's risk tolerance
- If low company signals, go lighter on personalization
- Output JSON only, no commentary
`.trim();
  }

  /**
   * Build message generation prompt
   */
  private buildMessagePrompt(params: {
    lead: NormalizedLead;
    strategy: MessageStrategy;
    config: ClientConfig;
    research?: StructuredResearch;
  }): string {
    const { lead, strategy, config, research } = params;

    const includeConnectNote = strategy.sequence_type === 'connect_then_dm';

    return `
You are writing LinkedIn outreach for a B2B sales campaign. Write messages following the strategy precisely.

LEAD:
- Name: ${lead.firstName}
- Title: ${lead.title}
- Company: ${lead.company}

STRATEGY (follow this exactly):
- Primary Angle: ${strategy.primary_angle}
- Supporting Points: ${strategy.supporting_points.join('; ')}
- CTA Style: ${strategy.cta_style}
- Personalization Level: ${strategy.personalization_level}
- Tone: ${strategy.tone_guidance}
- Avoid: ${strategy.avoid_list.join(', ')}

${
  research?.company_signals
    ? `FACTS TO USE:\n${research.company_signals.slice(0, 3).map((s) => `- ${s}`).join('\n')}`
    : ''
}

OFFER:
- Product: ${config.offer.product_name}
- Value: ${config.offer.value_proposition}
- Outcome: ${config.offer.target_outcome}

WRITE:
${
  includeConnectNote
    ? '1. Connect note (under 280 chars, friendly, no pitch)\n'
    : ''
}
${includeConnectNote ? '2' : '1'}. First DM (under 600 chars, lead with angle, ${strategy.cta_style} CTA)
${includeConnectNote ? '3-4' : '2-3'}. Two follow-ups (short, add value, don't be pushy)

Return ONLY valid JSON:
{
  ${includeConnectNote ? '"connect_note": "...",' : ''}
  "dm_1": "...",
  "followups": ["...", "..."]
}

CRITICAL RULES:
- NO "I saw you..." or "I noticed..." (creepy)
- NO "Congrats on..." unless it's breaking news
- NO guarantees or promises
- Lead with context/value, not your product
- Keep it conversational, not salesy
- ${strategy.cta_style === 'soft' ? 'Soft CTA (question, not ask)' : 'Direct CTA (clear ask)'}
- Output JSON only
`.trim();
  }

  /**
   * Create fallback strategy when AI fails
   */
  private createFallbackStrategy(params: {
    lead: NormalizedLead;
    config: ClientConfig;
  }): MessageStrategy {
    return {
      primary_angle: `Role-relevant value for ${params.lead.title}s`,
      supporting_points: [
        params.config.offer.primary_benefit,
        'Relevant to your role',
      ],
      cta_style: params.config.preferences.cta_style,
      sequence_type: 'connect_then_dm',
      personalization_level: 'light',
      tone_guidance: 'Professional and helpful',
      avoid_list: ['Over-personalization', 'Pushy language'],
    };
  }

  /**
   * Check spam risk in messages
   */
  private checkSpamRisk(messages: LinkedInMessages): {
    score: number;
    flags: string[];
  } {
    const flags: string[] = [];
    let score = 0;

    const allText = [
      messages.connect_note || '',
      messages.dm_1,
      ...messages.followups,
    ].join(' ');

    // Check for spam patterns
    if (allText.match(/(!){3,}/)) {
      flags.push('Excessive exclamation marks');
      score += 20;
    }

    if (allText.match(/(\?){3,}/)) {
      flags.push('Excessive question marks');
      score += 15;
    }

    if (allText.toLowerCase().includes('click here')) {
      flags.push('Contains "click here"');
      score += 25;
    }

    if (allText.toLowerCase().includes('limited time')) {
      flags.push('Urgency tactic');
      score += 15;
    }

    // Check for CAPS
    const capsRatio =
      (allText.match(/[A-Z]/g) || []).length / allText.length;
    if (capsRatio > 0.15) {
      flags.push('Too many capital letters');
      score += 10;
    }

    return {
      score: Math.min(100, score),
      flags,
    };
  }
}
