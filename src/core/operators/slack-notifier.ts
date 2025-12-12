/**
 * Slack Notifier for Operators
 * Sends formatted notifications to operator Slack channels
 */

import { logger } from '../../utils/logger.js';

export interface SlackNotification {
  channel: string;
  type: 'positive_reply' | 'safety_alert' | 'approval_needed' | 'system_error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  client_id: string;
  data: Record<string, any>;
}

export interface PositiveReplyNotification {
  lead_name: string;
  company: string;
  reply_text: string;
  intent: string;
  sentiment: string;
  draft_reply: string;
  confidence: number;
  thread_url?: string;
}

export class SlackNotifier {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL || '';
  }

  /**
   * Send positive reply notification for operator approval
   */
  async notifyPositiveReply(params: {
    client_id: string;
    channel: string;
    reply: PositiveReplyNotification;
  }): Promise<void> {
    const { client_id, channel, reply } = params;

    const message = this.formatPositiveReply(client_id, reply);

    await this.send({
      channel,
      type: 'positive_reply',
      priority: 'medium',
      client_id,
      data: { message },
    });
  }

  /**
   * Send safety alert to operator
   */
  async notifySafetyAlert(params: {
    client_id: string;
    channel: string;
    alert_type: string;
    details: string;
    severity: 'warning' | 'critical';
  }): Promise<void> {
    const { client_id, channel, alert_type, details, severity } = params;

    const emoji = severity === 'critical' ? '🚨' : '⚠️';
    const message = {
      text: `${emoji} **SAFETY ALERT** - ${client_id.toUpperCase()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Safety Alert: ${alert_type}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Client:*\n${client_id}`,
            },
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${severity.toUpperCase()}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:*\n${details}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Action Required:*\n${
              severity === 'critical'
                ? '⛔ PAUSE ALL APPROVALS. Escalate to manager immediately.'
                : '⚠️ Review and escalate if pattern continues.'
            }`,
          },
        },
      ],
    };

    await this.send({
      channel,
      type: 'safety_alert',
      priority: severity === 'critical' ? 'critical' : 'high',
      client_id,
      data: { message },
    });
  }

  /**
   * Send weekly summary report
   */
  async notifyWeeklySummary(params: {
    client_id: string;
    channel: string;
    week_start: string;
    week_end: string;
    metrics: {
      positive_replies: number;
      approved_sent: number;
      manual_followup: number;
      dismissed: number;
      meeting_booked?: number;
    };
    issues: string[];
  }): Promise<void> {
    const { client_id, channel, week_start, week_end, metrics, issues } = params;

    const total = metrics.positive_replies;
    const approvalRate = total > 0 ? ((metrics.approved_sent / total) * 100).toFixed(0) : '0';

    const message = {
      text: `📊 Weekly Summary: ${client_id}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 Weekly Summary: ${client_id.toUpperCase()}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Week:* ${week_start} to ${week_end}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Positive Replies:*\n${metrics.positive_replies}`,
            },
            {
              type: 'mrkdwn',
              text: `*Approved & Sent:*\n${metrics.approved_sent}`,
            },
            {
              type: 'mrkdwn',
              text: `*Manual Follow-up:*\n${metrics.manual_followup}`,
            },
            {
              type: 'mrkdwn',
              text: `*Dismissed:*\n${metrics.dismissed}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Approval Rate:* ${approvalRate}%${
              metrics.meeting_booked ? `\n*Meetings Booked:* ${metrics.meeting_booked}` : ''
            }`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Issues:*\n${
              issues.length > 0 ? issues.map((i) => `• ${i}`).join('\n') : 'None'
            }`,
          },
        },
      ],
    };

    await this.send({
      channel,
      type: 'approval_needed',
      priority: 'low',
      client_id,
      data: { message },
    });
  }

  /**
   * Format positive reply notification
   */
  private formatPositiveReply(
    client_id: string,
    reply: PositiveReplyNotification
  ): any {
    const confidenceEmoji = reply.confidence >= 0.8 ? '🟢' : reply.confidence >= 0.6 ? '🟡' : '🔴';
    const intentEmoji = this.getIntentEmoji(reply.intent);

    return {
      text: `🔥 Positive Reply - ${reply.lead_name} @ ${reply.company}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🔥 Positive Reply Detected`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Client:*\n${client_id}`,
            },
            {
              type: 'mrkdwn',
              text: `*Lead:*\n${reply.lead_name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Company:*\n${reply.company}`,
            },
            {
              type: 'mrkdwn',
              text: `*Intent:*\n${intentEmoji} ${reply.intent}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Their Reply:*\n"${reply.reply_text}"`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*AI Draft Reply:*\n"${reply.draft_reply}"`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Classification:*\n${confidenceEmoji} Confidence: ${(reply.confidence * 100).toFixed(0)}% | Sentiment: ${reply.sentiment}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Approve & Send',
              },
              style: 'primary',
              value: 'approve',
              action_id: 'approve_send',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✏️ Approve with Edit',
              },
              value: 'edit',
              action_id: 'approve_edit',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '⛔ Send Manually',
              },
              style: 'danger',
              value: 'manual',
              action_id: 'send_manual',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ Dismiss',
              },
              value: 'dismiss',
              action_id: 'dismiss',
            },
          ],
        },
      ],
    };
  }

  /**
   * Get emoji for intent
   */
  private getIntentEmoji(intent: string): string {
    const emojiMap: Record<string, string> = {
      interested: '🎯',
      timing: '⏰',
      question: '❓',
      objection: '🤔',
      not_interested: '❌',
      unsubscribe: '🛑',
    };
    return emojiMap[intent] || '📝';
  }

  /**
   * Send notification to Slack
   */
  private async send(notification: SlackNotification): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Slack webhook URL not configured', {
        notification_type: notification.type,
      });
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification.data.message),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      logger.info('Slack notification sent', {
        type: notification.type,
        priority: notification.priority,
        client_id: notification.client_id,
      });
    } catch (error) {
      logger.error('Failed to send Slack notification', {
        error,
        notification_type: notification.type,
      });
    }
  }
}
