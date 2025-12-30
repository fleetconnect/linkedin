/**
 * Research Service
 * Handles research data storage and retrieval
 */

import { IStorageService } from './StorageFactory';
import { PerplexityService } from './PerplexityService';
import { ResearchSnapshot, ResearchResult, ResearchInput, EnrichmentStatus } from '../types/research';
import observability, { LogLevel, LogCategory } from './ObservabilityService';

export class ResearchService {
  private perplexityService: PerplexityService;

  constructor(private storage: IStorageService) {
    this.perplexityService = new PerplexityService();
  }

  /**
   * Store research snapshot for a lead
   */
  async saveResearch(leadId: string, snapshot: ResearchSnapshot): Promise<ResearchResult> {
    try {
      const lead = await this.storage.getLead(leadId);
      if (!lead) {
        return {
          success: false,
          leadId,
          error: `Lead not found: ${leadId}`
        };
      }

      // Add metadata
      const enrichedSnapshot: ResearchSnapshot = {
        ...snapshot,
        researchedAt: new Date(),
        source: snapshot.source || 'manual'
      };

      // Store in lead's researchSnapshot field
      lead.researchSnapshot = enrichedSnapshot;
      await this.storage.saveLead(lead, { skipStateValidation: true });

      observability.log(
        LogLevel.INFO,
        LogCategory.API,
        `Research saved for lead ${leadId}`,
        {
          leadId,
          source: enrichedSnapshot.source,
          quality: this.assessResearchQuality(enrichedSnapshot)
        }
      );

      return {
        success: true,
        leadId,
        snapshot: enrichedSnapshot
      };
    } catch (error) {
      observability.log(
        LogLevel.ERROR,
        LogCategory.API,
        `Failed to save research for lead ${leadId}`,
        { leadId, error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        leadId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get research snapshot for a lead
   */
  async getResearch(leadId: string): Promise<ResearchSnapshot | null> {
    try {
      const lead = await this.storage.getLead(leadId);
      if (!lead || !lead.researchSnapshot) {
        return null;
      }

      return lead.researchSnapshot;
    } catch (error) {
      observability.log(
        LogLevel.ERROR,
        LogCategory.API,
        `Failed to get research for lead ${leadId}`,
        { leadId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
      return null;
    }
  }

  /**
   * Get enrichment status for a lead
   */
  async getEnrichmentStatus(leadId: string): Promise<EnrichmentStatus> {
    try {
      const lead = await this.storage.getLead(leadId);
      if (!lead) {
        return {
          leadId,
          hasResearch: false
        };
      }

      if (!lead.researchSnapshot) {
        return {
          leadId,
          hasResearch: false,
          needsUpdate: true,
          updateReason: 'No research data available'
        };
      }

      const quality = this.assessResearchQuality(lead.researchSnapshot);
      const age = lead.researchSnapshot.researchedAt
        ? Date.now() - new Date(lead.researchSnapshot.researchedAt).getTime()
        : 0;
      const daysSinceResearch = age / (1000 * 60 * 60 * 24);

      return {
        leadId,
        hasResearch: true,
        researchQuality: quality,
        lastResearchedAt: lead.researchSnapshot.researchedAt,
        source: lead.researchSnapshot.source,
        needsUpdate: daysSinceResearch > 30, // Consider stale after 30 days
        updateReason: daysSinceResearch > 30 ? 'Research data is stale (>30 days old)' : undefined
      };
    } catch (error) {
      return {
        leadId,
        hasResearch: false,
        needsUpdate: true,
        updateReason: 'Error checking enrichment status'
      };
    }
  }

  /**
   * Trigger research for a lead using Perplexity
   * Performs company research and validates tier completeness
   */
  async triggerResearch(input: ResearchInput): Promise<ResearchResult> {
    const startTime = Date.now();

    try {
      const lead = await this.storage.getLead(input.leadId);
      if (!lead) {
        return {
          success: false,
          leadId: input.leadId,
          error: `Lead not found: ${input.leadId}`
        };
      }

      // Determine company name for research
      const companyName = lead.company || input.companyWebsite;
      if (!companyName) {
        return {
          success: false,
          leadId: input.leadId,
          error: 'Company name or website required for research'
        };
      }

      observability.log(
        LogLevel.INFO,
        LogCategory.API,
        `Triggering Perplexity research for lead ${input.leadId}`,
        { leadId: input.leadId, company: companyName }
      );

      // Call Perplexity to research the company
      const perplexityData = await this.perplexityService.researchCompany(
        companyName,
        input.additionalContext
      );

      // Build research snapshot by merging Perplexity data with lead data
      const snapshot: ResearchSnapshot = {
        // Tier 1 fields (basic)
        firstName: lead.name?.split(' ')[0],
        company: perplexityData.companyName || lead.company,
        title: lead.title,
        industryNiche: perplexityData.industry,

        // Tier 2 fields (from Perplexity)
        // Note: Perplexity doesn't provide these, but we structure for future enrichment
        yearsExperience: undefined,
        credentials: undefined,
        recentContentTopics: undefined,

        // Tier 3 fields (from Perplexity)
        companyDescription: perplexityData.companyDescription,
        companyPositioning: undefined, // Requires deeper analysis
        targetAudience: undefined,
        problemsTheySolve: perplexityData.keyProducts, // Proxy for problems
        recentNews: perplexityData.recentNews,
        challenges: perplexityData.challenges,
        opportunities: perplexityData.opportunities,

        // Metadata
        researchedAt: new Date(),
        source: 'perplexity',
        confidence: this.calculateResearchConfidence(perplexityData)
      };

      // Validate tier 1 completeness
      const tier1Validation = this.validateTier1Completeness(snapshot);

      if (!tier1Validation.complete) {
        observability.log(
          LogLevel.WARN,
          LogCategory.API,
          `Tier 1 research incomplete for lead ${input.leadId}`,
          {
            leadId: input.leadId,
            missingFields: tier1Validation.missingFields
          }
        );
      }

      // Save the research
      const saveResult = await this.saveResearch(input.leadId, snapshot);

      // Assess quality tier
      const qualityTier = this.assessResearchQuality(snapshot);

      observability.log(
        LogLevel.INFO,
        LogCategory.API,
        `Research completed for lead ${input.leadId}`,
        {
          leadId: input.leadId,
          tier: qualityTier,
          tier1Complete: tier1Validation.complete,
          confidence: snapshot.confidence,
          durationMs: Date.now() - startTime
        }
      );

      return {
        success: true,
        leadId: input.leadId,
        snapshot,
        tier1Complete: tier1Validation.complete,
        missingFields: tier1Validation.missingFields,
        researchQuality: qualityTier,
        durationMs: Date.now() - startTime
      };

    } catch (error) {
      observability.log(
        LogLevel.ERROR,
        LogCategory.API,
        `Research trigger failed for lead ${input.leadId}`,
        { leadId: input.leadId, error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        leadId: input.leadId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Validate Tier 1 completeness (required fields)
   */
  private validateTier1Completeness(snapshot: ResearchSnapshot): {
    complete: boolean;
    missingFields: string[];
  } {
    const requiredFields = ['firstName', 'company', 'title', 'industryNiche'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = (snapshot as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      }
    }

    return {
      complete: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Calculate research confidence based on data completeness
   */
  private calculateResearchConfidence(perplexityData: any): number {
    let score = 0;
    let maxScore = 0;

    // Check key fields
    const fields = [
      'companyName',
      'companyDescription',
      'industry',
      'recentNews',
      'keyProducts',
      'challenges',
      'opportunities'
    ];

    for (const field of fields) {
      maxScore++;
      const value = perplexityData[field];
      if (value && (typeof value !== 'string' || value.trim() !== '')) {
        if (Array.isArray(value)) {
          score += value.length > 0 ? 1 : 0;
        } else {
          score += 1;
        }
      }
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Assess quality tier of research data
   */
  private assessResearchQuality(snapshot: ResearchSnapshot): 'tier1' | 'tier2' | 'tier3' {
    let score = 0;

    // Tier 1 fields (basic)
    if (snapshot.firstName) score++;
    if (snapshot.company) score++;
    if (snapshot.title) score++;
    if (snapshot.industryNiche) score++;

    // Tier 2 fields (deeper)
    if (snapshot.yearsExperience) score += 2;
    if (snapshot.credentials && snapshot.credentials.length > 0) score += 2;
    if (snapshot.recentContentTopics && snapshot.recentContentTopics.length > 0) score += 2;

    // Tier 3 fields (deepest)
    if (snapshot.companyPositioning) score += 3;
    if (snapshot.problemsTheySolve && snapshot.problemsTheySolve.length > 0) score += 3;
    if (snapshot.recentNews && snapshot.recentNews.length > 0) score += 3;

    if (score >= 12) return 'tier3'; // Deep personalization
    if (score >= 6) return 'tier2';  // Moderate personalization
    return 'tier1';                  // Basic info only
  }
}
