/**
 * Research Service
 * Handles research data storage and retrieval
 */

import { IStorageService } from './StorageFactory';
import { ResearchSnapshot, ResearchResult, ResearchInput, EnrichmentStatus } from '../types/research';
import observability, { LogLevel, LogCategory } from './ObservabilityService';

export class ResearchService {
  constructor(private storage: IStorageService) {}

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
   * Trigger research for a lead (placeholder for Perplexity integration)
   * Currently returns mock data - replace with actual Perplexity API call
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

      observability.log(
        LogLevel.INFO,
        LogCategory.API,
        `Triggering research for lead ${input.leadId}`,
        { leadId: input.leadId, linkedinUrl: input.linkedinUrl }
      );

      // TODO: Replace with actual Perplexity API integration
      // For now, create a placeholder snapshot using available lead data
      const snapshot: ResearchSnapshot = {
        firstName: lead.name?.split(' ')[0],
        company: lead.company,
        title: lead.title,
        researchedAt: new Date(),
        source: 'manual',
        confidence: 0.5 // Low confidence for placeholder data
      };

      // Save the research
      const result = await this.saveResearch(input.leadId, snapshot);

      return {
        ...result,
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
