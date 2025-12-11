/**
 * Campaign Orchestrator
 * Manages campaign execution, sequencing, and multi-channel coordination
 */

import { v4 as uuidv4 } from 'uuid';
import { HeyReachClient } from '../../api/heyreach.js';
import { PersonalizationEngine } from '../personalization/engine.js';
import { logger } from '../../utils/logger.js';
import type {
  Campaign,
  CampaignStatus,
  Sequence,
  SequenceStep,
  Message,
  MessageStatus,
  Lead,
  Channel,
  CampaignMetrics,
} from '../../types/index.js';

export class CampaignOrchestrator {
  private campaigns: Map<string, Campaign> = new Map();
  private messages: Map<string, Message> = new Map();
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private heyReachClient: HeyReachClient,
    private personalizationEngine: PersonalizationEngine
  ) {}

  /**
   * Create a new campaign
   */
  async createCampaign(params: {
    name: string;
    icpCriteria: any;
    sequences: Partial<Sequence>[];
    settings: any;
  }): Promise<Campaign> {
    logger.info(`Creating campaign: ${params.name}`);

    const campaign: Campaign = {
      id: uuidv4(),
      name: params.name,
      icpCriteria: params.icpCriteria,
      sequences: params.sequences.map((seq, index) => ({
        id: seq.id || uuidv4(),
        campaignId: '',
        steps: seq.steps || [],
        channel: seq.channel || Channel.LINKEDIN_MESSAGE,
        name: seq.name || `Sequence ${index + 1}`,
      })),
      status: CampaignStatus.DRAFT,
      metrics: this.initializeMetrics(),
      settings: {
        dailyLimit: params.settings.dailyLimit || 50,
        messageDelaySeconds: params.settings.messageDelaySeconds || 120,
        autoFollowUp: params.settings.autoFollowUp !== false,
        autoTagging: params.settings.autoTagging !== false,
        autoSend: params.settings.autoSend === true,
        safeguards: params.settings.safeguards || {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Set campaign ID for sequences
    campaign.sequences.forEach(seq => {
      seq.campaignId = campaign.id;
    });

    // Create campaign in HeyReach
    try {
      await this.heyReachClient.createCampaign({
        name: campaign.name,
        settings: campaign.settings,
      });
    } catch (error) {
      logger.error('Failed to create campaign in HeyReach', error);
    }

    this.campaigns.set(campaign.id, campaign);
    logger.info(`Campaign created: ${campaign.id}`);

    return campaign;
  }

  /**
   * Start a campaign
   */
  async startCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    campaign.status = CampaignStatus.ACTIVE;
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);
    logger.info(`Campaign started: ${campaignId}`);

    // Start processing sequences
    await this.processSequences(campaignId);
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(
    campaignId: string,
    leadId?: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    logger.info(`Pausing campaign ${campaignId}${leadId ? ` for lead ${leadId}` : ''}`, {
      reason,
    });

    if (leadId) {
      // Pause campaign for specific lead only
      // Implementation would mark the lead as paused in the campaign
      return {
        success: true,
        message: `Campaign paused for lead ${leadId}`,
      };
    }

    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return {
        success: false,
        message: `Campaign not found: ${campaignId}`,
      };
    }

    campaign.status = CampaignStatus.PAUSED;
    campaign.updatedAt = new Date();
    this.campaigns.set(campaignId, campaign);

    // Cancel scheduled tasks for this campaign
    this.cancelScheduledTasks(campaignId);

    // Pause in HeyReach
    try {
      await this.heyReachClient.pauseCampaign(campaignId);
    } catch (error) {
      logger.error('Failed to pause campaign in HeyReach', error);
    }

    return {
      success: true,
      message: `Campaign ${campaignId} paused`,
    };
  }

  /**
   * Get campaign status and metrics
   */
  async getCampaignStatus(campaignId: string): Promise<{
    campaign: Campaign;
    metrics: CampaignMetrics;
    recentActivity: any[];
  }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Fetch latest metrics from HeyReach
    try {
      const metrics = await this.heyReachClient.getCampaignMetrics(campaignId);
      campaign.metrics = this.mergeMetrics(campaign.metrics, metrics);
    } catch (error) {
      logger.error('Failed to fetch campaign metrics', error);
    }

    const recentActivity = await this.getRecentActivity(campaignId);

    return {
      campaign,
      metrics: campaign.metrics,
      recentActivity,
    };
  }

  /**
   * Send a message
   */
  async sendMessage(params: {
    leadId: string;
    campaignId: string;
    content: string;
    subject?: string;
    channel: Channel;
    messageId?: string;
  }): Promise<Message> {
    logger.info(`Sending message to lead ${params.leadId} via ${params.channel}`);

    const message: Message = {
      id: params.messageId || uuidv4(),
      leadId: params.leadId,
      campaignId: params.campaignId,
      sequenceId: '',
      stepId: '',
      channel: params.channel,
      content: params.content,
      subject: params.subject,
      status: MessageStatus.QUEUED,
      metadata: {},
    };

    this.messages.set(message.id, message);

    try {
      // Send via HeyReach
      const result = await this.heyReachClient.sendMessage({
        campaignId: params.campaignId,
        leadId: params.leadId,
        content: params.content,
        subject: params.subject,
        channel: params.channel,
      });

      message.status = MessageStatus.SENT;
      message.sentAt = new Date();
      message.metadata = { heyReachMessageId: result.id };

      this.messages.set(message.id, message);
      logger.info(`Message sent successfully: ${message.id}`);

      // Update campaign metrics
      await this.updateMetrics(params.campaignId, { contacted: 1 });
    } catch (error) {
      logger.error(`Failed to send message ${message.id}`, error);
      message.status = MessageStatus.FAILED;
      this.messages.set(message.id, message);
      throw error;
    }

    return message;
  }

  /**
   * Schedule a follow-up message
   */
  async scheduleFollowup(params: {
    leadId: string;
    campaignId: string;
    delayHours: number;
    messageTemplate?: string;
    stepId?: string;
  }): Promise<{ scheduled: boolean; executeAt: Date }> {
    logger.info(
      `Scheduling follow-up for lead ${params.leadId} in ${params.delayHours} hours`
    );

    const executeAt = new Date(Date.now() + params.delayHours * 60 * 60 * 1000);

    const taskId = `${params.campaignId}-${params.leadId}-${Date.now()}`;

    const timeout = setTimeout(async () => {
      try {
        // Generate and send follow-up message
        const message = await this.personalizationEngine.generateMessage({
          leadId: params.leadId,
          campaignId: params.campaignId,
        });

        await this.sendMessage({
          leadId: params.leadId,
          campaignId: params.campaignId,
          content: message.content,
          subject: message.subject,
          channel: Channel.LINKEDIN_MESSAGE,
        });

        this.scheduledTasks.delete(taskId);
      } catch (error) {
        logger.error('Failed to execute scheduled follow-up', error);
      }
    }, params.delayHours * 60 * 60 * 1000);

    this.scheduledTasks.set(taskId, timeout);

    return {
      scheduled: true,
      executeAt,
    };
  }

  /**
   * Process campaign sequences
   */
  private async processSequences(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return;
    }

    logger.info(`Processing sequences for campaign ${campaignId}`);

    for (const sequence of campaign.sequences) {
      for (const step of sequence.steps) {
        // Process each step
        // This would typically be done in a queue/worker system
        logger.debug(`Processing step ${step.stepNumber} for sequence ${sequence.id}`);
      }
    }
  }

  /**
   * Get recent activity for a campaign
   */
  private async getRecentActivity(campaignId: string): Promise<any[]> {
    const campaignMessages = Array.from(this.messages.values()).filter(
      m => m.campaignId === campaignId
    );

    return campaignMessages
      .sort((a, b) => {
        const dateA = a.sentAt || a.metadata?.createdAt || new Date(0);
        const dateB = b.sentAt || b.metadata?.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50)
      .map(m => ({
        type: 'message',
        messageId: m.id,
        leadId: m.leadId,
        channel: m.channel,
        status: m.status,
        timestamp: m.sentAt,
      }));
  }

  /**
   * Initialize campaign metrics
   */
  private initializeMetrics(): CampaignMetrics {
    return {
      totalLeads: 0,
      contacted: 0,
      replied: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      bounced: 0,
      conversionRate: 0,
      replyRate: 0,
      averageResponseTimeHours: 0,
    };
  }

  /**
   * Merge metrics from external source
   */
  private mergeMetrics(
    current: CampaignMetrics,
    external: any
  ): CampaignMetrics {
    return {
      ...current,
      ...external,
      replyRate:
        current.contacted > 0 ? (current.replied / current.contacted) * 100 : 0,
      conversionRate:
        current.contacted > 0 ? (current.positive / current.contacted) * 100 : 0,
    };
  }

  /**
   * Update campaign metrics
   */
  private async updateMetrics(
    campaignId: string,
    updates: Partial<CampaignMetrics>
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return;
    }

    campaign.metrics = {
      ...campaign.metrics,
      ...updates,
    };

    this.campaigns.set(campaignId, campaign);
  }

  /**
   * Cancel all scheduled tasks for a campaign
   */
  private cancelScheduledTasks(campaignId: string): void {
    for (const [taskId, timeout] of this.scheduledTasks.entries()) {
      if (taskId.startsWith(campaignId)) {
        clearTimeout(timeout);
        this.scheduledTasks.delete(taskId);
      }
    }
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): Campaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Get all campaigns
   */
  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }
}
