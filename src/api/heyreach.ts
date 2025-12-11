/**
 * HeyReach API Client
 * Handles all interactions with the HeyReach platform
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import type {
  HeyReachAccount,
  HeyReachCampaign,
  HeyReachMessage,
  Lead,
  Message,
  Channel,
} from '../types/index.js';

interface HeyReachConfig {
  apiKey: string;
  baseUrl: string;
}

export class HeyReachClient {
  private client: AxiosInstance;
  private config: HeyReachConfig;

  constructor(config: HeyReachConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('HeyReach API response', {
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error) => {
        logger.error('HeyReach API error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        throw error;
      }
    );
  }

  // ============================================================================
  // Account Management
  // ============================================================================

  async getAccounts(): Promise<HeyReachAccount[]> {
    try {
      const response = await this.client.get('/accounts');
      return response.data.accounts || [];
    } catch (error) {
      logger.error('Failed to get accounts', error);
      throw new Error('Failed to fetch HeyReach accounts');
    }
  }

  async getAccount(accountId: string): Promise<HeyReachAccount> {
    try {
      const response = await this.client.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get account ${accountId}`, error);
      throw new Error(`Failed to fetch account ${accountId}`);
    }
  }

  async getAccountUsage(accountId: string): Promise<any> {
    try {
      const response = await this.client.get(`/accounts/${accountId}/usage`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get account usage for ${accountId}`, error);
      throw new Error(`Failed to fetch account usage`);
    }
  }

  // ============================================================================
  // Campaign Management
  // ============================================================================

  async getCampaigns(): Promise<HeyReachCampaign[]> {
    try {
      const response = await this.client.get('/campaigns');
      return response.data.campaigns || [];
    } catch (error) {
      logger.error('Failed to get campaigns', error);
      throw new Error('Failed to fetch campaigns');
    }
  }

  async getCampaign(campaignId: string): Promise<HeyReachCampaign> {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get campaign ${campaignId}`, error);
      throw new Error(`Failed to fetch campaign ${campaignId}`);
    }
  }

  async createCampaign(campaign: {
    name: string;
    settings?: any;
  }): Promise<HeyReachCampaign> {
    try {
      const response = await this.client.post('/campaigns', campaign);
      logger.info(`Created campaign: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to create campaign', error);
      throw new Error('Failed to create campaign');
    }
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.client.post(`/campaigns/${campaignId}/pause`);
      logger.info(`Paused campaign: ${campaignId}`);
    } catch (error) {
      logger.error(`Failed to pause campaign ${campaignId}`, error);
      throw new Error(`Failed to pause campaign`);
    }
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await this.client.post(`/campaigns/${campaignId}/resume`);
      logger.info(`Resumed campaign: ${campaignId}`);
    } catch (error) {
      logger.error(`Failed to resume campaign ${campaignId}`, error);
      throw new Error(`Failed to resume campaign`);
    }
  }

  // ============================================================================
  // Lead Management
  // ============================================================================

  async addLeadsToCampaign(
    campaignId: string,
    leads: Partial<Lead>[]
  ): Promise<{ added: number; failed: number; errors: string[] }> {
    try {
      const response = await this.client.post(`/campaigns/${campaignId}/leads`, {
        leads,
      });
      logger.info(`Added ${response.data.added} leads to campaign ${campaignId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to add leads to campaign ${campaignId}`, error);
      throw new Error('Failed to add leads to campaign');
    }
  }

  async getLeadStatus(campaignId: string, leadId: string): Promise<any> {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}/leads/${leadId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get lead status for ${leadId}`, error);
      throw new Error('Failed to get lead status');
    }
  }

  async removeLeadFromCampaign(campaignId: string, leadId: string): Promise<void> {
    try {
      await this.client.delete(`/campaigns/${campaignId}/leads/${leadId}`);
      logger.info(`Removed lead ${leadId} from campaign ${campaignId}`);
    } catch (error) {
      logger.error(`Failed to remove lead ${leadId}`, error);
      throw new Error('Failed to remove lead from campaign');
    }
  }

  // ============================================================================
  // Message Operations
  // ============================================================================

  async sendMessage(params: {
    campaignId: string;
    leadId: string;
    content: string;
    subject?: string;
    channel: Channel;
    accountId?: string;
  }): Promise<HeyReachMessage> {
    try {
      const response = await this.client.post('/messages/send', {
        campaignId: params.campaignId,
        leadId: params.leadId,
        content: params.content,
        subject: params.subject,
        channel: params.channel,
        accountId: params.accountId,
      });

      logger.info(`Sent message via ${params.channel} to lead ${params.leadId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send message to lead ${params.leadId}`, error);
      throw new Error('Failed to send message');
    }
  }

  async sendConnectionRequest(params: {
    campaignId: string;
    leadId: string;
    message?: string;
    accountId?: string;
  }): Promise<HeyReachMessage> {
    try {
      const response = await this.client.post('/linkedin/connection-request', {
        campaignId: params.campaignId,
        leadId: params.leadId,
        message: params.message,
        accountId: params.accountId,
      });

      logger.info(`Sent LinkedIn connection request to lead ${params.leadId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to send connection request to ${params.leadId}`, error);
      throw new Error('Failed to send connection request');
    }
  }

  async getMessages(campaignId: string, leadId?: string): Promise<HeyReachMessage[]> {
    try {
      const params = leadId ? { leadId } : {};
      const response = await this.client.get(`/campaigns/${campaignId}/messages`, { params });
      return response.data.messages || [];
    } catch (error) {
      logger.error('Failed to get messages', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async getMessageById(messageId: string): Promise<HeyReachMessage> {
    try {
      const response = await this.client.get(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get message ${messageId}`, error);
      throw new Error('Failed to fetch message');
    }
  }

  // ============================================================================
  // Reply Handling
  // ============================================================================

  async getReplies(campaignId: string, since?: Date): Promise<any[]> {
    try {
      const params = since ? { since: since.toISOString() } : {};
      const response = await this.client.get(`/campaigns/${campaignId}/replies`, { params });
      return response.data.replies || [];
    } catch (error) {
      logger.error('Failed to get replies', error);
      throw new Error('Failed to fetch replies');
    }
  }

  async tagReply(replyId: string, tags: string[]): Promise<void> {
    try {
      await this.client.post(`/replies/${replyId}/tags`, { tags });
      logger.info(`Tagged reply ${replyId} with: ${tags.join(', ')}`);
    } catch (error) {
      logger.error(`Failed to tag reply ${replyId}`, error);
      throw new Error('Failed to tag reply');
    }
  }

  // ============================================================================
  // Analytics & Metrics
  // ============================================================================

  async getCampaignMetrics(campaignId: string, timeframe?: string): Promise<any> {
    try {
      const params = timeframe ? { timeframe } : {};
      const response = await this.client.get(`/campaigns/${campaignId}/metrics`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get metrics for campaign ${campaignId}`, error);
      throw new Error('Failed to fetch campaign metrics');
    }
  }

  async getAccountMetrics(accountId: string, timeframe?: string): Promise<any> {
    try {
      const params = timeframe ? { timeframe } : {};
      const response = await this.client.get(`/accounts/${accountId}/metrics`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get metrics for account ${accountId}`, error);
      throw new Error('Failed to fetch account metrics');
    }
  }

  // ============================================================================
  // Webhook Management
  // ============================================================================

  async registerWebhook(params: {
    url: string;
    events: string[];
    campaignId?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/webhooks', params);
      logger.info(`Registered webhook for events: ${params.events.join(', ')}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to register webhook', error);
      throw new Error('Failed to register webhook');
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.client.delete(`/webhooks/${webhookId}`);
      logger.info(`Deleted webhook: ${webhookId}`);
    } catch (error) {
      logger.error(`Failed to delete webhook ${webhookId}`, error);
      throw new Error('Failed to delete webhook');
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Health check failed', error);
      return false;
    }
  }
}
