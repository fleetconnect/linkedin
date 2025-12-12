/**
 * Magical UX Elements
 * Delightful moments that build confidence
 */

export class MagicalUX {
  /**
   * Generate context-aware notifications
   */
  static notify(event: string, context: any): string {
    const templates: Record<string, (ctx: any) => string> = {
      lead_hot: (ctx) => `🔥 ${ctx.lead_name} just became hot because ${ctx.reason}`,
      should_wait: (ctx) => `⏸️  We recommend waiting on ${ctx.lead_name} - ${ctx.reason}`,
      outperformed: (ctx) => `🎯 This message outperformed ${ctx.percentage}% of similar ones`,
      risk_detected: (ctx) => `⚠️  Risk detected: ${ctx.risk_type}. Pausing to protect account.`,
      timing_optimal: (ctx) => `✨ Optimal send time detected for ${ctx.persona} - sending now`,
      conversion_predicted: (ctx) => `🎲 ${ctx.confidence}% chance this lead converts in next ${ctx.days} days`,
      insight_ready: (ctx) => `💡 New insight: ${ctx.insight}`,
    };

    const template = templates[event];
    return template ? template(context) : event;
  }

  /**
   * Generate performance comparisons
   */
  static compare(metric: string, value: number, baseline: number): string {
    const diff = ((value - baseline) / baseline) * 100;
    const emoji = diff > 0 ? '📈' : '📉';
    const direction = diff > 0 ? 'above' : 'below';

    return `${emoji} ${metric}: ${value.toFixed(1)} (${Math.abs(diff).toFixed(0)}% ${direction} baseline)`;
  }

  /**
   * Generate confidence indicators
   */
  static confidence(score: number): string {
    if (score > 0.9) return '🟢 Very High Confidence';
    if (score > 0.7) return '🟡 High Confidence';
    if (score > 0.5) return '🟠 Medium Confidence';
    return '🔴 Low Confidence';
  }
}
