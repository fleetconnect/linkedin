import OpenAI from 'openai';
import { perplexityConfig } from '../config/perplexity.config';
import { ResearchSnapshot } from '../types';
import { retryWithBackoff } from '../utils/retry';

/**
 * Perplexity API Service for company research
 * Uses Perplexity's online AI models for up-to-date company information
 *
 * ARCHITECTURAL RULE: This service is tier-agnostic.
 * All tiers use the same model, same depth, same quality.
 *
 * Perplexity research is baseline message quality infrastructure, not a premium feature.
 * See docs/research-architecture.md for canonical design.
 *
 * DO NOT add tier-based parameters, model selection, or depth gating.
 */
export class PerplexityService {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || perplexityConfig.apiKey,
      baseURL: perplexityConfig.baseURL
    });
  }

  /**
   * Research a company using Perplexity's online models
   * Includes retry logic for transient failures
   */
  async researchCompany(
    companyName: string,
    additionalContext?: string
  ): Promise<ResearchSnapshot> {
    const prompt = this.buildResearchPrompt(companyName, additionalContext);

    // Wrap Perplexity call in retry logic
    const retryResult = await retryWithBackoff(
      async () => {
        const completion = await this.client.chat.completions.create({
          model: perplexityConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are a business research assistant. Provide accurate, up-to-date information about companies in a structured JSON format. Focus on actionable insights for sales and outreach.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No response from Perplexity');
        }

        // Parse the response
        const researchData = this.parseResearchResponse(content, companyName);

        return {
          ...researchData,
          researched_at: new Date()
        };
      },
      {
        maxAttempts: 3,
        initialDelayMs: 2000, // Longer initial delay for research
        maxDelayMs: 10000,
        onRetry: (attempt, error) => {
          console.warn(`🔄 Research retry ${attempt}/3 for ${companyName}: ${error.message}`);
        }
      }
    );

    if (retryResult.success && retryResult.result) {
      return retryResult.result;
    } else {
      throw new Error(
        `Perplexity research failed after ${retryResult.attempts} attempts: ${retryResult.error?.message}`
      );
    }
  }

  /**
   * Build a comprehensive research prompt
   */
  private buildResearchPrompt(companyName: string, additionalContext?: string): string {
    let prompt = `Research the company "${companyName}" and provide the following information in JSON format:

{
  "companyName": "Official company name",
  "companyDescription": "Brief 2-3 sentence description of what the company does",
  "industry": "Primary industry/sector",
  "recentNews": ["List of 2-3 recent news items or developments"],
  "keyProducts": ["List of main products or services"],
  "challenges": ["2-3 potential challenges the company might be facing"],
  "opportunities": ["2-3 opportunities or growth areas"],
  "fundingInfo": "Recent funding information if available",
  "employeeCount": "Approximate number of employees or size category",
  "sources": ["URLs of sources used"]
}

Focus on:
- Recent developments (last 6-12 months)
- Business challenges that our solution could address
- Growth indicators and expansion plans
- Technology stack and digital presence
- Leadership changes or strategic initiatives`;

    if (additionalContext) {
      prompt += `\n\nAdditional context: ${additionalContext}`;
    }

    prompt += `\n\nProvide ONLY the JSON object, no additional text.`;

    return prompt;
  }

  /**
   * Parse and validate research response
   */
  private parseResearchResponse(content: string, companyName: string): Omit<ResearchSnapshot, 'researched_at'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        companyName: parsed.companyName || companyName,
        companyDescription: parsed.companyDescription || '',
        industry: parsed.industry || '',
        recentNews: Array.isArray(parsed.recentNews) ? parsed.recentNews : [],
        keyProducts: Array.isArray(parsed.keyProducts) ? parsed.keyProducts : [],
        challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
        fundingInfo: parsed.fundingInfo || '',
        employeeCount: parsed.employeeCount || '',
        sources: Array.isArray(parsed.sources) ? parsed.sources : []
      };

    } catch (error) {
      // If JSON parsing fails, create a basic snapshot from the text
      console.warn('Failed to parse JSON, creating basic snapshot:', error);

      return {
        companyName,
        companyDescription: content.substring(0, 500),
        industry: '',
        recentNews: [],
        keyProducts: [],
        challenges: [],
        opportunities: [],
        fundingInfo: '',
        employeeCount: '',
        sources: []
      };
    }
  }

  /**
   * Validate API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: perplexityConfig.model,
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      });
      return !!response.choices[0]?.message;
    } catch (error) {
      console.error('Perplexity connection test failed:', error);
      return false;
    }
  }

  /**
   * Batch research multiple companies
   */
  async researchBatch(companies: string[]): Promise<Map<string, ResearchSnapshot>> {
    const results = new Map<string, ResearchSnapshot>();

    for (const company of companies) {
      try {
        const snapshot = await this.researchCompany(company);
        results.set(company, snapshot);

        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to research ${company}:`, error);
      }
    }

    return results;
  }
}

export default PerplexityService;
