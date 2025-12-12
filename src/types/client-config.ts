/**
 * Client Configuration Types
 * Defines per-client settings for the agency install model
 */

export interface ClientICP {
  // Firmographic criteria
  company_size?: {
    min?: number;
    max?: number;
  };
  industries?: string[];
  geographies?: string[];
  exclude_companies?: string[];

  // Persona criteria
  titles?: string[];
  seniority_levels?: string[];
  departments?: string[];
  exclude_titles?: string[];

  // Behavioral/timing signals
  required_signals?: string[];
  preferred_signals?: string[];
}

export interface ClientOffer {
  product_name: string;
  value_proposition: string;
  primary_benefit: string;
  social_proof?: string;
  target_outcome: string;
  objection_handling?: Record<string, string>;
}

export interface ClientPreferences {
  tone: 'consultative' | 'direct' | 'friendly' | 'formal';
  personalization_level: 'light' | 'medium' | 'deep';
  cta_style: 'soft' | 'direct' | 'mixed';
  risk_tolerance: 'low' | 'medium' | 'high';
  aggressiveness: 1 | 2 | 3 | 4 | 5;
}

export interface ClientConstraints {
  // Safety limits
  daily_linkedin_connections?: number;
  daily_linkedin_messages?: number;
  daily_emails?: number;

  // Message constraints
  connect_note_max_chars?: number;
  dm_max_chars?: number;
  email_max_chars?: number;
  max_followups?: number;

  // Quality gates
  min_icp_score?: number;
  require_research_above_score?: number;
  require_approval_above_risk?: number;
}

export interface ClientScoringWeights {
  firmographic: number; // 0-1
  persona: number; // 0-1
  timing: number; // 0-1
  risk: number; // 0-1
}

export interface ClientThresholds {
  keep_above: number; // e.g., 70
  review_range: [number, number]; // e.g., [55, 69]
  drop_below: number; // e.g., 55
}

export interface ClientHeyReachConfig {
  api_key: string;
  account_id?: string;
  default_campaign_settings?: {
    from_account?: string;
    timezone?: string;
    send_window?: {
      start_hour: number;
      end_hour: number;
    };
  };
}

export interface ClientConfig {
  // Identity
  client_id: string;
  client_name: string;
  installed_at: string;
  status: 'active' | 'paused' | 'archived';

  // Core configuration
  icp: ClientICP;
  offer: ClientOffer;
  preferences: ClientPreferences;
  constraints: ClientConstraints;
  scoring_weights: ClientScoringWeights;
  thresholds: ClientThresholds;

  // Integrations
  heyreach: ClientHeyReachConfig;

  // Metadata
  metadata?: {
    industry_vertical?: string;
    account_manager?: string;
    notes?: string;
  };
}

export interface ClientConfigValidationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
  normalized_config?: ClientConfig;
}

// Default configurations
export const DEFAULT_SCORING_WEIGHTS: ClientScoringWeights = {
  firmographic: 0.4,
  persona: 0.3,
  timing: 0.2,
  risk: 0.1,
};

export const DEFAULT_THRESHOLDS: ClientThresholds = {
  keep_above: 70,
  review_range: [55, 69],
  drop_below: 55,
};

export const DEFAULT_PREFERENCES: ClientPreferences = {
  tone: 'consultative',
  personalization_level: 'medium',
  cta_style: 'soft',
  risk_tolerance: 'medium',
  aggressiveness: 3,
};

export const DEFAULT_CONSTRAINTS: ClientConstraints = {
  daily_linkedin_connections: 50,
  daily_linkedin_messages: 100,
  daily_emails: 200,
  connect_note_max_chars: 280,
  dm_max_chars: 600,
  email_max_chars: 1000,
  max_followups: 2,
  min_icp_score: 55,
  require_research_above_score: 75,
  require_approval_above_risk: 80,
};
