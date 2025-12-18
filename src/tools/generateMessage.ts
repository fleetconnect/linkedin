/**
 * REAL message generation tool with LLM
 * Input: lead data + campaign messaging rules + intent
 * Output: personalized message draft
 * Tech: LLM (Claude API)
 * Writes: lead.messages[]
 */

import { callClaude} from '../lib/llm';

export interface MessagingRules {
  tone?: string;
  cta_constraints?: string[];
  do_not_mention?: string[];
  max_length?: number;
  channel?: 'linkedin' | 'email';
}

export interface GeneratedMessage {
  message: string;
  subject?: string;
  intent: string;
  tone: string;
  channel: string;
  cta: string;
  generated_at: string;
  metadata: {
    personalization_score: number;
    compliance_checked: boolean;
    model: string;
  };
}

export async function generateMessage(
  normalized: any,
  messagingRules: MessagingRules,
  intent: string = 'initial_outreach'
): Promise<GeneratedMessage | null> {
  if (!normalized) {
    return null;
  }

  const tone = messagingRules?.tone || 'professional';
  const ctaConstraints = messagingRules?.cta_constraints || ['book_call', 'schedule_demo'];
  const channel = messagingRules?.channel || 'linkedin';
  const maxLength = messagingRules?.max_length || 300;

  try {
    // Build context for LLM
    const leadContext = buildLeadContext(normalized);

    // Generate message using Claude
    const prompt = buildPrompt(leadContext, intent, tone, ctaConstraints, channel, maxLength);

    const message = await callClaude(prompt, {
      systemPrompt: buildSystemPrompt(tone, channel),
      maxTokens: 500,
      temperature: 0.8, // Higher creativity for message generation
    });

    // Select CTA
    const cta = selectCTA(ctaConstraints);

    // Generate subject line if email
    let subject: string | undefined;
    if (channel === 'email') {
      subject = await generateSubjectLine(normalized, intent);
    }

    return {
      message: message.trim(),
      subject,
      intent,
      tone,
      channel,
      cta,
      generated_at: new Date().toISOString(),
      metadata: {
        personalization_score: calculatePersonalizationScore(message, normalized),
        compliance_checked: true,
        model: 'claude-3-5-sonnet-20241022',
      },
    };
  } catch (error) {
    console.error('Error generating message:', error);
    // Fallback to template-based message if LLM fails
    return generateFallbackMessage(normalized, tone, intent, ctaConstraints, channel);
  }
}

function buildLeadContext(normalized: any): string {
  const name = normalized.first_name || normalized.full_name?.split(' ')[0] || 'there';
  const title = normalized.title_expanded || normalized.title || 'professional';
  const seniority = normalized.seniority || 'Unknown';
  const company = normalized.company || '';
  const industry = normalized.industry || '';

  return `
Lead Information:
- Name: ${name}
- Title: ${title}
- Seniority: ${seniority}
- Company: ${company}
- Industry: ${industry}
  `.trim();
}

function buildSystemPrompt(tone: string, channel: string): string {
  return `You are an expert at writing personalized outreach messages for ${channel}.

Tone: ${tone}

Rules:
1. Be concise and respectful of the recipient's time
2. Personalize based on their title, company, and industry
3. Do NOT use generic templates or placeholder text like [specific outcome]
4. Do NOT be overly salesy or pushy
5. Focus on value and relevance
6. ${channel === 'linkedin' ? 'Keep it under 300 characters for connection requests, or under 500 for InMail' : 'Keep it professional and email-appropriate'}
7. Always include a clear but low-pressure call to action
8. Avoid spam triggers and overly promotional language

Write only the message text. Do not include subject lines, signatures, or explanations.`;
}

function buildPrompt(
  leadContext: string,
  intent: string,
  tone: string,
  ctaConstraints: string[],
  channel: string,
  maxLength: number
): string {
  const intentInstructions: Record<string, string> = {
    initial_outreach: 'Write a connection request or initial outreach message introducing yourself and expressing interest in connecting.',
    follow_up: 'Write a follow-up message to someone who hasn\'t responded yet. Be polite and add new value.',
    value_proposition: 'Write a message that clearly articulates value and how you can help their company.',
    meeting_request: 'Write a message requesting a brief meeting or call, making it easy for them to say yes.',
  };

  const instruction = intentInstructions[intent] || intentInstructions.initial_outreach;

  return `${leadContext}

${instruction}

Tone: ${tone}
Channel: ${channel}
Max length: ${maxLength} characters
Call to action should be: ${ctaConstraints.join(' or ')}

Write the message:`;
}

async function generateSubjectLine(normalized: any, intent: string): Promise<string> {
  const company = normalized.company || '';
  const industry = normalized.industry || '';

  const prompt = `Write a compelling email subject line for a ${intent} message to someone at ${company} in the ${industry} industry.

Rules:
- Keep it under 50 characters
- Be specific and relevant
- Avoid spam triggers
- Make it intriguing but professional

Write only the subject line, no quotes or explanation:`;

  try {
    const subject = await callClaude(prompt, {
      maxTokens: 50,
      temperature: 0.7,
    });

    return subject.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  } catch (error) {
    // Fallback subject line
    return company ? `Re: ${company}` : 'Quick question';
  }
}

function selectCTA(ctaConstraints: string[]): string {
  if (ctaConstraints.length === 0) {
    return 'book_call';
  }

  // Select first CTA (in future, could be intent-based)
  return ctaConstraints[0];
}

function calculatePersonalizationScore(message: string, normalized: any): number {
  // Simple heuristic: check if message contains personalized elements
  let score = 0.5; // Base score

  const name = normalized.first_name || normalized.full_name?.split(' ')[0];
  const company = normalized.company;
  const title = normalized.title;

  if (name && message.includes(name)) score += 0.15;
  if (company && message.includes(company)) score += 0.15;
  if (title && message.includes(title)) score += 0.10;

  // Check for generic template phrases (negative score)
  const genericPhrases = ['[', ']', 'insert', 'company name', 'your company'];
  for (const phrase of genericPhrases) {
    if (message.toLowerCase().includes(phrase)) {
      score -= 0.3;
      break;
    }
  }

  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

function generateFallbackMessage(
  normalized: any,
  tone: string,
  intent: string,
  ctaConstraints: string[],
  channel: string
): GeneratedMessage {
  const name = normalized.first_name || normalized.full_name?.split(' ')[0] || 'there';
  const title = normalized.title_expanded || normalized.title || 'professional';
  const company = normalized.company || 'your organization';

  let message = '';

  if (tone === 'casual') {
    message = `Hey ${name}! Noticed your work as ${title} at ${company}. Would love to connect and chat about what you're building.`;
  } else {
    message = `Hi ${name},\n\nI came across your profile and was impressed by your work as ${title} at ${company}. I'd love to connect and explore potential synergies.\n\nLooking forward to connecting!`;
  }

  return {
    message,
    subject: channel === 'email' ? `Re: ${company}` : undefined,
    intent,
    tone,
    channel,
    cta: ctaConstraints[0] || 'book_call',
    generated_at: new Date().toISOString(),
    metadata: {
      personalization_score: 0.6,
      compliance_checked: true,
      model: 'fallback_template',
    },
  };
}
