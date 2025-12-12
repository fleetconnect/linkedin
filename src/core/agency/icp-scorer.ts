/**
 * ICP Scorer
 * Scores leads against client ICP criteria
 */

import { logger } from '../../utils/logger.js';
import type { NormalizedLead } from './lead-normalizer.js';
import type {
  ClientConfig,
  ClientICP,
  ClientScoringWeights,
} from '../../types/client-config.js';

export interface ICPScoreResult {
  lead_id: string;
  fit_score: number;
  icp_match: boolean;
  reasons: string[];
  disqualifiers: string[];
  recommended_action: 'keep' | 'review' | 'drop';
  breakdown: {
    firmographic_score: number;
    persona_score: number;
    timing_score: number;
    risk_score: number;
  };
}

export interface ScoredLeadsResult {
  scored: ICPScoreResult[];
  thresholds: {
    keep: number;
    review: number;
  };
  stats: {
    keep_count: number;
    review_count: number;
    drop_count: number;
  };
}

export class ICPScorer {
  /**
   * Score multiple leads against ICP
   */
  scoreLeads(
    leads: NormalizedLead[],
    config: ClientConfig
  ): ScoredLeadsResult {
    logger.info('Scoring leads against ICP', {
      lead_count: leads.length,
      client_id: config.client_id,
    });

    const scored = leads.map((lead) =>
      this.scoreSingleLead(lead, config.icp, config.scoring_weights)
    );

    // Apply thresholds
    const keepThreshold = config.thresholds.keep_above;
    const reviewThreshold = config.thresholds.review_range[0];

    scored.forEach((result) => {
      if (result.fit_score >= keepThreshold) {
        result.recommended_action = 'keep';
        result.icp_match = true;
      } else if (result.fit_score >= reviewThreshold) {
        result.recommended_action = 'review';
        result.icp_match = false;
      } else {
        result.recommended_action = 'drop';
        result.icp_match = false;
      }
    });

    const stats = {
      keep_count: scored.filter((s) => s.recommended_action === 'keep').length,
      review_count: scored.filter((s) => s.recommended_action === 'review')
        .length,
      drop_count: scored.filter((s) => s.recommended_action === 'drop').length,
    };

    logger.info('ICP scoring complete', stats);

    return {
      scored,
      thresholds: {
        keep: keepThreshold,
        review: reviewThreshold,
      },
      stats,
    };
  }

  /**
   * Score a single lead
   */
  private scoreSingleLead(
    lead: NormalizedLead,
    icp: ClientICP,
    weights: ClientScoringWeights
  ): ICPScoreResult {
    const reasons: string[] = [];
    const disqualifiers: string[] = [];

    // Firmographic scoring (0-100)
    const firmographic = this.scoreFirmographic(lead, icp, reasons, disqualifiers);

    // Persona scoring (0-100)
    const persona = this.scorePersona(lead, icp, reasons, disqualifiers);

    // Timing/signals scoring (0-100) - placeholder for now
    const timing = 50; // Would be enhanced with research data

    // Risk scoring (0-100, higher is lower risk)
    const risk = this.scoreRisk(lead, icp, reasons, disqualifiers);

    // Weighted total
    const fit_score = Math.round(
      firmographic * weights.firmographic +
        persona * weights.persona +
        timing * weights.timing +
        risk * weights.risk
    );

    return {
      lead_id: lead.lead_id,
      fit_score,
      icp_match: false, // Set by threshold logic
      reasons,
      disqualifiers,
      recommended_action: 'drop', // Set by threshold logic
      breakdown: {
        firmographic_score: firmographic,
        persona_score: persona,
        timing_score: timing,
        risk_score: risk,
      },
    };
  }

  /**
   * Score firmographic criteria
   */
  private scoreFirmographic(
    lead: NormalizedLead,
    icp: ClientICP,
    reasons: string[],
    disqualifiers: string[]
  ): number {
    let score = 50; // Base score

    // Company size check
    if (icp.company_size && lead.companySize) {
      if (icp.company_size.min && lead.companySize < icp.company_size.min) {
        disqualifiers.push(
          `Company too small: ${lead.companySize} < ${icp.company_size.min}`
        );
        score -= 30;
      } else if (
        icp.company_size.max &&
        lead.companySize > icp.company_size.max
      ) {
        disqualifiers.push(
          `Company too large: ${lead.companySize} > ${icp.company_size.max}`
        );
        score -= 30;
      } else {
        reasons.push(`Company size match: ${lead.companySize}`);
        score += 25;
      }
    }

    // Industry check
    if (icp.industries && icp.industries.length > 0 && lead.industry) {
      const industryMatch = icp.industries.some((ind) =>
        lead.industry.toLowerCase().includes(ind.toLowerCase())
      );
      if (industryMatch) {
        reasons.push(`Industry match: ${lead.industry}`);
        score += 15;
      } else {
        score -= 10;
      }
    }

    // Geography check
    if (icp.geographies && icp.geographies.length > 0 && lead.location) {
      const geoMatch = icp.geographies.some((geo) =>
        lead.location.toLowerCase().includes(geo.toLowerCase())
      );
      if (geoMatch) {
        reasons.push(`Geography match: ${lead.location}`);
        score += 10;
      } else {
        score -= 5;
      }
    }

    // Exclusion check
    if (icp.exclude_companies && icp.exclude_companies.length > 0) {
      const excluded = icp.exclude_companies.some(
        (company) =>
          lead.company.toLowerCase().includes(company.toLowerCase()) ||
          company.toLowerCase().includes(lead.company.toLowerCase())
      );
      if (excluded) {
        disqualifiers.push(`Excluded company: ${lead.company}`);
        return 0; // Hard fail
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score persona criteria
   */
  private scorePersona(
    lead: NormalizedLead,
    icp: ClientICP,
    reasons: string[],
    disqualifiers: string[]
  ): number {
    let score = 50; // Base score

    // Title check
    if (icp.titles && icp.titles.length > 0 && lead.title) {
      const titleMatch = icp.titles.some((title) =>
        lead.title.toLowerCase().includes(title.toLowerCase())
      );
      if (titleMatch) {
        reasons.push(`Title match: ${lead.title}`);
        score += 30;
      } else {
        score -= 15;
      }
    }

    // Seniority check
    if (icp.seniority_levels && icp.seniority_levels.length > 0 && lead.title) {
      const seniorityMatch = icp.seniority_levels.some((level) =>
        lead.title.toLowerCase().includes(level.toLowerCase())
      );
      if (seniorityMatch) {
        reasons.push(`Seniority match: contains ${icp.seniority_levels.join(' or ')}`);
        score += 15;
      }
    }

    // Department check
    if (icp.departments && icp.departments.length > 0 && lead.title) {
      const deptMatch = icp.departments.some((dept) =>
        lead.title.toLowerCase().includes(dept.toLowerCase())
      );
      if (deptMatch) {
        reasons.push(`Department match: ${icp.departments.join(' or ')}`);
        score += 5;
      }
    }

    // Title exclusions
    if (icp.exclude_titles && icp.exclude_titles.length > 0 && lead.title) {
      const excluded = icp.exclude_titles.some((title) =>
        lead.title.toLowerCase().includes(title.toLowerCase())
      );
      if (excluded) {
        disqualifiers.push(`Excluded title: ${lead.title}`);
        return 0; // Hard fail
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score risk factors
   */
  private scoreRisk(
    lead: NormalizedLead,
    icp: ClientICP,
    reasons: string[],
    disqualifiers: string[]
  ): number {
    let score = 100; // Start high, deduct for risks

    // Missing critical data
    if (!lead.email && !lead.linkedInUrl) {
      disqualifiers.push('No contact method available');
      score -= 50;
    }

    if (!lead.title || lead.title.length < 3) {
      score -= 20;
      reasons.push('Missing or incomplete title');
    }

    if (!lead.company || lead.company.length < 2) {
      score -= 30;
      disqualifiers.push('Missing or incomplete company name');
    }

    // Data quality signals
    if (lead.email && lead.email.includes('@gmail.com')) {
      score -= 10;
      reasons.push('Personal email (higher risk)');
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Clean lead list based on thresholds
   */
  cleanLeadList(
    scoredResults: ICPScoreResult[],
    policy: {
      drop_below: number;
      review_range: [number, number];
    }
  ): {
    kept: ICPScoreResult[];
    dropped: ICPScoreResult[];
    review: ICPScoreResult[];
    stats: {
      kept: number;
      dropped: number;
      review: number;
    };
  } {
    const kept: ICPScoreResult[] = [];
    const dropped: ICPScoreResult[] = [];
    const review: ICPScoreResult[] = [];

    for (const result of scoredResults) {
      if (result.fit_score < policy.drop_below) {
        dropped.push(result);
      } else if (
        result.fit_score >= policy.review_range[0] &&
        result.fit_score <= policy.review_range[1]
      ) {
        review.push(result);
      } else {
        kept.push(result);
      }
    }

    return {
      kept,
      dropped,
      review,
      stats: {
        kept: kept.length,
        dropped: dropped.length,
        review: review.length,
      },
    };
  }
}
