/**
 * Reply Classifier
 * Classifies replies into intent + sentiment + next action
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import type { NormalizedLead } from './lead-normalizer.js';

export interface ReplyClassification {
  intent:
    | 'interested'
    | 'timing'
    | 'question'
    | 'objection'
    | 'not_interested'
    | 'unsubscribe';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  recommended_next_step:
    | 'book_call'
    | 'answer_question'
    | 'nurture'
    | 'close_lost'
    | 'handoff';
  reasoning: string;
  extracted_context?: {
    timing_mentioned?: string;
    specific_objection?: string;
    question_asked?: string;
  };
}

export interface ReplyDraft {
  draft: string;
  options: string[];
  risk_flags: string[];
  tone: string;
}

export class ReplyClassifier {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Classify a reply
   */
  async classifyReply(params: {
    thread: {
      messages: Array<{
        from: 'us' | 'them';
        content: string;
        timestamp?: string;
      }>;
    };
    lead: NormalizedLead;
  }): Promise<ReplyClassification> {
    logger.info('Classifying reply', { lead_id: params.lead.lead_id });

    // Try AI classification first
    try {
      return await this.classifyWithAI(params);
    } catch (error) {
      logger.warn('AI classification failed, using rule-based', { error });
      return this.classifyWithRules(params);
    }
  }

  /**
   * Draft a reply based on classification
   */
  async draftReply(params: {
    classification: ReplyClassification;
    lead: NormalizedLead;
    strategy: any;
    constraints: {
      max_chars: number;
    };
  }): Promise<ReplyDraft> {
    logger.info('Drafting reply', { lead_id: params.lead.lead_id });

    const prompt = this.buildReplyPrompt(params);

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
        throw new Error('Unexpected response type');
      }

      const draft = JSON.parse(content.text) as ReplyDraft;

      logger.info('Reply draft created', {
        lead_id: params.lead.lead_id,
        risk_flags: draft.risk_flags.length,
      });

      return draft;
    } catch (error) {
      logger.error('Reply drafting failed', { error });
      throw error;
    }
  }

  /**
   * Classify using Claude
   */
  private async classifyWithAI(params: {
    thread: { messages: any[] };
    lead: NormalizedLead;
  }): Promise<ReplyClassification> {
    const threadText = params.thread.messages
      .map((msg) => `[${msg.from.toUpperCase()}]: ${msg.content}`)
      .join('\n\n');

    const prompt = `
You are classifying a reply in a B2B outreach thread.

LEAD:
- Name: ${params.lead.firstName} ${params.lead.lastName}
- Title: ${params.lead.title}
- Company: ${params.lead.company}

THREAD:
${threadText}

Classify their most recent reply. Return ONLY valid JSON:

{
  "intent": "interested|timing|question|objection|not_interested|unsubscribe",
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0,
  "recommended_next_step": "book_call|answer_question|nurture|close_lost|handoff",
  "reasoning": "Brief explanation of your classification",
  "extracted_context": {
    "timing_mentioned": "if they mentioned timing",
    "specific_objection": "if they raised objection",
    "question_asked": "if they asked a question"
  }
}

CLASSIFICATION GUIDE:
- "interested": Positive response, wants to learn more/meet
- "timing": Not now, but possibly later
- "question": Asking for info/clarification
- "objection": Raised concern/pushback
- "not_interested": Clear rejection
- "unsubscribe": Wants to stop contact

NEXT STEP GUIDE:
- "book_call": They're ready, send calendar link
- "answer_question": They need info first
- "nurture": Add to long-term follow-up
- "close_lost": Mark as lost
- "handoff": Complex, needs human touch

Output JSON only.
`.trim();

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content.text) as ReplyClassification;
  }

  /**
   * Fallback rule-based classification
   */
  private classifyWithRules(params: {
    thread: { messages: any[] };
    lead: NormalizedLead;
  }): ReplyClassification {
    const lastReply = params.thread.messages[params.thread.messages.length - 1];
    const text = lastReply.content.toLowerCase();

    // Unsubscribe patterns
    if (
      text.includes('unsubscribe') ||
      text.includes('stop') ||
      text.includes('remove me')
    ) {
      return {
        intent: 'unsubscribe',
        sentiment: 'negative',
        confidence: 0.95,
        recommended_next_step: 'close_lost',
        reasoning: 'Explicit unsubscribe request',
      };
    }

    // Not interested patterns
    if (
      text.includes('not interested') ||
      text.includes('no thanks') ||
      text.includes("don't") ||
      text.includes('never')
    ) {
      return {
        intent: 'not_interested',
        sentiment: 'negative',
        confidence: 0.85,
        recommended_next_step: 'close_lost',
        reasoning: 'Clear rejection',
      };
    }

    // Interested patterns
    if (
      text.includes('interested') ||
      text.includes('let\'s') ||
      text.includes('when can') ||
      text.includes('calendar') ||
      text.includes('schedule')
    ) {
      return {
        intent: 'interested',
        sentiment: 'positive',
        confidence: 0.8,
        recommended_next_step: 'book_call',
        reasoning: 'Positive engagement signals',
      };
    }

    // Timing patterns
    if (
      text.includes('not right now') ||
      text.includes('later') ||
      text.includes('next quarter') ||
      text.includes('next year') ||
      text.includes('future')
    ) {
      return {
        intent: 'timing',
        sentiment: 'neutral',
        confidence: 0.75,
        recommended_next_step: 'nurture',
        reasoning: 'Timing not right',
        extracted_context: {
          timing_mentioned: 'Mentioned future interest',
        },
      };
    }

    // Question patterns
    if (
      text.includes('?') ||
      text.includes('how') ||
      text.includes('what') ||
      text.includes('can you')
    ) {
      return {
        intent: 'question',
        sentiment: 'neutral',
        confidence: 0.7,
        recommended_next_step: 'answer_question',
        reasoning: 'Asked for information',
        extracted_context: {
          question_asked: text.substring(0, 100),
        },
      };
    }

    // Default: objection
    return {
      intent: 'objection',
      sentiment: 'neutral',
      confidence: 0.5,
      recommended_next_step: 'handoff',
      reasoning: 'Unclear response, needs human review',
    };
  }

  /**
   * Build reply draft prompt
   */
  private buildReplyPrompt(params: {
    classification: ReplyClassification;
    lead: NormalizedLead;
    strategy: any;
    constraints: { max_chars: number };
  }): string {
    const { classification, lead, constraints } = params;

    return `
You are drafting a human-sent reply to a B2B prospect.

LEAD:
- Name: ${lead.firstName}
- Title: ${lead.title}
- Company: ${lead.company}

THEIR REPLY CLASSIFICATION:
- Intent: ${classification.intent}
- Sentiment: ${classification.sentiment}
- Context: ${JSON.stringify(classification.extracted_context || {})}

YOUR TASK:
Draft a reply that ${this.getReplyGuidance(classification.intent)}.

Return ONLY valid JSON:
{
  "draft": "The main draft reply (under ${constraints.max_chars} chars)",
  "options": ["Alternative 1", "Alternative 2"],
  "risk_flags": ["Any red flags in the draft"],
  "tone": "Description of tone used"
}

RULES:
- Keep it conversational and human
- Match their energy level
- Don't be pushy if they're hesitant
- Provide value, don't just ask
- Under ${constraints.max_chars} characters
- Output JSON only
`.trim();
  }

  /**
   * Get reply guidance based on intent
   */
  private getReplyGuidance(
    intent: ReplyClassification['intent']
  ): string {
    switch (intent) {
      case 'interested':
        return 'confirms next steps and sends calendar link';
      case 'timing':
        return 'acknowledges timing and sets a specific follow-up';
      case 'question':
        return 'directly answers their question with helpful context';
      case 'objection':
        return 'addresses the concern without being defensive';
      case 'not_interested':
        return 'politely acknowledges and leaves the door open';
      case 'unsubscribe':
        return 'confirms removal and apologizes for the inconvenience';
    }
  }
}
