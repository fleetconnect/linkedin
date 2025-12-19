import { Lead, Message, Intent } from '../types';

/**
 * Variant Analytics Utility
 *
 * Provides lightweight A/B testing analytics for message variants
 */

export interface VariantStats {
  variant: 'A' | 'B';
  totalSent: number;
  totalResponses: number;
  responseRate: number;
  positiveResponses: number;
  positiveResponseRate: number;
  interestedResponses: number;
  bookedResponses: number;
  neutralResponses: number;
  negativeResponses: number;
}

export interface VariantComparison {
  variantA: VariantStats;
  variantB: VariantStats;
  winner?: 'A' | 'B';
  confidenceLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * Calculate statistics for a specific variant
 */
export function calculateVariantStats(
  leads: Lead[],
  variant: 'A' | 'B'
): VariantStats {
  // Find all messages sent with this variant
  const variantMessages = leads.flatMap(lead =>
    lead.conversationHistory
      .filter(msg => msg.variant === variant && msg.sender === 'user')
      .map(msg => ({ message: msg, lead }))
  );

  const totalSent = variantMessages.length;

  // Count responses (next message from lead after variant message)
  let totalResponses = 0;
  let positiveResponses = 0;
  let interestedResponses = 0;
  let bookedResponses = 0;
  let neutralResponses = 0;
  let negativeResponses = 0;

  variantMessages.forEach(({ message, lead }) => {
    const messageIndex = lead.conversationHistory.findIndex(m => m.id === message.id);

    // Check if there's a response from the lead after this message
    if (messageIndex >= 0 && messageIndex < lead.conversationHistory.length - 1) {
      const nextMessage = lead.conversationHistory[messageIndex + 1];

      if (nextMessage.sender === 'lead') {
        totalResponses++;

        // Analyze the response using classification
        if (nextMessage.classification) {
          const intent = nextMessage.classification.intent;

          if (intent === Intent.INTERESTED || intent === Intent.BOOKED) {
            positiveResponses++;
          }

          if (intent === Intent.INTERESTED) {
            interestedResponses++;
          }

          if (intent === Intent.BOOKED) {
            bookedResponses++;
          }

          if (intent === Intent.NEUTRAL) {
            neutralResponses++;
          }

          if (intent === Intent.NEGATIVE) {
            negativeResponses++;
          }
        }
      }
    }
  });

  return {
    variant,
    totalSent,
    totalResponses,
    responseRate: totalSent > 0 ? totalResponses / totalSent : 0,
    positiveResponses,
    positiveResponseRate: totalSent > 0 ? positiveResponses / totalSent : 0,
    interestedResponses,
    bookedResponses,
    neutralResponses,
    negativeResponses
  };
}

/**
 * Compare performance between variant A and B
 */
export function compareVariants(leads: Lead[]): VariantComparison {
  const variantA = calculateVariantStats(leads, 'A');
  const variantB = calculateVariantStats(leads, 'B');

  // Determine winner based on positive response rate
  let winner: 'A' | 'B' | undefined;
  let confidenceLevel: 'low' | 'medium' | 'high' = 'low';

  const minSampleSize = 20; // Minimum messages to have medium confidence
  const highSampleSize = 50; // Minimum for high confidence

  // Only declare a winner if we have enough data
  if (variantA.totalSent >= minSampleSize && variantB.totalSent >= minSampleSize) {
    const difference = Math.abs(variantA.positiveResponseRate - variantB.positiveResponseRate);

    if (difference > 0.05) { // 5% difference threshold
      winner = variantA.positiveResponseRate > variantB.positiveResponseRate ? 'A' : 'B';

      // Determine confidence level based on sample size
      if (variantA.totalSent >= highSampleSize && variantB.totalSent >= highSampleSize) {
        confidenceLevel = 'high';
      } else {
        confidenceLevel = 'medium';
      }
    }
  }

  // Generate recommendation
  let recommendation: string;

  if (!winner) {
    if (variantA.totalSent < minSampleSize || variantB.totalSent < minSampleSize) {
      recommendation = `Not enough data yet. Need at least ${minSampleSize} messages per variant. Current: A=${variantA.totalSent}, B=${variantB.totalSent}`;
    } else {
      recommendation = 'Variants are performing similarly. Consider testing for longer or try different variants.';
    }
  } else {
    const winnerStats = winner === 'A' ? variantA : variantB;
    const loserStats = winner === 'A' ? variantB : variantA;
    const improvement = ((winnerStats.positiveResponseRate - loserStats.positiveResponseRate) / loserStats.positiveResponseRate * 100).toFixed(1);

    recommendation = `Variant ${winner} is performing better with ${confidenceLevel} confidence. ${improvement}% improvement in positive response rate. Consider using Variant ${winner} for all future messages.`;
  }

  return {
    variantA,
    variantB,
    winner,
    confidenceLevel,
    recommendation
  };
}

/**
 * Format variant stats for display
 */
export function formatVariantStats(stats: VariantStats): string {
  return `
Variant ${stats.variant} Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Sent:        ${stats.totalSent}
  Total Responses:   ${stats.totalResponses}
  Response Rate:     ${(stats.responseRate * 100).toFixed(1)}%

  Positive Responses: ${stats.positiveResponses}
  Positive Rate:      ${(stats.positiveResponseRate * 100).toFixed(1)}%

  Breakdown:
    - Interested:     ${stats.interestedResponses}
    - Booked:         ${stats.bookedResponses}
    - Neutral:        ${stats.neutralResponses}
    - Negative:       ${stats.negativeResponses}
  `.trim();
}

/**
 * Format comparison report
 */
export function formatComparison(comparison: VariantComparison): string {
  let report = `
A/B Test Results
${'='.repeat(50)}

${formatVariantStats(comparison.variantA)}

${formatVariantStats(comparison.variantB)}

${'='.repeat(50)}
`;

  if (comparison.winner) {
    report += `\n🏆 WINNER: Variant ${comparison.winner} (${comparison.confidenceLevel} confidence)\n`;
  } else {
    report += `\n⚖️  No clear winner yet\n`;
  }

  report += `\n💡 RECOMMENDATION:\n${comparison.recommendation}\n`;

  return report;
}
