/**
 * Lead Scoring Types
 * Quantifies lead quality and conversion probability
 */

export interface ScoreComponents {
  // ICP Fit (0-100): How well lead matches ideal customer profile
  icpFit: number;

  // Research Quality (0-100): Depth and freshness of research data
  researchQuality: number;

  // Engagement Level (0-100): Response rate and conversation quality
  engagementLevel: number;

  // Conversion Probability (0-100): Statistical likelihood of booking
  conversionProbability: number;
}

export interface LeadScore {
  leadId: string;

  // Overall composite score (0-100)
  overallScore: number;

  // Individual component scores
  components: ScoreComponents;

  // Score tier classification
  tier: 'A' | 'B' | 'C' | 'D' | 'F';

  // Metadata
  scoredAt: Date;
  lastUpdated: Date;
  version: string; // Scoring algorithm version

  // Factors that influenced the score
  factors: string[];

  // Recommended actions based on score
  recommendations: string[];
}

export interface ScoreCalculationInput {
  leadId: string;

  // Force recalculation even if recent score exists
  forceRecalculate?: boolean;
}

export interface ScoreResult {
  success: boolean;
  leadId: string;
  score?: LeadScore;
  error?: string;
}

export interface BatchScoreQuery {
  // Filter by minimum score
  minScore?: number;

  // Filter by score tier
  tier?: 'A' | 'B' | 'C' | 'D' | 'F';

  // Filter by state
  state?: string;

  // Pagination
  limit?: number;
  offset?: number;

  // Sort order
  sortBy?: 'overallScore' | 'icpFit' | 'engagementLevel' | 'scoredAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BatchScoreResult {
  success: boolean;
  scores: LeadScore[];
  total: number;
  error?: string;
}

/**
 * Scoring algorithm version constant
 * Update this when scoring logic changes
 */
export const SCORING_VERSION = 'v1.0.0';

/**
 * Score tier thresholds
 */
export const SCORE_TIERS = {
  A: { min: 80, max: 100 },  // Premium leads
  B: { min: 60, max: 79 },   // High quality
  C: { min: 40, max: 59 },   // Medium quality
  D: { min: 20, max: 39 },   // Low quality
  F: { min: 0, max: 19 }     // Very low quality
} as const;

/**
 * Component score weights for overall score calculation
 */
export const SCORE_WEIGHTS = {
  icpFit: 0.35,              // 35% weight
  researchQuality: 0.25,     // 25% weight
  engagementLevel: 0.25,     // 25% weight
  conversionProbability: 0.15 // 15% weight
} as const;
