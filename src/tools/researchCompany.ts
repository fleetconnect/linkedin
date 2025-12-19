import { PerplexityService } from '../services/PerplexityService';
import { StorageService } from '../services/StorageService';
import {
  Lead,
  ResearchSnapshot,
  ResearchRequest,
  ResearchResult,
  LeadState
} from '../types';

/**
 * Research Company Tool
 *
 * Performs company research using Perplexity AI and persists results to lead.research_snapshot
 *
 * Runs only if:
 * - lead.state === QUALIFIED
 * - campaign.messaging_rules.personalization === true
 */
export class ResearchCompanyTool {
  private perplexityService: PerplexityService;
  private storageService: StorageService;

  constructor(perplexityService: PerplexityService, storageService: StorageService) {
    this.perplexityService = perplexityService;
    this.storageService = storageService;
  }

  /**
   * Execute company research for a lead
   */
  async execute(request: ResearchRequest): Promise<ResearchResult> {
    const { leadId, companyName, additionalContext } = request;

    try {
      // Get the lead
      const lead = await this.storageService.getLead(leadId);
      if (!lead) {
        return {
          success: false,
          error: `Lead not found: ${leadId}`,
          snapshot: this.createEmptySnapshot()
        };
      }

      // Perform research
      console.log(`🔍 Researching company: ${companyName} for lead ${lead.name}`);

      const snapshot = await this.perplexityService.researchCompany(
        companyName,
        additionalContext
      );

      // Persist research snapshot to lead
      await this.storageService.saveResearchSnapshot(leadId, snapshot);

      console.log(`✅ Research completed and saved for ${companyName}`);
      console.log(`   - Industry: ${snapshot.industry}`);
      console.log(`   - Recent news items: ${snapshot.recentNews?.length || 0}`);
      console.log(`   - Challenges identified: ${snapshot.challenges?.length || 0}`);

      return {
        success: true,
        snapshot
      };

    } catch (error) {
      console.error('Research failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        snapshot: this.createEmptySnapshot()
      };
    }
  }

  /**
   * Check if research should run for a lead
   *
   * ARCHITECTURAL RULE: This logic is tier-agnostic. Research runs for ALL
   * QUALIFIED leads with personalization enabled, regardless of license tier.
   *
   * Perplexity research is baseline message quality infrastructure, not a premium feature.
   * See docs/research-architecture.md for canonical design.
   *
   * DO NOT add tier-based conditionals here.
   */
  shouldRunResearch(lead: Lead, personalizationEnabled: boolean): boolean {
    // Check if lead is in QUALIFIED state
    if (lead.state !== LeadState.QUALIFIED) {
      return false;
    }

    // Check if personalization is enabled
    if (!personalizationEnabled) {
      return false;
    }

    // Check if research already exists and is recent (within 7 days)
    if (lead.research_snapshot) {
      const researchAge = Date.now() - new Date(lead.research_snapshot.researched_at).getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      if (researchAge < sevenDaysInMs) {
        console.log(`ℹ️  Research already exists and is recent (${Math.floor(researchAge / (24 * 60 * 60 * 1000))} days old)`);
        return false;
      }
    }

    return true;
  }

  /**
   * Extract company name from lead data
   */
  extractCompanyName(lead: Lead): string | null {
    // Try lead.company field first
    if (lead.company) {
      return lead.company;
    }

    // Try to extract from LinkedIn URL
    if (lead.linkedinUrl) {
      const match = lead.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        // Convert slug to readable name (basic conversion)
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    return null;
  }

  /**
   * Get research snapshot for a lead
   */
  async getResearchSnapshot(leadId: string): Promise<ResearchSnapshot | null> {
    const lead = await this.storageService.getLead(leadId);
    return lead?.research_snapshot || null;
  }

  /**
   * Create empty research snapshot
   */
  private createEmptySnapshot(): ResearchSnapshot {
    return {
      companyName: '',
      companyDescription: '',
      industry: '',
      recentNews: [],
      keyProducts: [],
      challenges: [],
      opportunities: [],
      fundingInfo: '',
      employeeCount: '',
      researched_at: new Date(),
      sources: []
    };
  }

  /**
   * Format research snapshot for message generation
   */
  formatSnapshotForPrompt(snapshot: ResearchSnapshot): string {
    let formatted = `## Company Research: ${snapshot.companyName}\n\n`;

    if (snapshot.companyDescription) {
      formatted += `**About:** ${snapshot.companyDescription}\n\n`;
    }

    if (snapshot.industry) {
      formatted += `**Industry:** ${snapshot.industry}\n\n`;
    }

    if (snapshot.recentNews && snapshot.recentNews.length > 0) {
      formatted += `**Recent News:**\n`;
      snapshot.recentNews.forEach(news => {
        formatted += `- ${news}\n`;
      });
      formatted += `\n`;
    }

    if (snapshot.challenges && snapshot.challenges.length > 0) {
      formatted += `**Potential Challenges:**\n`;
      snapshot.challenges.forEach(challenge => {
        formatted += `- ${challenge}\n`;
      });
      formatted += `\n`;
    }

    if (snapshot.opportunities && snapshot.opportunities.length > 0) {
      formatted += `**Growth Opportunities:**\n`;
      snapshot.opportunities.forEach(opp => {
        formatted += `- ${opp}\n`;
      });
      formatted += `\n`;
    }

    if (snapshot.keyProducts && snapshot.keyProducts.length > 0) {
      formatted += `**Key Products/Services:** ${snapshot.keyProducts.join(', ')}\n\n`;
    }

    if (snapshot.fundingInfo) {
      formatted += `**Funding:** ${snapshot.fundingInfo}\n\n`;
    }

    if (snapshot.employeeCount) {
      formatted += `**Company Size:** ${snapshot.employeeCount} employees\n\n`;
    }

    return formatted;
  }
}

export default ResearchCompanyTool;
