import { ResearchCompanyTool } from '../tools/researchCompany';
import { StorageService } from '../services/StorageService';
import {
  PreMessageHookContext,
  HookResult,
  Lead,
  LeadState
} from '../types';

/**
 * Pre-Message Hook System
 *
 * Executes actions before sending a message to a lead
 * Currently supports:
 * - Company research (runs when lead.state === QUALIFIED && personalization === true)
 */
export class PreMessageHook {
  private researchTool: ResearchCompanyTool;
  private storageService: StorageService;

  constructor(researchTool: ResearchCompanyTool, storageService: StorageService) {
    this.researchTool = researchTool;
    this.storageService = storageService;
  }

  /**
   * Execute all pre-message hooks
   */
  async execute(context: PreMessageHookContext): Promise<HookResult> {
    console.log(`\n🎣 Executing pre-message hooks for lead: ${context.lead.name}`);

    try {
      // Hook 1: Research Company
      const researchResult = await this.executeResearchHook(context);

      if (!researchResult.success) {
        console.warn(`⚠️  Research hook failed: ${researchResult.error}`);
        // Continue anyway - research failure shouldn't block messaging
      }

      return {
        success: true,
        shouldProceed: true,
        data: {
          researchCompleted: researchResult.success,
          researchSnapshot: researchResult.data
        }
      };

    } catch (error) {
      console.error('❌ Pre-message hook execution failed:', error);
      return {
        success: false,
        shouldProceed: true, // Still allow messaging even if hooks fail
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute research hook with conditional logic
   */
  private async executeResearchHook(context: PreMessageHookContext): Promise<HookResult> {
    const { lead, campaign } = context;

    // Check if research should run
    const shouldRun = this.researchTool.shouldRunResearch(
      lead,
      campaign.messaging_rules.personalization
    );

    if (!shouldRun) {
      console.log('ℹ️  Research hook skipped (conditions not met)');
      return {
        success: true,
        shouldProceed: true,
        data: lead.research_snapshot || null
      };
    }

    // Extract company name
    const companyName = this.researchTool.extractCompanyName(lead);

    if (!companyName) {
      console.warn('⚠️  Cannot run research: no company name available');
      return {
        success: false,
        shouldProceed: true,
        error: 'No company name available for research'
      };
    }

    // Execute research
    console.log(`🔍 Running research for: ${companyName}`);

    const result = await this.researchTool.execute({
      leadId: lead.id,
      companyName,
      additionalContext: `Lead name: ${lead.name}. Lead state: ${lead.state}.`
    });

    if (result.success) {
      console.log('✅ Research completed successfully');
      return {
        success: true,
        shouldProceed: true,
        data: result.snapshot
      };
    } else {
      console.error(`❌ Research failed: ${result.error}`);
      return {
        success: false,
        shouldProceed: true,
        error: result.error
      };
    }
  }

  /**
   * Check if hooks should execute for a lead
   */
  shouldExecuteHooks(lead: Lead, personalizationEnabled: boolean): boolean {
    // For now, we only have research hook
    return this.researchTool.shouldRunResearch(lead, personalizationEnabled);
  }

  /**
   * Get hook execution summary
   */
  getHookSummary(context: PreMessageHookContext): string {
    const { lead, campaign } = context;

    let summary = '📋 Pre-Message Hook Summary:\n';

    // Research hook status
    const shouldResearch = this.researchTool.shouldRunResearch(
      lead,
      campaign.messaging_rules.personalization
    );

    summary += `\n🔍 Research Hook:`;
    summary += `\n   - Lead State: ${lead.state}`;
    summary += `\n   - Personalization: ${campaign.messaging_rules.personalization ? 'Enabled' : 'Disabled'}`;
    summary += `\n   - Will Execute: ${shouldResearch ? 'Yes' : 'No'}`;

    if (lead.research_snapshot) {
      const age = Date.now() - new Date(lead.research_snapshot.researched_at).getTime();
      const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
      summary += `\n   - Existing Research: ${daysOld} days old`;
    } else {
      summary += `\n   - Existing Research: None`;
    }

    return summary;
  }
}

export default PreMessageHook;
