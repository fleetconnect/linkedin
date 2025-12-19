import { MessageGenerationService } from '../services/MessageGenerationService';
import { StorageService } from '../services/StorageService';
import {
  Lead,
  Campaign,
  Intent,
  Message,
  IntentClassification
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Draft Follow-Up Tool
 *
 * Generates follow-up messages for leads based on their reply intent.
 *
 * Rules:
 * - Only generates for: interested | neutral
 * - Never generates for: negative | booked
 * - Writes to lead.conversationHistory (lead.messages[])
 * - Uses conversation context for personalization
 */
export class DraftFollowupTool {
  private messageService: MessageGenerationService;
  private storageService: StorageService;

  constructor(messageService: MessageGenerationService, storageService: StorageService) {
    this.messageService = messageService;
    this.storageService = storageService;
  }

  /**
   * Generate follow-up message based on lead's last classification
   */
  async execute(leadId: string, customPrompt?: string): Promise<{
    success: boolean;
    followupGenerated: boolean;
    message?: Message;
    reason?: string;
    error?: string;
  }> {
    try {
      // Get lead
      const lead = await this.storageService.getLead(leadId);
      if (!lead) {
        return {
          success: false,
          followupGenerated: false,
          error: `Lead not found: ${leadId}`
        };
      }

      // Get campaign
      const campaign = lead.campaignId
        ? await this.storageService.getCampaign(lead.campaignId)
        : null;

      if (!campaign) {
        return {
          success: false,
          followupGenerated: false,
          error: `Campaign not found for lead: ${leadId}`
        };
      }

      // Check if we should generate follow-up
      const shouldGenerate = this.shouldGenerateFollowup(lead);

      if (!shouldGenerate.should) {
        console.log(`ℹ️  Follow-up skipped for ${lead.name}: ${shouldGenerate.reason}`);
        return {
          success: true,
          followupGenerated: false,
          reason: shouldGenerate.reason
        };
      }

      // Generate follow-up message
      console.log(`\n✍️  Generating follow-up for ${lead.name}`);
      console.log(`   Last intent: ${lead.lastClassification?.intent}`);
      console.log(`   Confidence: ${lead.lastClassification?.confidence}`);

      const messageContent = await this.messageService.generateMessage(
        lead,
        campaign,
        'follow-up',
        customPrompt
      );

      // Create message object
      const message: Message = {
        id: uuidv4(),
        leadId: lead.id,
        content: messageContent,
        sender: 'user',
        timestamp: new Date()
      };

      // Add to lead's conversation history
      await this.storageService.addMessage(leadId, message);

      console.log(`✅ Follow-up generated and saved`);
      console.log(`   Message preview: ${messageContent.substring(0, 100)}...`);

      return {
        success: true,
        followupGenerated: true,
        message
      };

    } catch (error) {
      console.error('❌ Follow-up generation failed:', error);
      return {
        success: false,
        followupGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if follow-up should be generated based on intent
   */
  private shouldGenerateFollowup(lead: Lead): { should: boolean; reason: string } {
    // Must have a classification
    if (!lead.lastClassification) {
      return {
        should: false,
        reason: 'No classification available'
      };
    }

    const intent = lead.lastClassification.intent;

    // ✅ Generate for interested
    if (intent === Intent.INTERESTED) {
      return {
        should: true,
        reason: 'Lead is interested'
      };
    }

    // ✅ Generate for neutral
    if (intent === Intent.NEUTRAL) {
      return {
        should: true,
        reason: 'Lead is neutral, nurturing required'
      };
    }

    // ❌ Never generate for negative
    if (intent === Intent.NEGATIVE) {
      return {
        should: false,
        reason: 'Lead is negative - do not follow up'
      };
    }

    // ❌ Never generate for booked (already scheduled)
    if (intent === Intent.BOOKED) {
      return {
        should: false,
        reason: 'Lead already booked - no follow-up needed'
      };
    }

    return {
      should: false,
      reason: `Unknown intent: ${intent}`
    };
  }

  /**
   * Generate follow-up for multiple leads
   */
  async executeBatch(leadIds: string[]): Promise<Map<string, {
    success: boolean;
    followupGenerated: boolean;
    message?: Message;
    reason?: string;
    error?: string;
  }>> {
    const results = new Map();

    for (const leadId of leadIds) {
      const result = await this.execute(leadId);
      results.set(leadId, result);

      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Get follow-up eligibility for a lead
   */
  async checkEligibility(leadId: string): Promise<{
    eligible: boolean;
    intent?: Intent;
    reason: string;
  }> {
    const lead = await this.storageService.getLead(leadId);

    if (!lead) {
      return {
        eligible: false,
        reason: 'Lead not found'
      };
    }

    const check = this.shouldGenerateFollowup(lead);

    return {
      eligible: check.should,
      intent: lead.lastClassification?.intent,
      reason: check.reason
    };
  }

  /**
   * Get all leads that need follow-ups
   */
  async getLeadsNeedingFollowup(campaignId?: string): Promise<Lead[]> {
    const leads = await this.storageService.getLeads();

    return leads.filter(lead => {
      // Filter by campaign if specified
      if (campaignId && lead.campaignId !== campaignId) {
        return false;
      }

      // Check if follow-up should be generated
      const check = this.shouldGenerateFollowup(lead);
      return check.should;
    });
  }

  /**
   * Generate follow-ups for all eligible leads in a campaign
   */
  async generateFollowupsForCampaign(campaignId: string): Promise<{
    total: number;
    generated: number;
    skipped: number;
    errors: number;
    results: Map<string, any>;
  }> {
    const leads = await this.getLeadsNeedingFollowup(campaignId);

    console.log(`\n📨 Generating follow-ups for ${leads.length} eligible leads`);

    const results = new Map();
    let generated = 0;
    let skipped = 0;
    let errors = 0;

    for (const lead of leads) {
      const result = await this.execute(lead.id);
      results.set(lead.id, result);

      if (result.followupGenerated) {
        generated++;
      } else if (result.error) {
        errors++;
      } else {
        skipped++;
      }

      // Delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Follow-up generation complete:`);
    console.log(`   Total eligible: ${leads.length}`);
    console.log(`   Generated: ${generated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    return {
      total: leads.length,
      generated,
      skipped,
      errors,
      results
    };
  }
}

export default DraftFollowupTool;
