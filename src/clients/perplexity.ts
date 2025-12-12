/**
 * Perplexity API Client
 * Real-time market intelligence for lead research
 */

import { logger } from '../utils/logger.js';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Query Perplexity API for market research
 */
export async function queryPerplexity(prompt: string): Promise<string> {
  if (!PERPLEXITY_API_KEY || PERPLEXITY_API_KEY === 'pxy_your_api_key_here') {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  logger.info('Querying Perplexity API', { prompt_length: prompt.length });

  try {
    const response = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content:
              'You are a market research assistant. Return only factual findings based on current, verifiable information. No opinions. No sales copy. Be specific and cite sources.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Lower temperature for more factual responses
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Perplexity API error', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as PerplexityResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Perplexity API');
    }

    const content = data.choices[0].message.content;

    logger.info('Perplexity query successful', {
      tokens_used: data.usage?.total_tokens,
      response_length: content.length,
    });

    return content;
  } catch (error) {
    logger.error('Failed to query Perplexity', { error });
    throw error;
  }
}

/**
 * Build research prompt for lead research
 */
export function buildResearchPrompt(input: {
  company_name: string;
  company_domain?: string;
  role?: string;
  industry?: string;
  region?: string;
}): string {
  return `
Research the following B2B company and role for sales intelligence purposes.
Return ONLY factual signals from the last 6 months. No opinions. No sales copy.

Company: ${input.company_name}
${input.company_domain ? `Domain: ${input.company_domain}` : ''}
${input.role ? `Target Role: ${input.role}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.region ? `Region: ${input.region}` : ''}

Find and organize your research into these exact categories:

**COMPANY SIGNALS:**
- Recent company activity (funding, hiring, product launches, expansion, GTM changes)
- Company growth indicators (headcount, revenue, market share)
- Strategic initiatives or announced priorities

**MARKET SIGNALS:**
- Industry trends affecting this company
- Competitive positioning and differentiators
- Market challenges or opportunities they face

**ROLE PAINS:**
- Likely challenges for this specific role at this company
- Common pain points for this role in this industry
- Responsibilities and priorities for this role

**BUYING TRIGGERS:**
- Timing signals related to growth, pipeline, or revenue needs
- Technology adoption or modernization indicators
- Budget cycle or fiscal year considerations
- Leadership changes or organizational shifts

Format your response using the exact headers above (in bold with **).
Include specific facts and sources where possible.
If information is not available for a category, state "No recent data available."
`.trim();
}
