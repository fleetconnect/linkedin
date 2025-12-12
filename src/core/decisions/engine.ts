/**
 * Decision Transparency System
 * Every AI decision emits reasoning, signals, and alternatives
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';

export interface DecisionSignal {
  name: string;
  value: any;
  weight: number;
  source: string;
}

export interface DecisionReason {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface AlternativeConsidered {
  action: string;
  reason_rejected: string;
  confidence_delta: number;
}

export interface AgentDecision {
  id: string;
  decision: string;
  confidence: number;
  timestamp: Date;

  // Why it made this decision
  signals_used: DecisionSignal[];
  reasoning: DecisionReason[];

  // What it considered but rejected
  alternatives_considered: AlternativeConsidered[];
  signals_ignored: DecisionSignal[];

  // Context
  lead_id?: string;
  campaign_id?: string;
  metadata?: Record<string, any>;
}

export class DecisionEngine {
  private decisions: Map<string, AgentDecision> = new Map();

  /**
   * Record a decision with full transparency
   */
  recordDecision(params: {
    decision: string;
    confidence: number;
    signals_used: DecisionSignal[];
    reasoning: DecisionReason[];
    alternatives_considered?: AlternativeConsidered[];
    signals_ignored?: DecisionSignal[];
    lead_id?: string;
    campaign_id?: string;
    metadata?: Record<string, any>;
  }): AgentDecision {
    const decision: AgentDecision = {
      id: uuidv4(),
      decision: params.decision,
      confidence: params.confidence,
      timestamp: new Date(),
      signals_used: params.signals_used,
      reasoning: params.reasoning,
      alternatives_considered: params.alternatives_considered || [],
      signals_ignored: params.signals_ignored || [],
      lead_id: params.lead_id,
      campaign_id: params.campaign_id,
      metadata: params.metadata,
    };

    this.decisions.set(decision.id, decision);

    logger.info('Agent decision recorded', {
      decision_id: decision.id,
      decision: decision.decision,
      confidence: decision.confidence,
      lead_id: params.lead_id,
    });

    return decision;
  }

  /**
   * Get human-readable explanation of a decision
   */
  explainDecision(decisionId: string): string {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      return 'Decision not found';
    }

    let explanation = `🎯 Decision: ${decision.decision}\n`;
    explanation += `📊 Confidence: ${(decision.confidence * 100).toFixed(0)}%\n\n`;

    explanation += `✅ Why this decision:\n`;
    decision.reasoning.forEach((reason, i) => {
      const emoji = reason.impact === 'high' ? '🔥' : reason.impact === 'medium' ? '⚡' : '💡';
      explanation += `${i + 1}. ${emoji} ${reason.factor}: ${reason.explanation}\n`;
    });

    if (decision.signals_used.length > 0) {
      explanation += `\n📈 Key signals:\n`;
      decision.signals_used
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .forEach(signal => {
          explanation += `  • ${signal.name}: ${JSON.stringify(signal.value)} (weight: ${signal.weight})\n`;
        });
    }

    if (decision.alternatives_considered.length > 0) {
      explanation += `\n🤔 Alternatives considered:\n`;
      decision.alternatives_considered.forEach(alt => {
        explanation += `  • ${alt.action}: ${alt.reason_rejected}\n`;
      });
    }

    if (decision.signals_ignored.length > 0) {
      explanation += `\n⏭️  Signals ignored:\n`;
      decision.signals_ignored.slice(0, 3).forEach(signal => {
        explanation += `  • ${signal.name}: ${signal.value}\n`;
      });
    }

    return explanation;
  }

  /**
   * Get all decisions for a lead or campaign
   */
  getDecisions(filters: {
    lead_id?: string;
    campaign_id?: string;
    since?: Date;
  }): AgentDecision[] {
    let decisions = Array.from(this.decisions.values());

    if (filters.lead_id) {
      decisions = decisions.filter(d => d.lead_id === filters.lead_id);
    }

    if (filters.campaign_id) {
      decisions = decisions.filter(d => d.campaign_id === filters.campaign_id);
    }

    if (filters.since) {
      decisions = decisions.filter(d => d.timestamp >= filters.since);
    }

    return decisions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Analyze decision patterns
   */
  analyzeDecisions(campaign_id: string): {
    total_decisions: number;
    avg_confidence: number;
    top_signals: { name: string; count: number }[];
    common_alternatives: { action: string; count: number }[];
  } {
    const decisions = this.getDecisions({ campaign_id });

    const signalCounts: Map<string, number> = new Map();
    const altCounts: Map<string, number> = new Map();

    let totalConfidence = 0;

    decisions.forEach(decision => {
      totalConfidence += decision.confidence;

      decision.signals_used.forEach(signal => {
        signalCounts.set(signal.name, (signalCounts.get(signal.name) || 0) + 1);
      });

      decision.alternatives_considered.forEach(alt => {
        altCounts.set(alt.action, (altCounts.get(alt.action) || 0) + 1);
      });
    });

    return {
      total_decisions: decisions.length,
      avg_confidence: decisions.length > 0 ? totalConfidence / decisions.length : 0,
      top_signals: Array.from(signalCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      common_alternatives: Array.from(altCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }

  /**
   * Get decision by ID
   */
  getDecision(decisionId: string): AgentDecision | undefined {
    return this.decisions.get(decisionId);
  }
}
