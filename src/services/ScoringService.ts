/**
 * Scoring Service
 * Calculates and manages lead scores based on multiple factors
 */

import { IStorageService } from './StorageFactory';
import { ResearchService } from './ResearchService';
import {
  LeadScore,
  ScoreComponents,
  ScoreCalculationInput,
  ScoreResult,
  BatchScoreQuery,
  BatchScoreResult,
  SCORING_VERSION,
  SCORE_TIERS,
  SCORE_WEIGHTS
} from '../types/scoring';
import { Lead, LeadState } from '../types';
import observability, { LogLevel, LogCategory } from './ObservabilityService';

export class ScoringService {
  constructor(
    private storage: IStorageService,
    private researchService: ResearchService
  ) {}

  /**
   * Calculate or retrieve lead score
   */
  async getLeadScore(input: ScoreCalculationInput): Promise<ScoreResult> {
    try {
      const lead = await this.storage.getLead(input.leadId);
      if (!lead) {
        return {
          success: false,
          leadId: input.leadId,
          error: `Lead not found: ${input.leadId}`
        };
      }

      // Check if we have a recent score and don't need to recalculate
      if (!input.forceRecalculate && lead.score) {
        const scoreAge = Date.now() - new Date(lead.score.lastUpdated).getTime();
        const hoursSinceScore = scoreAge / (1000 * 60 * 60);

        // Use cached score if less than 24 hours old
        if (hoursSinceScore < 24) {
          return {
            success: true,
            leadId: input.leadId,
            score: lead.score
          };
        }
      }

      // Calculate new score
      const score = await this.calculateScore(lead);

      // Store score on lead
      lead.score = score;
      await this.storage.saveLead(lead, { skipStateValidation: true });

      observability.log(
        LogLevel.INFO,
        LogCategory.API,
        `Lead score calculated for ${input.leadId}`,
        { leadId: input.leadId, overallScore: score.overallScore, tier: score.tier }
      );

      return {
        success: true,
        leadId: input.leadId,
        score
      };
    } catch (error) {
      observability.log(
        LogLevel.ERROR,
        LogCategory.API,
        `Failed to calculate score for lead ${input.leadId}`,
        { leadId: input.leadId, error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        leadId: input.leadId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get scores for multiple leads with filtering
   */
  async getBatchScores(query: BatchScoreQuery): Promise<BatchScoreResult> {
    try {
      let leads = await this.storage.getLeads();

      // Filter by state if specified
      if (query.state) {
        leads = leads.filter((lead: Lead) => lead.state === query.state);
      }

      // Calculate scores for leads that don't have them
      const scoredLeads = await Promise.all(
        leads.map(async (lead: Lead) => {
          if (!lead.score) {
            const scoreResult = await this.getLeadScore({ leadId: lead.id });
            if (scoreResult.success && scoreResult.score) {
              lead.score = scoreResult.score;
            }
          }
          return lead;
        })
      );

      // Extract scores
      let scores: LeadScore[] = scoredLeads
        .filter((lead: Lead) => lead.score !== undefined)
        .map((lead: Lead) => lead.score!);

      // Filter by minimum score
      if (query.minScore !== undefined) {
        scores = scores.filter((score: LeadScore) => score.overallScore >= query.minScore!);
      }

      // Filter by tier
      if (query.tier) {
        scores = scores.filter((score: LeadScore) => score.tier === query.tier);
      }

      // Sort
      const sortBy = query.sortBy || 'overallScore';
      const sortOrder = query.sortOrder || 'desc';
      scores.sort((a: LeadScore, b: LeadScore) => {
        let aVal: number | Date;
        let bVal: number | Date;

        if (sortBy === 'overallScore') {
          aVal = a.overallScore;
          bVal = b.overallScore;
        } else if (sortBy === 'icpFit') {
          aVal = a.components.icpFit;
          bVal = b.components.icpFit;
        } else if (sortBy === 'engagementLevel') {
          aVal = a.components.engagementLevel;
          bVal = b.components.engagementLevel;
        } else { // scoredAt
          aVal = new Date(a.scoredAt);
          bVal = new Date(b.scoredAt);
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = scores.length;

      // Paginate
      const offset = query.offset || 0;
      const limit = query.limit || 100;
      scores = scores.slice(offset, offset + limit);

      return {
        success: true,
        scores,
        total
      };
    } catch (error) {
      observability.log(
        LogLevel.ERROR,
        LogCategory.API,
        'Failed to get batch scores',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        success: false,
        scores: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate score for a lead
   */
  private async calculateScore(lead: Lead): Promise<LeadScore> {
    const components: ScoreComponents = {
      icpFit: this.calculateICPFit(lead),
      researchQuality: await this.calculateResearchQuality(lead),
      engagementLevel: this.calculateEngagementLevel(lead),
      conversionProbability: this.calculateConversionProbability(lead)
    };

    // Calculate weighted overall score
    const overallScore = Math.round(
      components.icpFit * SCORE_WEIGHTS.icpFit +
      components.researchQuality * SCORE_WEIGHTS.researchQuality +
      components.engagementLevel * SCORE_WEIGHTS.engagementLevel +
      components.conversionProbability * SCORE_WEIGHTS.conversionProbability
    );

    // Determine tier
    const tier = this.calculateTier(overallScore);

    // Generate factors and recommendations
    const factors = this.identifyFactors(components, lead);
    const recommendations = this.generateRecommendations(components, tier, lead);

    return {
      leadId: lead.id,
      overallScore,
      components,
      tier,
      scoredAt: lead.score?.scoredAt || new Date(),
      lastUpdated: new Date(),
      version: SCORING_VERSION,
      factors,
      recommendations
    };
  }

  /**
   * Calculate ICP Fit Score (0-100)
   * Based on: company presence, title relevance, industry match
   */
  private calculateICPFit(lead: Lead): number {
    let score = 0;

    // Company presence (30 points)
    if (lead.company) {
      score += 30;
      // Bonus for recognized company size indicators
      if (lead.company.toLowerCase().includes('inc') ||
          lead.company.toLowerCase().includes('llc') ||
          lead.company.toLowerCase().includes('corp')) {
        score += 10;
      }
    }

    // Title relevance (40 points)
    if (lead.title) {
      score += 20;

      // High-value titles
      const seniorTitles = ['ceo', 'founder', 'president', 'vp', 'director', 'head of', 'chief'];
      const hasSeniorTitle = seniorTitles.some(t => lead.title!.toLowerCase().includes(t));
      if (hasSeniorTitle) {
        score += 20;
      }

      // Medium-value titles
      const midTitles = ['manager', 'lead', 'senior'];
      const hasMidTitle = midTitles.some(t => lead.title!.toLowerCase().includes(t));
      if (hasMidTitle && !hasSeniorTitle) {
        score += 10;
      }
    }

    // LinkedIn profile presence (30 points)
    if (lead.linkedinUrl) {
      score += 30;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate Research Quality Score (0-100)
   * Based on research tier and data freshness
   */
  private async calculateResearchQuality(lead: Lead): Promise<number> {
    if (!lead.researchSnapshot) {
      return 0;
    }

    const enrichmentStatus = await this.researchService.getEnrichmentStatus(lead.id);

    // Base score from tier
    let score = 0;
    if (enrichmentStatus.researchQuality === 'tier3') {
      score = 90;
    } else if (enrichmentStatus.researchQuality === 'tier2') {
      score = 60;
    } else if (enrichmentStatus.researchQuality === 'tier1') {
      score = 30;
    }

    // Penalize stale data
    if (enrichmentStatus.needsUpdate) {
      score = Math.max(0, score - 20);
    }

    // Bonus for high confidence
    if (lead.researchSnapshot.confidence && lead.researchSnapshot.confidence >= 0.8) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate Engagement Level Score (0-100)
   * Based on conversation history and reply rate
   */
  private calculateEngagementLevel(lead: Lead): number {
    if (!lead.conversationHistory || lead.conversationHistory.length === 0) {
      return 0;
    }

    let score = 0;

    // Count messages by sender
    const userMessages = lead.conversationHistory.filter((m: any) => m.sender === 'user').length;
    const leadMessages = lead.conversationHistory.filter((m: any) => m.sender === 'lead').length;

    // Reply rate (50 points)
    if (userMessages > 0) {
      const replyRate = leadMessages / userMessages;
      score += Math.min(50, replyRate * 50);
    }

    // Conversation depth (30 points)
    const totalMessages = lead.conversationHistory.length;
    if (totalMessages >= 6) {
      score += 30;
    } else if (totalMessages >= 4) {
      score += 20;
    } else if (totalMessages >= 2) {
      score += 10;
    }

    // Recent activity (20 points)
    if (lead.conversationHistory.length > 0) {
      const lastMessage = lead.conversationHistory[lead.conversationHistory.length - 1];
      const lastMessageTime = new Date(lastMessage.timestamp);
      const hoursSinceLastMessage = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastMessage < 24) {
        score += 20;
      } else if (hoursSinceLastMessage < 72) {
        score += 10;
      } else if (hoursSinceLastMessage < 168) {
        score += 5;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate Conversion Probability Score (0-100)
   * Based on lead state progression and positive signals
   */
  private calculateConversionProbability(lead: Lead): number {
    let score = 0;

    // State-based scoring (60 points)
    switch (lead.state) {
      case LeadState.BOOKED:
        score += 100; // Already converted
        break;
      case LeadState.INTERESTED:
        score += 70;
        break;
      case LeadState.REPLIED:
        score += 50;
        break;
      case LeadState.CONTACTED:
        score += 30;
        break;
      case LeadState.QUALIFIED:
      case LeadState.READY_TO_SEND:
        score += 20;
        break;
      case LeadState.NEW:
        score += 10;
        break;
      case LeadState.LOST:
      case LeadState.CLOSED:
        score = 0; // No conversion probability
        break;
    }

    // Positive reply signals (20 points)
    if (lead.conversationHistory && lead.conversationHistory.length > 0) {
      const leadReplies = lead.conversationHistory.filter((m: any) => m.sender === 'lead');
      const positiveKeywords = ['yes', 'interested', 'sounds good', 'tell me more', 'when', 'available'];

      const hasPositiveSignal = leadReplies.some((reply: any) =>
        positiveKeywords.some(keyword => reply.content.toLowerCase().includes(keyword))
      );

      if (hasPositiveSignal) {
        score += 20;
      }
    }

    // Multi-touch engagement (20 points)
    if (lead.conversationHistory) {
      const leadMessages = lead.conversationHistory.filter((m: any) => m.sender === 'lead').length;
      if (leadMessages >= 3) {
        score += 20;
      } else if (leadMessages >= 2) {
        score += 10;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Determine score tier from overall score
   */
  private calculateTier(overallScore: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (overallScore >= SCORE_TIERS.A.min) return 'A';
    if (overallScore >= SCORE_TIERS.B.min) return 'B';
    if (overallScore >= SCORE_TIERS.C.min) return 'C';
    if (overallScore >= SCORE_TIERS.D.min) return 'D';
    return 'F';
  }

  /**
   * Identify key factors contributing to score
   */
  private identifyFactors(components: ScoreComponents, lead: Lead): string[] {
    const factors: string[] = [];

    // ICP Fit factors
    if (components.icpFit >= 70) {
      factors.push('Strong ICP match');
    } else if (components.icpFit < 40) {
      factors.push('Weak ICP fit');
    }

    if (lead.title) {
      const seniorTitles = ['ceo', 'founder', 'president', 'vp', 'director'];
      const hasSeniorTitle = seniorTitles.some(t => lead.title!.toLowerCase().includes(t));
      if (hasSeniorTitle) {
        factors.push('Senior decision-maker title');
      }
    }

    // Research quality factors
    if (components.researchQuality >= 80) {
      factors.push('Tier 3 research data available');
    } else if (components.researchQuality < 30) {
      factors.push('Limited research data');
    }

    // Engagement factors
    if (components.engagementLevel >= 60) {
      factors.push('High engagement level');
    } else if (components.engagementLevel === 0) {
      factors.push('No conversation history');
    }

    const leadMessages = lead.conversationHistory?.filter((m: any) => m.sender === 'lead').length || 0;
    if (leadMessages >= 2) {
      factors.push('Multiple prospect replies');
    }

    // Conversion probability factors
    if (components.conversionProbability >= 70) {
      factors.push('High conversion probability');
    }

    if (lead.state === LeadState.INTERESTED) {
      factors.push('Expressed interest');
    } else if (lead.state === LeadState.BOOKED) {
      factors.push('Meeting booked');
    }

    return factors;
  }

  /**
   * Generate actionable recommendations based on score
   */
  private generateRecommendations(
    components: ScoreComponents,
    tier: string,
    lead: Lead
  ): string[] {
    const recommendations: string[] = [];

    // Tier-based general recommendations
    if (tier === 'A' || tier === 'B') {
      recommendations.push('High-priority lead - prioritize outreach');
    } else if (tier === 'F') {
      recommendations.push('Low-priority lead - consider deprioritizing');
    }

    // ICP fit recommendations
    if (components.icpFit < 50 && !lead.company) {
      recommendations.push('Add company information to improve ICP fit');
    }

    if (components.icpFit < 50 && !lead.linkedinUrl) {
      recommendations.push('Add LinkedIn profile for better qualification');
    }

    // Research quality recommendations
    if (components.researchQuality < 40) {
      recommendations.push('Trigger research to improve personalization');
    } else if (components.researchQuality >= 40 && lead.researchSnapshot) {
      const age = lead.researchSnapshot.researchedAt
        ? Date.now() - new Date(lead.researchSnapshot.researchedAt).getTime()
        : 0;
      const daysSinceResearch = age / (1000 * 60 * 60 * 24);

      if (daysSinceResearch > 30) {
        recommendations.push('Research data is stale - consider refreshing');
      }
    }

    // Engagement recommendations
    if (components.engagementLevel === 0 && lead.state === LeadState.NEW) {
      recommendations.push('Ready for initial outreach');
    }

    if (components.engagementLevel < 30 && lead.conversationHistory && lead.conversationHistory.length > 0) {
      const lastMessage = lead.conversationHistory[lead.conversationHistory.length - 1];
      if (lastMessage.sender === 'user') {
        const hoursSinceLastMessage = (Date.now() - new Date(lastMessage.timestamp).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMessage > 72) {
          recommendations.push('No reply in 72+ hours - consider different approach');
        }
      }
    }

    if (components.engagementLevel >= 50 && lead.state === LeadState.REPLIED) {
      recommendations.push('Strong engagement - move to conversion');
    }

    // Conversion probability recommendations
    if (components.conversionProbability >= 60 && lead.state !== LeadState.BOOKED) {
      recommendations.push('High conversion probability - send meeting request');
    }

    if (components.conversionProbability < 30 && lead.state === LeadState.CONTACTED) {
      const daysSinceContact = lead.updatedAt
        ? (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      if (daysSinceContact > 7) {
        recommendations.push('No response after 7+ days - consider re-engagement or deprioritize');
      }
    }

    return recommendations;
  }
}
