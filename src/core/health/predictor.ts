/**
 * Predictive Account Health
 * Predicts issues before they happen
 */

import { logger } from '../../utils/logger.js';

export interface HealthPrediction {
  status: 'healthy' | 'warning' | 'critical';
  issues: HealthIssue[];
  recommendations: string[];
  confidence: number;
}

export interface HealthIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  trend: 'improving' | 'stable' | 'declining';
}

export class HealthPredictor {
  /**
   * Predict account health issues
   */
  predictHealth(params: {
    acceptance_rate: number;
    reply_rate: number;
    message_entropy: number;
    bounce_rate: number;
    recent_warnings: number;
  }): HealthPrediction {
    const issues: HealthIssue[] = [];
    const recommendations: string[] = [];

    // Acceptance rate dropping
    if (params.acceptance_rate < 0.3 && params.acceptance_rate > 0) {
      issues.push({
        type: 'low_acceptance_rate',
        severity: 'high',
        description: `Acceptance rate at ${(params.acceptance_rate * 100).toFixed(0)}% (healthy: >40%)`,
        trend: 'declining',
      });
      recommendations.push('Review connection request messaging');
      recommendations.push('Reduce daily connection volume by 30%');
    }

    // Message entropy too low (repetitive)
    if (params.message_entropy < 0.5) {
      issues.push({
        type: 'low_message_entropy',
        severity: 'medium',
        description: 'Messages are too similar - may trigger spam detection',
        trend: 'stable',
      });
      recommendations.push('Increase message variation');
      recommendations.push('Rotate message templates');
    }

    // Pattern looks risky
    if (params.recent_warnings > 2) {
      issues.push({
        type: 'risky_pattern',
        severity: 'high',
        description: `${params.recent_warnings} warnings in recent period`,
        trend: 'declining',
      });
      recommendations.push('Pause all activity for 24 hours');
      recommendations.push('Review account behavior patterns');
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.some(i => i.severity === 'high')) status = 'critical';
    else if (issues.length > 0) status = 'warning';

    return {
      status,
      issues,
      recommendations,
      confidence: 0.85,
    };
  }

  /**
   * Auto-throttle if needed
   */
  autoThrottle(health: HealthPrediction): {
    should_throttle: boolean;
    new_daily_limit?: number;
  } {
    if (health.status === 'critical') {
      logger.warn('Auto-throttling triggered', { issues: health.issues.length });
      return {
        should_throttle: true,
        new_daily_limit: 20, // Reduce to safe minimum
      };
    }

    if (health.status === 'warning') {
      return {
        should_throttle: true,
        new_daily_limit: 40, // Moderate reduction
      };
    }

    return { should_throttle: false };
  }
}
