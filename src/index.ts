/**
 * AI Outreach Agent - Main Entry Point
 */

import { HeyReachClient } from './api/heyreach.js';
import { LeadManager } from './core/leads/manager.js';
import { PersonalizationEngine } from './core/personalization/engine.js';
import { CampaignOrchestrator } from './core/campaigns/orchestrator.js';
import { FeedbackLoop } from './core/feedback/loop.js';
import { SafetyGuard } from './core/safety/guard.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import type { Campaign, Lead } from './types/index.js';

export class AIOutreachAgent {
  private heyReachClient: HeyReachClient;
  private leadManager: LeadManager;
  private personalizationEngine: PersonalizationEngine;
  private campaignOrchestrator: CampaignOrchestrator;
  private feedbackLoop: FeedbackLoop;
  private safetyGuard: SafetyGuard;

  constructor() {
    logger.info('Initializing AI Outreach Agent');

    this.heyReachClient = new HeyReachClient(config.api.heyReach);
    this.leadManager = new LeadManager();
    this.personalizationEngine = new PersonalizationEngine();
    this.campaignOrchestrator = new CampaignOrchestrator(
      this.heyReachClient,
      this.personalizationEngine
    );
    this.feedbackLoop = new FeedbackLoop();
    this.safetyGuard = new SafetyGuard(config.limits);

    logger.info('AI Outreach Agent initialized successfully');
  }

  /**
   * Run a complete outreach workflow
   */
  async runWorkflow(params: {
    leads: Partial<Lead>[];
    campaignConfig: any;
  }): Promise<Campaign> {
    logger.info('Starting outreach workflow');

    try {
      // Step 1: Import and validate leads
      logger.info('Step 1: Importing leads');
      const importResult = await this.leadManager.importLeads(
        'api',
        params.leads
      );
      logger.info(`Imported ${importResult.imported} leads`);

      // Step 2: Validate leads against ICP
      logger.info('Step 2: Validating leads');
      const leadIds = this.leadManager.getAllLeads().map(l => l.id);
      const validationResults = await this.leadManager.validateLeads(
        leadIds,
        params.campaignConfig.icpCriteria
      );

      const validLeads = validationResults.filter(r => r.isValid);
      logger.info(`${validLeads.length} of ${leadIds.length} leads validated`);

      // Step 3: Create campaign
      logger.info('Step 3: Creating campaign');
      const campaign = await this.campaignOrchestrator.createCampaign({
        name: params.campaignConfig.name,
        icpCriteria: params.campaignConfig.icpCriteria,
        sequences: params.campaignConfig.sequences || [],
        settings: params.campaignConfig.settings || {},
      });

      logger.info(`Campaign created: ${campaign.id}`);

      // Step 4: Generate personalized messages for each lead
      logger.info('Step 4: Generating personalized messages');
      for (const validationResult of validLeads.slice(0, 5)) { // Demo: first 5 leads
        const lead = validationResult.lead;

        // Safety check
        const safetyCheck = await this.safetyGuard.checkAction('linkedin_message');
        if (!safetyCheck.allowed) {
          logger.warn(`Safety check failed: ${safetyCheck.reason}`);
          if (safetyCheck.suggestedDelay) {
            await this.delay(safetyCheck.suggestedDelay * 1000);
          }
          continue;
        }

        // Generate message
        const message = await this.personalizationEngine.generateMessage({
          leadId: lead.id,
          campaignId: campaign.id,
        });

        logger.info(`Generated message for ${lead.firstName} ${lead.lastName}`);

        // Validate message content
        const messageValidation = this.safetyGuard.validateMessage(message.content);
        if (!messageValidation.valid) {
          logger.warn(`Message validation failed: ${messageValidation.issues.join(', ')}`);
          continue;
        }

        if (messageValidation.warnings.length > 0) {
          logger.warn(`Message warnings: ${messageValidation.warnings.join(', ')}`);
        }

        // Send or queue message based on config
        if (config.features.autoSend) {
          await this.campaignOrchestrator.sendMessage({
            leadId: lead.id,
            campaignId: campaign.id,
            content: message.content,
            subject: message.subject,
            channel: 'linkedin_message' as any,
          });

          logger.info(`Message sent to ${lead.firstName} ${lead.lastName}`);
        } else {
          logger.info(`Message queued for manual approval: ${lead.firstName} ${lead.lastName}`);
        }

        // Add delay between messages
        const delay = this.safetyGuard.getRandomDelay(config.campaigns.messageRateLimitSeconds);
        await this.delay(delay * 1000);
      }

      // Step 5: Start campaign
      logger.info('Step 5: Starting campaign');
      await this.campaignOrchestrator.startCampaign(campaign.id);

      logger.info('Workflow completed successfully');
      return campaign;
    } catch (error) {
      logger.error('Workflow failed', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    healthy: boolean;
    components: Record<string, boolean>;
    campaigns: number;
    leads: number;
  }> {
    const heyReachHealthy = await this.heyReachClient.healthCheck();

    return {
      healthy: heyReachHealthy,
      components: {
        heyreach: heyReachHealthy,
        leads: true,
        personalization: true,
        campaigns: true,
        feedback: true,
        safety: true,
      },
      campaigns: this.campaignOrchestrator.getAllCampaigns().length,
      leads: this.leadManager.getAllLeads().length,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Expose components for direct access
  get leads() {
    return this.leadManager;
  }

  get campaigns() {
    return this.campaignOrchestrator;
  }

  get personalization() {
    return this.personalizationEngine;
  }

  get feedback() {
    return this.feedbackLoop;
  }

  get safety() {
    return this.safetyGuard;
  }
}

// Export for CLI/programmatic usage
export * from './types/index.js';
export { HeyReachClient } from './api/heyreach.js';
export { LeadManager } from './core/leads/manager.js';
export { PersonalizationEngine } from './core/personalization/engine.js';
export { CampaignOrchestrator } from './core/campaigns/orchestrator.js';
export { FeedbackLoop } from './core/feedback/loop.js';
export { SafetyGuard } from './core/safety/guard.js';

// Example usage (commented out)
/*
async function main() {
  const agent = new AIOutreachAgent();

  const status = await agent.getStatus();
  console.log('System Status:', status);

  // Run workflow
  await agent.runWorkflow({
    leads: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        title: 'VP of Sales',
        company: 'TechCorp',
      },
    ],
    campaignConfig: {
      name: 'Demo Campaign',
      icpCriteria: {
        titles: ['VP', 'Director', 'Head of'],
        companySize: { min: 50, max: 500 },
      },
      settings: {
        dailyLimit: 50,
      },
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
*/
