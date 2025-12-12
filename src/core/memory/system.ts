/**
 * Structured Memory System
 * Company, Persona, and Campaign memory that agents can query
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';

// ============================================================================
// Company Memory
// ============================================================================

export interface CompanyMemory {
  company: string;
  domain?: string;

  // What worked
  successful_angles: SuccessfulAngle[];
  converting_ctas: string[];
  preferred_channels: { channel: string; success_rate: number }[];

  // What failed
  failed_angles: FailedAngle[];
  objections_encountered: string[];

  // Preferences
  preferred_tone?: 'formal' | 'casual' | 'technical';
  best_contact_time?: string;
  typical_response_time_hours?: number;

  // Context
  industry?: string;
  size?: number;
  previous_interactions: number;
  last_contact?: Date;

  metadata?: Record<string, any>;
}

export interface SuccessfulAngle {
  angle: string;
  message_snippet: string;
  outcome: 'replied' | 'meeting_booked' | 'deal_closed';
  date: Date;
  context?: string;
}

export interface FailedAngle {
  angle: string;
  message_snippet: string;
  reason: string;
  date: Date;
}

// ============================================================================
// Persona Memory
// ============================================================================

export interface PersonaMemory {
  persona: string; // e.g., "VP Sales at Tech Companies"
  titles: string[];

  // What converts
  converting_ctas: CTAPerformance[];
  effective_angles: string[];
  successful_openers: string[];

  // Objections by role
  common_objections: { objection: string; frequency: number }[];

  // Behavior patterns
  avg_response_time_hours: number;
  preferred_message_length?: 'short' | 'medium' | 'long';
  prefers_questions: boolean;

  // Buying patterns
  typical_buying_window_days?: number;
  decision_making_process?: string[];

  // Performance
  total_outreach: number;
  reply_rate: number;
  conversion_rate: number;

  metadata?: Record<string, any>;
}

export interface CTAPerformance {
  cta: string;
  clicks?: number;
  replies?: number;
  meetings?: number;
  conversion_rate: number;
}

// ============================================================================
// Campaign Memory
// ============================================================================

export interface CampaignMemory {
  campaign_id: string;
  campaign_name: string;

  // Performance by context
  message_performance: MessagePerformance[];
  sequence_performance: SequencePerformance[];

  // What worked in this exact context
  winning_variants: {
    step: number;
    variant: string;
    performance: number;
  }[];

  // Learnings
  insights: string[];
  optimizations_applied: Optimization[];

  // Metrics
  total_leads: number;
  reply_rate: number;
  meeting_rate: number;

  created_at: Date;
  last_updated: Date;

  metadata?: Record<string, any>;
}

export interface MessagePerformance {
  message_id: string;
  content_snippet: string;
  step_number: number;
  sent: number;
  opened?: number;
  replied: number;
  positive_replies: number;
  reply_rate: number;
}

export interface SequencePerformance {
  sequence_id: string;
  name: string;
  total_starts: number;
  completions: number;
  replies: number;
  meetings: number;
  conversion_rate: number;
}

export interface Optimization {
  type: string;
  description: string;
  applied_at: Date;
  impact?: string;
}

// ============================================================================
// Memory System
// ============================================================================

export class MemorySystem {
  private companyMemory: Map<string, CompanyMemory> = new Map();
  private personaMemory: Map<string, PersonaMemory> = new Map();
  private campaignMemory: Map<string, CampaignMemory> = new Map();

  /**
   * Company Memory Operations
   */

  getCompanyMemory(company: string): CompanyMemory | undefined {
    return this.companyMemory.get(company.toLowerCase());
  }

  recordCompanySuccess(
    company: string,
    angle: string,
    message: string,
    outcome: 'replied' | 'meeting_booked' | 'deal_closed'
  ): void {
    let memory = this.companyMemory.get(company.toLowerCase());

    if (!memory) {
      memory = {
        company,
        successful_angles: [],
        converting_ctas: [],
        preferred_channels: [],
        failed_angles: [],
        objections_encountered: [],
        previous_interactions: 0,
      };
      this.companyMemory.set(company.toLowerCase(), memory);
    }

    memory.successful_angles.push({
      angle,
      message_snippet: message.substring(0, 100),
      outcome,
      date: new Date(),
    });

    memory.previous_interactions++;
    memory.last_contact = new Date();

    logger.info('Recorded company success', { company, angle, outcome });
  }

  recordCompanyFailure(company: string, angle: string, message: string, reason: string): void {
    let memory = this.companyMemory.get(company.toLowerCase());

    if (!memory) {
      memory = {
        company,
        successful_angles: [],
        converting_ctas: [],
        preferred_channels: [],
        failed_angles: [],
        objections_encountered: [],
        previous_interactions: 0,
      };
      this.companyMemory.set(company.toLowerCase(), memory);
    }

    memory.failed_angles.push({
      angle,
      message_snippet: message.substring(0, 100),
      reason,
      date: new Date(),
    });

    memory.previous_interactions++;
    memory.last_contact = new Date();

    logger.info('Recorded company failure', { company, angle, reason });
  }

  /**
   * Persona Memory Operations
   */

  getPersonaMemory(persona: string): PersonaMemory | undefined {
    return this.personaMemory.get(persona.toLowerCase());
  }

  initializePersona(persona: string, titles: string[]): PersonaMemory {
    const memory: PersonaMemory = {
      persona,
      titles,
      converting_ctas: [],
      effective_angles: [],
      successful_openers: [],
      common_objections: [],
      avg_response_time_hours: 48,
      prefers_questions: false,
      total_outreach: 0,
      reply_rate: 0,
      conversion_rate: 0,
    };

    this.personaMemory.set(persona.toLowerCase(), memory);
    logger.info('Initialized persona memory', { persona });

    return memory;
  }

  updatePersonaPerformance(
    persona: string,
    outreach_count: number,
    replies: number,
    conversions: number
  ): void {
    const memory = this.personaMemory.get(persona.toLowerCase());
    if (!memory) return;

    memory.total_outreach += outreach_count;
    const total_replies = memory.reply_rate * memory.total_outreach + replies;
    memory.reply_rate = total_replies / memory.total_outreach;

    const total_conversions = memory.conversion_rate * memory.total_outreach + conversions;
    memory.conversion_rate = total_conversions / memory.total_outreach;

    logger.info('Updated persona performance', {
      persona,
      reply_rate: memory.reply_rate,
      conversion_rate: memory.conversion_rate,
    });
  }

  /**
   * Campaign Memory Operations
   */

  getCampaignMemory(campaign_id: string): CampaignMemory | undefined {
    return this.campaignMemory.get(campaign_id);
  }

  initializeCampaign(campaign_id: string, campaign_name: string): CampaignMemory {
    const memory: CampaignMemory = {
      campaign_id,
      campaign_name,
      message_performance: [],
      sequence_performance: [],
      winning_variants: [],
      insights: [],
      optimizations_applied: [],
      total_leads: 0,
      reply_rate: 0,
      meeting_rate: 0,
      created_at: new Date(),
      last_updated: new Date(),
    };

    this.campaignMemory.set(campaign_id, memory);
    logger.info('Initialized campaign memory', { campaign_id, campaign_name });

    return memory;
  }

  recordMessagePerformance(
    campaign_id: string,
    message_id: string,
    content: string,
    step: number,
    sent: number,
    replied: number,
    positive: number
  ): void {
    const memory = this.campaignMemory.get(campaign_id);
    if (!memory) return;

    memory.message_performance.push({
      message_id,
      content_snippet: content.substring(0, 100),
      step_number: step,
      sent,
      replied,
      positive_replies: positive,
      reply_rate: sent > 0 ? replied / sent : 0,
    });

    memory.last_updated = new Date();

    logger.info('Recorded message performance', {
      campaign_id,
      message_id,
      reply_rate: replied / sent,
    });
  }

  addCampaignInsight(campaign_id: string, insight: string): void {
    const memory = this.campaignMemory.get(campaign_id);
    if (!memory) return;

    memory.insights.push(insight);
    memory.last_updated = new Date();

    logger.info('Added campaign insight', { campaign_id, insight });
  }

  /**
   * Query Memory
   */

  queryCompanies(filters: {
    industry?: string;
    min_success_rate?: number;
    has_successful_angle?: boolean;
  }): CompanyMemory[] {
    let companies = Array.from(this.companyMemory.values());

    if (filters.industry) {
      companies = companies.filter(c => c.industry === filters.industry);
    }

    if (filters.has_successful_angle) {
      companies = companies.filter(c => c.successful_angles.length > 0);
    }

    return companies;
  }

  queryPersonas(filters: {
    min_reply_rate?: number;
    min_outreach?: number;
  }): PersonaMemory[] {
    let personas = Array.from(this.personaMemory.values());

    if (filters.min_reply_rate) {
      personas = personas.filter(p => p.reply_rate >= filters.min_reply_rate);
    }

    if (filters.min_outreach) {
      personas = personas.filter(p => p.total_outreach >= filters.min_outreach);
    }

    return personas;
  }

  /**
   * Memory Expiration
   */

  expireOldMemory(days: number = 90): {
    companies_expired: number;
    campaigns_expired: number;
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let companiesExpired = 0;
    for (const [key, memory] of this.companyMemory.entries()) {
      if (memory.last_contact && memory.last_contact < cutoffDate) {
        this.companyMemory.delete(key);
        companiesExpired++;
      }
    }

    let campaignsExpired = 0;
    for (const [key, memory] of this.campaignMemory.entries()) {
      if (memory.last_updated < cutoffDate) {
        this.campaignMemory.delete(key);
        campaignsExpired++;
      }
    }

    logger.info('Expired old memory', { companiesExpired, campaignsExpired, days });

    return { companies_expired: companiesExpired, campaigns_expired: campaignsExpired };
  }

  /**
   * Get Memory Statistics
   */
  getStatistics(): {
    total_companies: number;
    total_personas: number;
    total_campaigns: number;
    companies_with_success: number;
    avg_interactions_per_company: number;
    best_performing_persona?: string;
  } {
    const companies = Array.from(this.companyMemory.values());
    const personas = Array.from(this.personaMemory.values());

    const companiesWithSuccess = companies.filter(c => c.successful_angles.length > 0).length;

    const avgInteractions =
      companies.length > 0
        ? companies.reduce((sum, c) => sum + c.previous_interactions, 0) / companies.length
        : 0;

    const bestPersona = personas.sort((a, b) => b.conversion_rate - a.conversion_rate)[0];

    return {
      total_companies: companies.length,
      total_personas: personas.length,
      total_campaigns: this.campaignMemory.size,
      companies_with_success: companiesWithSuccess,
      avg_interactions_per_company: avgInteractions,
      best_performing_persona: bestPersona?.persona,
    };
  }
}
