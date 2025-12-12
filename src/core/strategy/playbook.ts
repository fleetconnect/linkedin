/**
 * Campaign Strategy as Code
 * Strategies are objects that agents reason against, not config files
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import type { ICPCriteria, Channel } from '../../types/index.js';

export interface CampaignStrategy {
  id: string;
  name: string;
  description: string;

  // Strategic Intent
  goal: 'book_meetings' | 'generate_leads' | 'nurture' | 'reactivate' | 'upsell';
  target_persona: string;

  // Risk & Research
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  research_depth: 'light' | 'standard' | 'deep';

  // Execution
  channels: Channel[];
  message_approach: 'direct' | 'value_first' | 'problem_aware' | 'educational';
  personalization_level: 'basic' | 'medium' | 'high';

  // Fallbacks & Recovery
  fallbacks: StrategyFallback[];

  // Optimization
  optimization_goal: 'reply_rate' | 'meeting_rate' | 'conversion_rate';
  ab_testing_enabled: boolean;

  // Success Criteria
  success_metrics: {
    target_reply_rate?: number;
    target_meeting_rate?: number;
    min_responses?: number;
  };

  // Metadata
  created_at: Date;
  performance_history?: StrategyPerformance[];
  tags?: string[];
}

export interface StrategyFallback {
  trigger: 'no_reply' | 'negative_reply' | 'low_engagement' | 'time_elapsed';
  condition: any;
  action: 'wait_n_days' | 'switch_angle' | 'switch_channel' | 'handoff_to_human' | 'pause' | 'remove';
  parameters?: Record<string, any>;
}

export interface StrategyPerformance {
  campaign_id: string;
  start_date: Date;
  end_date?: Date;
  leads_contacted: number;
  reply_rate: number;
  meeting_rate: number;
  notes?: string;
}

export interface StrategyDecision {
  strategy: CampaignStrategy;
  lead_context: any;
  decision: string;
  reasoning: string[];
  next_actions: string[];
}

export class StrategyPlaybook {
  private strategies: Map<string, CampaignStrategy> = new Map();

  /**
   * Load built-in strategies
   */
  constructor() {
    this.loadBuiltInStrategies();
  }

  /**
   * Get a strategy by ID
   */
  getStrategy(strategyId: string): CampaignStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  /**
   * Create a new strategy
   */
  createStrategy(params: Omit<CampaignStrategy, 'id' | 'created_at'>): CampaignStrategy {
    const strategy: CampaignStrategy = {
      ...params,
      id: uuidv4(),
      created_at: new Date(),
    };

    this.strategies.set(strategy.id, strategy);
    logger.info('Strategy created', {
      strategy_id: strategy.id,
      name: strategy.name,
    });

    return strategy;
  }

  /**
   * Make a strategic decision based on strategy + context
   */
  makeDecision(params: {
    strategy: CampaignStrategy;
    lead_context: any;
    current_step?: number;
  }): StrategyDecision {
    const reasoning: string[] = [];
    const next_actions: string[] = [];

    // 1. Evaluate goal alignment
    reasoning.push(`Goal: ${params.strategy.goal}`);

    // 2. Check risk tolerance
    const leadRiskScore = this.assessLeadRisk(params.lead_context);
    if (leadRiskScore > 7 && params.strategy.risk_tolerance === 'conservative') {
      reasoning.push('High-risk lead + conservative strategy → extra caution required');
      next_actions.push('require_manual_review');
    }

    // 3. Determine research needs
    if (params.strategy.research_depth === 'deep') {
      reasoning.push('Deep research required - gathering company signals');
      next_actions.push('enrich_with_signals');
    }

    // 4. Channel selection
    const bestChannel = this.selectChannel(params.strategy, params.lead_context);
    reasoning.push(`Primary channel: ${bestChannel}`);
    next_actions.push(`use_channel:${bestChannel}`);

    // 5. Message approach
    const approach = this.determineApproach(params.strategy, params.lead_context);
    reasoning.push(`Message approach: ${approach}`);
    next_actions.push(`approach:${approach}`);

    // 6. Fallback planning
    const activeFallbacks = params.strategy.fallbacks.filter(f =>
      this.evaluateFallbackTrigger(f, params.lead_context)
    );

    if (activeFallbacks.length > 0) {
      reasoning.push(`${activeFallbacks.length} fallback(s) triggered`);
      activeFallbacks.forEach(fallback => {
        next_actions.push(`fallback:${fallback.action}`);
      });
    }

    // 7. Optimization decisions
    if (params.strategy.ab_testing_enabled) {
      reasoning.push('A/B testing enabled - generating variant');
      next_actions.push('generate_variant');
    }

    const decision = next_actions[0] || 'proceed_with_standard_flow';

    return {
      strategy: params.strategy,
      lead_context: params.lead_context,
      decision,
      reasoning,
      next_actions,
    };
  }

  /**
   * Find best strategy for a given context
   */
  recommendStrategy(params: {
    goal: string;
    persona: string;
    risk_tolerance?: string;
  }): CampaignStrategy[] {
    let candidates = Array.from(this.strategies.values());

    // Filter by goal
    candidates = candidates.filter(s => s.goal === params.goal);

    // Filter by persona if specified
    if (params.persona) {
      candidates = candidates.filter(s =>
        s.target_persona.toLowerCase().includes(params.persona.toLowerCase())
      );
    }

    // Filter by risk tolerance if specified
    if (params.risk_tolerance) {
      candidates = candidates.filter(s => s.risk_tolerance === params.risk_tolerance);
    }

    // Sort by historical performance
    candidates.sort((a, b) => {
      const aPerf = this.getStrategyScore(a);
      const bPerf = this.getStrategyScore(b);
      return bPerf - aPerf;
    });

    return candidates;
  }

  /**
   * Clone a winning strategy
   */
  cloneStrategy(strategyId: string, newName: string): CampaignStrategy {
    const original = this.strategies.get(strategyId);
    if (!original) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }

    const cloned: CampaignStrategy = {
      ...original,
      id: uuidv4(),
      name: newName,
      created_at: new Date(),
      performance_history: [], // Start fresh
    };

    this.strategies.set(cloned.id, cloned);
    logger.info('Strategy cloned', {
      original_id: strategyId,
      new_id: cloned.id,
      name: newName,
    });

    return cloned;
  }

  /**
   * Record strategy performance
   */
  recordPerformance(strategyId: string, performance: StrategyPerformance): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    if (!strategy.performance_history) {
      strategy.performance_history = [];
    }

    strategy.performance_history.push(performance);

    logger.info('Strategy performance recorded', {
      strategy_id: strategyId,
      reply_rate: performance.reply_rate,
      meeting_rate: performance.meeting_rate,
    });
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): CampaignStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Export strategy as JSON
   */
  exportStrategy(strategyId: string): string {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }

    return JSON.stringify(strategy, null, 2);
  }

  /**
   * Import strategy from JSON
   */
  importStrategy(json: string): CampaignStrategy {
    const strategy: CampaignStrategy = JSON.parse(json);
    strategy.id = uuidv4(); // New ID
    strategy.created_at = new Date();

    this.strategies.set(strategy.id, strategy);
    logger.info('Strategy imported', { strategy_id: strategy.id, name: strategy.name });

    return strategy;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private loadBuiltInStrategies(): void {
    // Strategy 1: Enterprise Book Meetings
    this.createStrategy({
      name: 'Enterprise Meeting Booker',
      description: 'Conservative strategy for booking meetings with enterprise accounts',
      goal: 'book_meetings',
      target_persona: 'VP/Director at Enterprise (1000+ employees)',
      risk_tolerance: 'conservative',
      research_depth: 'deep',
      channels: ['linkedin_message', 'email'],
      message_approach: 'value_first',
      personalization_level: 'high',
      fallbacks: [
        {
          trigger: 'no_reply',
          condition: { days: 7 },
          action: 'wait_n_days',
          parameters: { days: 7 },
        },
        {
          trigger: 'no_reply',
          condition: { days: 14 },
          action: 'switch_angle',
        },
        {
          trigger: 'negative_reply',
          condition: {},
          action: 'pause',
          parameters: { days: 90 },
        },
      ],
      optimization_goal: 'meeting_rate',
      ab_testing_enabled: true,
      success_metrics: {
        target_reply_rate: 0.15,
        target_meeting_rate: 0.08,
        min_responses: 10,
      },
    });

    // Strategy 2: SMB High Volume
    this.createStrategy({
      name: 'SMB Volume Play',
      description: 'Aggressive high-volume strategy for SMB leads',
      goal: 'generate_leads',
      target_persona: 'Founders/Directors at SMBs (10-200 employees)',
      risk_tolerance: 'aggressive',
      research_depth: 'light',
      channels: ['linkedin_connection', 'linkedin_message', 'email'],
      message_approach: 'direct',
      personalization_level: 'medium',
      fallbacks: [
        {
          trigger: 'no_reply',
          condition: { days: 3 },
          action: 'switch_channel',
        },
        {
          trigger: 'no_reply',
          condition: { days: 10 },
          action: 'remove',
        },
      ],
      optimization_goal: 'reply_rate',
      ab_testing_enabled: true,
      success_metrics: {
        target_reply_rate: 0.20,
        min_responses: 5,
      },
    });

    // Strategy 3: Reactivation
    this.createStrategy({
      name: 'Warm Lead Reactivation',
      description: 'Re-engage leads who went cold',
      goal: 'reactivate',
      target_persona: 'Previously engaged leads',
      risk_tolerance: 'moderate',
      research_depth: 'standard',
      channels: ['email', 'linkedin_message'],
      message_approach: 'problem_aware',
      personalization_level: 'high',
      fallbacks: [
        {
          trigger: 'no_reply',
          condition: { days: 14 },
          action: 'wait_n_days',
          parameters: { days: 30 },
        },
        {
          trigger: 'negative_reply',
          condition: {},
          action: 'handoff_to_human',
        },
      ],
      optimization_goal: 'reply_rate',
      ab_testing_enabled: false,
      success_metrics: {
        target_reply_rate: 0.25,
        min_responses: 3,
      },
    });

    logger.info('Built-in strategies loaded', { count: this.strategies.size });
  }

  private assessLeadRisk(context: any): number {
    // Simplified risk scoring (0-10)
    let risk = 5; // Baseline

    if (context.is_enterprise) risk += 2;
    if (context.senior_title) risk += 1;
    if (context.no_previous_contact) risk += 1;
    if (!context.has_email) risk += 1;

    return Math.min(10, risk);
  }

  private selectChannel(strategy: CampaignStrategy, context: any): Channel {
    // Select best channel based on strategy and context
    if (context.linkedin_active && strategy.channels.includes('linkedin_message')) {
      return 'linkedin_message';
    }

    if (context.has_verified_email && strategy.channels.includes('email')) {
      return 'email';
    }

    return strategy.channels[0];
  }

  private determineApproach(strategy: CampaignStrategy, context: any): string {
    // Can be overridden based on context
    if (context.high_intent_signals && strategy.message_approach === 'value_first') {
      return 'direct'; // Switch to more direct if they're ready
    }

    return strategy.message_approach;
  }

  private evaluateFallbackTrigger(fallback: StrategyFallback, context: any): boolean {
    switch (fallback.trigger) {
      case 'no_reply':
        return context.days_since_last_message >= (fallback.condition?.days || 7);
      case 'negative_reply':
        return context.last_reply_sentiment === 'negative';
      case 'low_engagement':
        return context.open_rate < 0.1;
      case 'time_elapsed':
        return context.days_in_campaign >= (fallback.condition?.days || 30);
      default:
        return false;
    }
  }

  private getStrategyScore(strategy: CampaignStrategy): number {
    if (!strategy.performance_history || strategy.performance_history.length === 0) {
      return 0;
    }

    // Calculate weighted score based on goal
    const history = strategy.performance_history;
    const avgReplyRate = history.reduce((sum, p) => sum + p.reply_rate, 0) / history.length;
    const avgMeetingRate = history.reduce((sum, p) => sum + p.meeting_rate, 0) / history.length;

    switch (strategy.goal) {
      case 'book_meetings':
        return avgMeetingRate * 100;
      case 'generate_leads':
        return avgReplyRate * 100;
      default:
        return (avgReplyRate + avgMeetingRate) * 50;
    }
  }
}
