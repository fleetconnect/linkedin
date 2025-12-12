/**
 * Suppression Intelligence
 * Makes "not sending" a first-class feature - sometimes the best action is no action
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import type { Lead } from '../../types/index.js';

export interface SuppressionReason {
  type: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  recommendation?: string;
  revisit_after?: Date;
}

export interface SuppressionDecision {
  id: string;
  lead_id: string;
  should_suppress: boolean;
  confidence: number;
  reasons: SuppressionReason[];
  alternative_action?: string;
  revisit_date?: Date;
  timestamp: Date;
}

export interface SuppressionSignal {
  signal: string;
  value: any;
  weight: number;
}

export class SuppressionIntelligence {
  private suppressedLeads: Map<string, SuppressionDecision> = new Map();
  private skippedConversions: Map<string, { skipped_at: Date; converted_at: Date }> = new Map();

  /**
   * Decide whether to suppress outreach to a lead
   */
  async evaluateSuppression(params: {
    lead: Lead;
    campaign_context?: any;
    market_signals?: any;
  }): Promise<SuppressionDecision> {
    const reasons: SuppressionReason[] = [];
    let suppressionScore = 0;

    // 1. Lead is too early in journey
    if (this.isLeadTooEarly(params.lead)) {
      reasons.push({
        type: 'too_early',
        severity: 'medium',
        explanation: 'Lead shows early-stage signals, likely not ready for outreach',
        recommendation: 'Wait until they show intent signals or reach target stage',
        revisit_after: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      suppressionScore += 0.3;
    }

    // 2. Mixed signals detected
    if (this.hasMixedSignals(params.lead, params.market_signals)) {
      reasons.push({
        type: 'mixed_signals',
        severity: 'medium',
        explanation: 'Conflicting signals make success probability uncertain',
        recommendation: 'Wait for clearer buying signals',
        revisit_after: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      suppressionScore += 0.25;
    }

    // 3. Risk outweighs upside
    const riskAnalysis = this.analyzeRiskVsUpside(params.lead);
    if (riskAnalysis.risk_score > riskAnalysis.upside_score * 1.5) {
      reasons.push({
        type: 'risk_too_high',
        severity: 'high',
        explanation: `Risk score (${riskAnalysis.risk_score.toFixed(1)}) significantly outweighs upside (${riskAnalysis.upside_score.toFixed(1)})`,
        recommendation: 'Focus on higher-probability opportunities',
      });
      suppressionScore += 0.4;
    }

    // 4. Better angle will appear soon
    const futureAngle = this.predictBetterAngle(params.lead);
    if (futureAngle.confidence > 0.7) {
      reasons.push({
        type: 'better_angle_soon',
        severity: 'low',
        explanation: futureAngle.explanation,
        recommendation: `Wait for: ${futureAngle.trigger}`,
        revisit_after: futureAngle.expected_date,
      });
      suppressionScore += 0.2;
    }

    // 5. Recent negative interaction
    if (params.lead.enrichmentData?.last_negative_reply) {
      const daysSince = this.daysSince(new Date(params.lead.enrichmentData.last_negative_reply));
      if (daysSince < 90) {
        reasons.push({
          type: 'recent_negative',
          severity: 'high',
          explanation: `Lead replied negatively ${daysSince} days ago`,
          recommendation: 'Wait at least 90 days before re-engagement',
          revisit_after: new Date(Date.now() + (90 - daysSince) * 24 * 60 * 60 * 1000),
        });
        suppressionScore += 0.5;
      }
    }

    // 6. Timing is suboptimal
    const timingAnalysis = this.analyzeTimingSignals(params.lead);
    if (timingAnalysis.score < 0.4) {
      reasons.push({
        type: 'bad_timing',
        severity: 'medium',
        explanation: timingAnalysis.explanation,
        recommendation: 'Wait for optimal timing window',
        revisit_after: timingAnalysis.optimal_date,
      });
      suppressionScore += 0.25;
    }

    // 7. Company in transition (hiring freeze, layoffs, etc.)
    if (params.market_signals?.company_in_transition) {
      reasons.push({
        type: 'company_transition',
        severity: 'high',
        explanation: 'Company appears to be in transition period',
        recommendation: 'Wait until situation stabilizes',
        revisit_after: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });
      suppressionScore += 0.4;
    }

    const should_suppress = suppressionScore >= 0.5;
    const revisit_date = this.calculateRevisitDate(reasons);

    const decision: SuppressionDecision = {
      id: uuidv4(),
      lead_id: params.lead.id,
      should_suppress,
      confidence: Math.min(1, suppressionScore),
      reasons,
      alternative_action: should_suppress ? this.suggestAlternative(params.lead, reasons) : undefined,
      revisit_date,
      timestamp: new Date(),
    };

    if (should_suppress) {
      this.suppressedLeads.set(params.lead.id, decision);
      logger.info('Lead suppressed', {
        lead_id: params.lead.id,
        confidence: decision.confidence,
        reason_count: reasons.length,
      });
    }

    return decision;
  }

  /**
   * Track when suppressed leads later convert
   * This validates the suppression decision
   */
  trackSkippedConversion(leadId: string): void {
    const suppression = this.suppressedLeads.get(leadId);
    if (!suppression) return;

    this.skippedConversions.set(leadId, {
      skipped_at: suppression.timestamp,
      converted_at: new Date(),
    });

    logger.info('Tracked skipped conversion', {
      lead_id: leadId,
      days_waited: this.daysSince(suppression.timestamp),
    });
  }

  /**
   * Get suppression effectiveness metrics
   */
  getSuppressionMetrics(): {
    total_suppressed: number;
    later_conversions: number;
    conversion_rate_of_skipped: number;
    avg_wait_time_days: number;
    roi_impact: string;
  } {
    const totalSuppressed = this.suppressedLeads.size;
    const laterConversions = this.skippedConversions.size;
    const conversionRate = totalSuppressed > 0 ? laterConversions / totalSuppressed : 0;

    const waitTimes = Array.from(this.skippedConversions.values()).map(conv =>
      this.daysSince(conv.skipped_at)
    );
    const avgWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length
      : 0;

    let roiImpact = 'neutral';
    if (conversionRate > 0.2) roiImpact = 'positive - good suppression decisions';
    else if (conversionRate < 0.05) roiImpact = 'negative - too aggressive suppression';

    return {
      total_suppressed: totalSuppressed,
      later_conversions: laterConversions,
      conversion_rate_of_skipped: conversionRate,
      avg_wait_time_days: avgWaitTime,
      roi_impact: roiImpact,
    };
  }

  /**
   * Check if it's time to revisit a suppressed lead
   */
  getLeadsToRevisit(): SuppressionDecision[] {
    const now = new Date();
    return Array.from(this.suppressedLeads.values()).filter(
      decision => decision.revisit_date && decision.revisit_date <= now
    );
  }

  /**
   * Remove suppression
   */
  removeSuppressionAsync(leadId: string): void {
    this.suppressedLeads.delete(leadId);
    logger.info('Suppression removed', { lead_id: leadId });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private isLeadTooEarly(lead: Lead): boolean {
    // Check if company is newly founded, person just started role, etc.
    const recentHireIndicators = [
      'just joined',
      'new role',
      'excited to announce',
      'starting my journey',
    ];

    const enrichmentText = JSON.stringify(lead.enrichmentData || {}).toLowerCase();
    return recentHireIndicators.some(indicator => enrichmentText.includes(indicator));
  }

  private hasMixedSignals(lead: Lead, marketSignals?: any): boolean {
    // Simplified: In real impl, check for contradictory signals
    // e.g., company hiring but also had layoffs
    // or lead showing interest but company in hiring freeze
    return marketSignals?.contradictory_signals || false;
  }

  private analyzeRiskVsUpside(lead: Lead): {
    risk_score: number;
    upside_score: number;
  } {
    let riskScore = 0;
    let upsideScore = 0;

    // Calculate risk
    if (!lead.email && !lead.linkedInUrl) riskScore += 3;
    if (lead.companySize && lead.companySize < 10) riskScore += 2;
    if (!lead.enrichmentData) riskScore += 1;

    // Calculate upside
    if (lead.companySize && lead.companySize > 100) upsideScore += 3;
    if (lead.title.match(/VP|Director|Chief|Head/i)) upsideScore += 2;
    if (lead.enrichmentData?.funding_recent) upsideScore += 2;

    return { risk_score: riskScore, upside_score: upsideScore };
  }

  private predictBetterAngle(lead: Lead): {
    confidence: number;
    explanation: string;
    trigger: string;
    expected_date?: Date;
  } {
    // Simplified: In real impl, use ML or heuristics to predict
    // For now, check for known upcoming events

    const upcomingEvents = [
      { trigger: 'fiscal year end', days: 30, confidence: 0.8 },
      { trigger: 'conference season', days: 60, confidence: 0.7 },
      { trigger: 'budget planning', days: 90, confidence: 0.75 },
    ];

    // Mock: return no better angle for now
    return {
      confidence: 0.3,
      explanation: 'No clear trigger event identified',
      trigger: 'none',
    };
  }

  private analyzeTimingSignals(lead: Lead): {
    score: number;
    explanation: string;
    optimal_date?: Date;
  } {
    const now = new Date();
    const month = now.getMonth();

    // End of quarter/year are usually bad times
    if (month === 11 || month === 2 || month === 5 || month === 8) {
      return {
        score: 0.3,
        explanation: 'End of quarter - prospects typically busy closing deals',
        optimal_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      };
    }

    // Summer months (July-August) often slow
    if (month === 6 || month === 7) {
      return {
        score: 0.4,
        explanation: 'Summer period - lower engagement rates',
        optimal_date: new Date(now.getFullYear(), 8, 1), // September 1st
      };
    }

    return {
      score: 0.8,
      explanation: 'Timing appears optimal',
    };
  }

  private suggestAlternative(lead: Lead, reasons: SuppressionReason[]): string {
    const primaryReason = reasons.sort((a, b) => {
      const severity = { high: 3, medium: 2, low: 1 };
      return severity[b.severity] - severity[a.severity];
    })[0];

    const alternatives: Record<string, string> = {
      too_early: 'Add to nurture sequence with educational content',
      mixed_signals: 'Monitor for clearer intent signals',
      risk_too_high: 'Focus resources on higher-probability opportunities',
      better_angle_soon: 'Set reminder to reach out when trigger event occurs',
      recent_negative: 'Remove from active campaigns, revisit in 90+ days',
      bad_timing: 'Schedule for optimal timing window',
      company_transition: 'Monitor company news, reach out when stable',
    };

    return alternatives[primaryReason.type] || 'Review lead quality and criteria';
  }

  private calculateRevisitDate(reasons: SuppressionReason[]): Date | undefined {
    const datesWithRevisit = reasons
      .filter(r => r.revisit_after)
      .map(r => r.revisit_after!);

    if (datesWithRevisit.length === 0) return undefined;

    // Return the earliest revisit date
    return datesWithRevisit.sort((a, b) => a.getTime() - b.getTime())[0];
  }

  private daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  }
}
