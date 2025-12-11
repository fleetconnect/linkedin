/**
 * Feedback Loop
 * Implements continuous learning and optimization based on campaign outcomes
 */

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import type {
  FeedbackData,
  CampaignInsight,
  LearningModel,
  Pattern,
  Recommendation,
  Reply,
  ReplySentiment,
  ReplyIntent,
  InsightCategory,
} from '../../types/index.js';

export class FeedbackLoop {
  private anthropic: Anthropic;
  private feedbackData: Map<string, FeedbackData[]> = new Map();
  private insights: Map<string, CampaignInsight[]> = new Map();
  private learningModels: Map<string, LearningModel> = new Map();
  private replies: Map<string, Reply> = new Map();

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.api.anthropic.apiKey,
    });
  }

  /**
   * Record feedback data point
   */
  async recordFeedback(
    campaignId: string,
    metric: string,
    value: number,
    context: Record<string, any>
  ): Promise<void> {
    const feedback: FeedbackData = {
      id: uuidv4(),
      campaignId,
      messageId: context.messageId,
      metric,
      value,
      context,
      timestamp: new Date(),
    };

    const campaignFeedback = this.feedbackData.get(campaignId) || [];
    campaignFeedback.push(feedback);
    this.feedbackData.set(campaignId, campaignFeedback);

    logger.debug(`Recorded feedback for campaign ${campaignId}: ${metric}=${value}`);

    // Trigger learning update if we have enough data points
    if (campaignFeedback.length % 10 === 0) {
      await this.updateLearningModel(campaignId);
    }
  }

  /**
   * Tag and classify a reply
   */
  async tagReply(params: {
    replyId?: string;
    content: string;
    leadId: string;
    messageId?: string;
  }): Promise<Reply> {
    logger.info(`Classifying reply from lead ${params.leadId}`);

    const classification = await this.classifyReply(params.content);

    const reply: Reply = {
      id: params.replyId || uuidv4(),
      messageId: params.messageId || '',
      leadId: params.leadId,
      content: params.content,
      sentiment: classification.sentiment,
      intent: classification.intent,
      receivedAt: new Date(),
      tags: classification.tags,
      processedAt: new Date(),
    };

    this.replies.set(reply.id, reply);

    // Record feedback based on reply
    if (params.messageId) {
      await this.recordFeedback(
        '', // Would need campaignId from message
        'reply_sentiment',
        this.sentimentToScore(classification.sentiment),
        {
          messageId: params.messageId,
          leadId: params.leadId,
          sentiment: classification.sentiment,
          intent: classification.intent,
        }
      );
    }

    logger.info(`Reply classified: ${classification.sentiment} / ${classification.intent}`);
    return reply;
  }

  /**
   * Classify reply using AI
   */
  private async classifyReply(content: string): Promise<{
    sentiment: ReplySentiment;
    intent: ReplyIntent;
    tags: string[];
  }> {
    const prompt = `Analyze this reply to a cold outreach message and classify it.

Reply content:
"${content}"

Provide classification in JSON format:
{
  "sentiment": "positive|neutral|negative|unknown",
  "intent": "interested|book_demo|request_info|not_interested|wrong_person|unsubscribe|out_of_office|unknown",
  "tags": ["tag1", "tag2"],
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment as ReplySentiment,
          intent: parsed.intent as ReplyIntent,
          tags: parsed.tags || [],
        };
      }
    } catch (error) {
      logger.error('Failed to classify reply with AI', error);
    }

    // Fallback to rule-based classification
    return this.ruleBasedClassification(content);
  }

  /**
   * Rule-based reply classification fallback
   */
  private ruleBasedClassification(content: string): {
    sentiment: ReplySentiment;
    intent: ReplyIntent;
    tags: string[];
  } {
    const lower = content.toLowerCase();

    // Detect intent
    let intent = ReplyIntent.UNKNOWN;
    const tags: string[] = [];

    if (
      lower.includes('interested') ||
      lower.includes('tell me more') ||
      lower.includes('sounds good')
    ) {
      intent = ReplyIntent.INTERESTED;
      tags.push('positive_signal');
    } else if (
      lower.includes('schedule') ||
      lower.includes('call') ||
      lower.includes('meeting') ||
      lower.includes('demo')
    ) {
      intent = ReplyIntent.BOOK_DEMO;
      tags.push('high_intent');
    } else if (lower.includes('not interested') || lower.includes('no thank')) {
      intent = ReplyIntent.NOT_INTERESTED;
      tags.push('rejection');
    } else if (lower.includes('unsubscribe') || lower.includes('remove me')) {
      intent = ReplyIntent.UNSUBSCRIBE;
      tags.push('unsubscribe');
    } else if (lower.includes('out of office') || lower.includes('ooo')) {
      intent = ReplyIntent.OUT_OF_OFFICE;
      tags.push('auto_reply');
    } else if (lower.includes('wrong person') || lower.includes('not the right')) {
      intent = ReplyIntent.WRONG_PERSON;
      tags.push('targeting_issue');
    }

    // Detect sentiment
    let sentiment = ReplySentiment.NEUTRAL;
    if (intent === ReplyIntent.INTERESTED || intent === ReplyIntent.BOOK_DEMO) {
      sentiment = ReplySentiment.POSITIVE;
    } else if (
      intent === ReplyIntent.NOT_INTERESTED ||
      intent === ReplyIntent.UNSUBSCRIBE
    ) {
      sentiment = ReplySentiment.NEGATIVE;
    }

    return { sentiment, intent, tags };
  }

  /**
   * Get insights for a campaign
   */
  async getInsights(campaignId: string, timeframe?: string): Promise<CampaignInsight[]> {
    logger.info(`Generating insights for campaign ${campaignId}`);

    const campaignInsights = this.insights.get(campaignId) || [];

    // If we have recent insights, return them
    const recentInsights = campaignInsights.filter(
      (insight) =>
        Date.now() - insight.createdAt.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    if (recentInsights.length > 0) {
      return recentInsights;
    }

    // Generate new insights
    const feedbackData = this.feedbackData.get(campaignId) || [];
    if (feedbackData.length < 5) {
      return [
        {
          id: uuidv4(),
          campaignId,
          insight: 'Insufficient data for meaningful insights. Continue campaign to gather more data.',
          category: InsightCategory.MESSAGING,
          impact: 'low',
          actionable: false,
          createdAt: new Date(),
        },
      ];
    }

    const newInsights = await this.generateInsights(campaignId, feedbackData);
    this.insights.set(campaignId, [...campaignInsights, ...newInsights]);

    return newInsights;
  }

  /**
   * Generate insights using AI
   */
  private async generateInsights(
    campaignId: string,
    feedbackData: FeedbackData[]
  ): Promise<CampaignInsight[]> {
    const summary = this.summarizeFeedback(feedbackData);

    const prompt = `Analyze this campaign performance data and provide actionable insights.

Campaign Data Summary:
${JSON.stringify(summary, null, 2)}

Provide 3-5 insights in JSON array format:
[
  {
    "insight": "specific insight or finding",
    "category": "timing|messaging|channel|targeting|personalization",
    "impact": "high|medium|low",
    "actionable": true|false
  }
]`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          id: uuidv4(),
          campaignId,
          insight: item.insight,
          category: item.category as InsightCategory,
          impact: item.impact,
          actionable: item.actionable,
          createdAt: new Date(),
        }));
      }
    } catch (error) {
      logger.error('Failed to generate insights', error);
    }

    return [];
  }

  /**
   * Update learning model for a campaign
   */
  private async updateLearningModel(campaignId: string): Promise<void> {
    logger.info(`Updating learning model for campaign ${campaignId}`);

    const feedbackData = this.feedbackData.get(campaignId) || [];
    const patterns = this.detectPatterns(feedbackData);
    const recommendations = await this.generateRecommendations(campaignId, patterns);

    const model: LearningModel = {
      campaignId,
      patterns,
      recommendations,
      lastUpdated: new Date(),
    };

    this.learningModels.set(campaignId, model);
    logger.info(`Learning model updated for campaign ${campaignId}`);
  }

  /**
   * Detect patterns in feedback data
   */
  private detectPatterns(feedbackData: FeedbackData[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Analyze reply timing
    const replyTimings = feedbackData
      .filter((f) => f.metric === 'response_time_hours')
      .map((f) => f.value);

    if (replyTimings.length > 0) {
      const avgResponseTime =
        replyTimings.reduce((sum, t) => sum + t, 0) / replyTimings.length;

      patterns.push({
        type: 'timing',
        description: `Average response time is ${avgResponseTime.toFixed(1)} hours`,
        confidence: replyTimings.length > 10 ? 0.8 : 0.5,
        data: { avgResponseTime, sampleSize: replyTimings.length },
      });
    }

    // Analyze sentiment distribution
    const sentiments = feedbackData
      .filter((f) => f.metric === 'reply_sentiment')
      .map((f) => f.value);

    if (sentiments.length > 0) {
      const positiveRate =
        sentiments.filter((s) => s > 0.6).length / sentiments.length;

      patterns.push({
        type: 'engagement',
        description: `${(positiveRate * 100).toFixed(1)}% positive sentiment rate`,
        confidence: sentiments.length > 20 ? 0.9 : 0.6,
        data: { positiveRate, sampleSize: sentiments.length },
      });
    }

    return patterns;
  }

  /**
   * Generate recommendations based on patterns
   */
  private async generateRecommendations(
    campaignId: string,
    patterns: Pattern[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const pattern of patterns) {
      if (pattern.type === 'timing' && pattern.data.avgResponseTime > 48) {
        recommendations.push({
          type: 'timing',
          description: 'Consider increasing follow-up delay to match prospect response patterns',
          priority: 'medium',
          expectedImpact: 'Could improve response rates by 10-15%',
        });
      }

      if (pattern.type === 'engagement' && pattern.data.positiveRate < 0.3) {
        recommendations.push({
          type: 'messaging',
          description: 'Low positive sentiment - review and improve message personalization',
          priority: 'high',
          expectedImpact: 'Could significantly improve engagement',
        });
      }
    }

    return recommendations;
  }

  /**
   * Summarize feedback data
   */
  private summarizeFeedback(feedbackData: FeedbackData[]): any {
    const summary: any = {
      totalDataPoints: feedbackData.length,
      metrics: {},
    };

    for (const feedback of feedbackData) {
      if (!summary.metrics[feedback.metric]) {
        summary.metrics[feedback.metric] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
          values: [],
        };
      }

      const metric = summary.metrics[feedback.metric];
      metric.count++;
      metric.values.push(feedback.value);
      metric.min = Math.min(metric.min, feedback.value);
      metric.max = Math.max(metric.max, feedback.value);
    }

    // Calculate averages
    for (const metric of Object.values(summary.metrics) as any[]) {
      metric.avg = metric.values.reduce((sum: number, v: number) => sum + v, 0) / metric.count;
      delete metric.values; // Remove raw values from summary
    }

    return summary;
  }

  /**
   * Convert sentiment to numerical score
   */
  private sentimentToScore(sentiment: ReplySentiment): number {
    switch (sentiment) {
      case ReplySentiment.POSITIVE:
        return 1.0;
      case ReplySentiment.NEUTRAL:
        return 0.5;
      case ReplySentiment.NEGATIVE:
        return 0.0;
      default:
        return 0.5;
    }
  }

  /**
   * Get learning model for a campaign
   */
  getLearningModel(campaignId: string): LearningModel | undefined {
    return this.learningModels.get(campaignId);
  }

  /**
   * Get all replies
   */
  getReplies(): Reply[] {
    return Array.from(this.replies.values());
  }

  /**
   * Get reply by ID
   */
  getReply(replyId: string): Reply | undefined {
    return this.replies.get(replyId);
  }
}
