/**
 * Research Data Types
 * Structured data from Perplexity and other research sources
 */

export interface ResearchSnapshot {
  // Core fields (Tier 1)
  firstName?: string;
  company?: string;
  title?: string;
  industryNiche?: string;

  // Tier 2 fields
  yearsExperience?: string;
  credentials?: string[];
  recentContentTopics?: string[];

  // Tier 3 fields (deepest personalization)
  companyDescription?: string;
  companyPositioning?: string;
  targetAudience?: string;
  problemsTheySolve?: string[];
  recentNews?: string[];
  challenges?: string[];
  opportunities?: string[];

  // Metadata
  researchedAt?: Date;
  source?: 'perplexity' | 'manual' | 'enrichment';
  confidence?: number; // 0-1 score of data quality
}

export interface ResearchInput {
  leadId: string;
  linkedinUrl?: string;
  companyWebsite?: string;
  additionalContext?: string;
}

export interface ResearchResult {
  success: boolean;
  leadId: string;
  snapshot?: ResearchSnapshot;
  error?: string;
  tokensUsed?: number;
  durationMs?: number;
}

export interface EnrichmentStatus {
  leadId: string;
  hasResearch: boolean;
  researchQuality?: 'tier1' | 'tier2' | 'tier3';
  lastResearchedAt?: Date;
  source?: string;
  needsUpdate?: boolean;
  updateReason?: string;
}
