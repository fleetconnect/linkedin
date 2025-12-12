/**
 * Closed-Loop Learning System
 * Behavior changes based on outcomes, not just reports
 */

import { logger } from '../../utils/logger.js';

export interface LearningUpdate {
  id: string;
  type: 'weight' | 'threshold' | 'angle' | 'timing';
  previous_value: any;
  new_value: any;
  reason: string;
  confidence: number;
  applied_at: Date;
}

export class ClosedLoopOptimizer {
  private updates: LearningUpdate[] = [];
  private weights: Map<string, number> = new Map();
  private thresholds: Map<string, number> = new Map();

  /**
   * Learn from message variant performance
   */
  learnFromVariant(params: {
    variant_a: {id: string; performance: number};
    variant_b: {id: string; performance: number};
    metric: string;
  }): LearningUpdate | null {
    if (params.variant_b.performance > params.variant_a.performance * 1.2) {
      // Variant B significantly outperformed A
      const update: LearningUpdate = {
        id: `learn_${Date.now()}`,
        type: 'weight',
        previous_value: this.weights.get(params.variant_a.id) || 1,
        new_value: 0.8, // Decrease weight of variant A
        reason: `Variant B outperformed A by ${((params.variant_b.performance / params.variant_a.performance - 1) * 100).toFixed(0)}% on ${params.metric}`,
        confidence: 0.8,
        applied_at: new Date(),
      };

      this.weights.set(params.variant_a.id, 0.8);
      this.weights.set(params.variant_b.id, 1.2);
      this.updates.push(update);

      logger.info('Learning applied', update);
      return update;
    }
    return null;
  }

  /**
   * Adjust timing based on response patterns
   */
  optimizeTiming(params: {
    current_delay_hours: number;
    avg_response_time_hours: number;
    reply_rate: number;
  }): LearningUpdate | null {
    const optimalDelay = params.avg_response_time_hours * 1.5;

    if (Math.abs(optimalDelay - params.current_delay_hours) > 12) {
      const update: LearningUpdate = {
        id: `timing_${Date.now()}`,
        type: 'timing',
        previous_value: params.current_delay_hours,
        new_value: Math.round(optimalDelay),
        reason: `Adjusted to 1.5x average response time (${params.avg_response_time_hours}h)`,
        confidence: params.reply_rate > 0.1 ? 0.9 : 0.6,
        applied_at: new Date(),
      };

      this.thresholds.set('follow_up_delay', Math.round(optimalDelay));
      this.updates.push(update);

      logger.info('Timing optimized', update);
      return update;
    }

    return null;
  }

  /**
   * Update angle based on reply patterns
   */
  rotateAngle(params: {
    current_angle: string;
    reply_rate: number;
    threshold: number;
  }): LearningUpdate | null {
    if (params.reply_rate < params.threshold) {
      const update: LearningUpdate = {
        id: `angle_${Date.now()}`,
        type: 'angle',
        previous_value: params.current_angle,
        new_value: 'rotate_to_next',
        reason: `Reply rate ${(params.reply_rate * 100).toFixed(1)}% below threshold ${(params.threshold * 100).toFixed(1)}%`,
        confidence: 0.85,
        applied_at: new Date(),
      };

      this.updates.push(update);
      logger.info('Angle rotation triggered', update);
      return update;
    }

    return null;
  }

  /**
   * Get recent optimizations
   */
  getRecentUpdates(limit: number = 10): LearningUpdate[] {
    return this.updates.slice(-limit).reverse();
  }

  /**
   * Get optimization impact
   */
  getImpact(): {
    total_updates: number;
    by_type: Record<string, number>;
    avg_confidence: number;
  } {
    const byType: Record<string, number> = {};
    let totalConfidence = 0;

    this.updates.forEach(update => {
      byType[update.type] = (byType[update.type] || 0) + 1;
      totalConfidence += update.confidence;
    });

    return {
      total_updates: this.updates.length,
      by_type: byType,
      avg_confidence: this.updates.length > 0 ? totalConfidence / this.updates.length : 0,
    };
  }
}
