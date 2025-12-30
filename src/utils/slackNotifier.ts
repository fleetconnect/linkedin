/**
 * Slack Notification Utility
 * Sends alerts to Slack when critical events occur
 */

import observability, { LogLevel, LogCategory } from '../services/ObservabilityService';

export interface SlackAlertPayload {
  leadId: string;
  leadName: string;
  campaignId?: string;
  reason: string;
  messageContent?: string;
  errorCount?: number;
  warningCount?: number;
  validationErrors?: any[];
}

/**
 * Send message validation failure alert to Slack
 */
export async function sendValidationFailAlert(payload: SlackAlertPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    observability.log(
      LogLevel.WARN,
      LogCategory.API,
      'Slack webhook URL not configured - skipping alert',
      { leadId: payload.leadId }
    );
    return;
  }

  try {
    const message = formatValidationFailMessage(payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        // Slack-specific formatting
        attachments: [
          {
            color: 'danger',
            fields: [
              {
                title: 'Lead',
                value: `${payload.leadName} (${payload.leadId})`,
                short: true
              },
              {
                title: 'Campaign',
                value: payload.campaignId || 'N/A',
                short: true
              },
              {
                title: 'Error Count',
                value: `${payload.errorCount || 0}`,
                short: true
              },
              {
                title: 'Warning Count',
                value: `${payload.warningCount || 0}`,
                short: true
              }
            ],
            text: `*Reason:*\n${payload.reason}\n\n*Generated Message:*\n"${payload.messageContent?.substring(0, 200)}${(payload.messageContent?.length || 0) > 200 ? '...' : ''}"`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Slack API returned ${response.status}: ${await response.text()}`);
    }

    observability.log(
      LogLevel.INFO,
      LogCategory.API,
      'Slack alert sent successfully',
      { leadId: payload.leadId, type: 'validation_fail' }
    );

  } catch (error) {
    observability.log(
      LogLevel.ERROR,
      LogCategory.API,
      'Failed to send Slack alert',
      {
        leadId: payload.leadId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );
    // Don't throw - we don't want Slack failures to break the API
  }
}

/**
 * Format validation failure message for Slack
 */
function formatValidationFailMessage(payload: SlackAlertPayload): string {
  return `🚨 *MESSAGE VALIDATION FAILED*

Lead: ${payload.leadName}
Lead ID: ${payload.leadId}
Campaign: ${payload.campaignId || 'N/A'}

This message was NOT sent (state set to LOST).`;
}

/**
 * Send generic alert to Slack
 */
export async function sendSlackAlert(message: string, metadata?: Record<string, any>): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    observability.log(
      LogLevel.WARN,
      LogCategory.API,
      'Slack webhook URL not configured - skipping alert',
      metadata
    );
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      })
    });

    if (!response.ok) {
      throw new Error(`Slack API returned ${response.status}: ${await response.text()}`);
    }

    observability.log(
      LogLevel.INFO,
      LogCategory.API,
      'Slack alert sent successfully',
      metadata
    );

  } catch (error) {
    observability.log(
      LogLevel.ERROR,
      LogCategory.API,
      'Failed to send Slack alert',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        ...metadata
      }
    );
  }
}
