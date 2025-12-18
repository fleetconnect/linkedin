import { PreMessageHook } from '../hooks/PreMessageHook';
import { MessageGenerationService } from '../services/MessageGenerationService';
import { StorageService } from '../services/StorageService';
import { Lead, Campaign, PreMessageHookContext } from '../types';

/**
 * Messaging Controller
 *
 * Orchestrates the message sending flow:
 * 1. Validate lead and campaign
 * 2. Execute pre-message hooks (including research)
 * 3. Generate personalized message
 * 4. Return message for sending
 */
export class MessagingController {
  private preMessageHook: PreMessageHook;
  private messageService: MessageGenerationService;
  private storageService: StorageService;

  constructor(
    preMessageHook: PreMessageHook,
    messageService: MessageGenerationService,
    storageService: StorageService
  ) {
    this.preMessageHook = preMessageHook;
    this.messageService = messageService;
    this.storageService = storageService;
  }

  /**
   * Prepare and generate a message for a lead
   */
  async prepareMessage(
    leadId: string,
    messageType: 'initial' | 'follow-up' | 'reply' = 'initial',
    customPrompt?: string
  ): Promise<{
    success: boolean;
    message?: string;
    hooksExecuted: boolean;
    researchPerformed: boolean;
    error?: string;
  }> {
    try {
      // Get lead
      const lead = await this.storageService.getLead(leadId);
      if (!lead) {
        return {
          success: false,
          error: `Lead not found: ${leadId}`,
          hooksExecuted: false,
          researchPerformed: false
        };
      }

      // Get campaign
      const campaign = lead.campaignId
        ? await this.storageService.getCampaign(lead.campaignId)
        : null;

      if (!campaign) {
        return {
          success: false,
          error: `Campaign not found for lead: ${leadId}`,
          hooksExecuted: false,
          researchPerformed: false
        };
      }

      console.log(`\n📨 Preparing ${messageType} message for ${lead.name} (${lead.company || 'Unknown Company'})`);
      console.log(`   Campaign: ${campaign.name}`);
      console.log(`   Lead State: ${lead.state}`);
      console.log(`   Personalization: ${campaign.messaging_rules.personalization ? 'Enabled' : 'Disabled'}`);

      // Execute pre-message hooks
      const hookContext: PreMessageHookContext = {
        lead,
        campaign,
        messageType
      };

      const hookResult = await this.preMessageHook.execute(hookContext);

      // Reload lead to get updated research snapshot
      const updatedLead = await this.storageService.getLead(leadId);

      if (!updatedLead) {
        return {
          success: false,
          error: 'Lead not found after hook execution',
          hooksExecuted: hookResult.success,
          researchPerformed: hookResult.data?.researchCompleted || false
        };
      }

      // Generate message
      console.log('\n✍️  Generating personalized message...');

      const message = await this.messageService.generateMessage(
        updatedLead,
        campaign,
        messageType,
        customPrompt
      );

      // Validate message
      const validation = this.messageService.validateMessage(message);

      if (!validation.valid) {
        console.warn(`⚠️  Message validation warnings:`);
        validation.issues.forEach(issue => console.warn(`   - ${issue}`));
      }

      console.log(`\n✅ Message generated successfully (${validation.wordCount} words)`);

      return {
        success: true,
        message,
        hooksExecuted: hookResult.success,
        researchPerformed: hookResult.data?.researchCompleted || false
      };

    } catch (error) {
      console.error('❌ Message preparation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hooksExecuted: false,
        researchPerformed: false
      };
    }
  }

  /**
   * Generate multiple message variations
   */
  async prepareMessageVariations(
    leadId: string,
    count: number = 3,
    messageType: 'initial' | 'follow-up' | 'reply' = 'initial'
  ): Promise<{
    success: boolean;
    messages?: string[];
    hooksExecuted: boolean;
    researchPerformed: boolean;
    error?: string;
  }> {
    try {
      // Get lead and execute hooks first
      const lead = await this.storageService.getLead(leadId);
      if (!lead) {
        return {
          success: false,
          error: `Lead not found: ${leadId}`,
          hooksExecuted: false,
          researchPerformed: false
        };
      }

      const campaign = lead.campaignId
        ? await this.storageService.getCampaign(lead.campaignId)
        : null;

      if (!campaign) {
        return {
          success: false,
          error: `Campaign not found for lead: ${leadId}`,
          hooksExecuted: false,
          researchPerformed: false
        };
      }

      // Execute hooks
      const hookContext: PreMessageHookContext = {
        lead,
        campaign,
        messageType
      };

      const hookResult = await this.preMessageHook.execute(hookContext);

      // Reload lead
      const updatedLead = await this.storageService.getLead(leadId);
      if (!updatedLead) {
        return {
          success: false,
          error: 'Lead not found after hook execution',
          hooksExecuted: hookResult.success,
          researchPerformed: hookResult.data?.researchCompleted || false
        };
      }

      // Generate variations
      console.log(`\n✍️  Generating ${count} message variations...\n`);

      const messages = await this.messageService.generateVariations(
        updatedLead,
        campaign,
        messageType,
        count
      );

      console.log(`✅ Generated ${messages.length} variations`);

      return {
        success: true,
        messages,
        hooksExecuted: hookResult.success,
        researchPerformed: hookResult.data?.researchCompleted || false
      };

    } catch (error) {
      console.error('❌ Message variation generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hooksExecuted: false,
        researchPerformed: false
      };
    }
  }

  /**
   * Get hook execution preview without executing
   */
  async previewHookExecution(leadId: string): Promise<string> {
    const lead = await this.storageService.getLead(leadId);
    if (!lead) {
      return 'Lead not found';
    }

    const campaign = lead.campaignId
      ? await this.storageService.getCampaign(lead.campaignId)
      : null;

    if (!campaign) {
      return 'Campaign not found';
    }

    const context: PreMessageHookContext = {
      lead,
      campaign,
      messageType: 'initial'
    };

    return this.preMessageHook.getHookSummary(context);
  }
}

export default MessagingController;
