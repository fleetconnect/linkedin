import { v4 as uuidv4 } from 'uuid';
import { LLMService } from '../services/LLMService';
import { StorageService } from '../services/StorageService';
import { DraftFollowupTool } from '../tools/draftFollowup';
import {
  IntentClassification,
  ClassificationRequest,
  ClassificationResult,
  ControllerConfig,
  LeadState,
  Intent,
  Message
} from '../types';
import { llmConfig } from '../config/llm.config';
import { validateTransition } from '../utils/stateTransitionGuard';
import { isDuplicateClassification } from '../utils/idempotencyGuard';

/**
 * Controller responsible for:
 * 1. Validating confidence threshold
 * 2. Advancing Lead state
 * 3. Persisting intent classifications
 * 4. Auto-generating follow-ups for interested/neutral leads
 */
export class ClassificationController {
  private llmService: LLMService;
  private storageService: StorageService;
  private followupTool?: DraftFollowupTool;
  private config: ControllerConfig & { autoGenerateFollowups?: boolean };

  constructor(
    llmService: LLMService,
    storageService: StorageService,
    followupTool?: DraftFollowupTool,
    config?: Partial<ControllerConfig & { autoGenerateFollowups?: boolean }>
  ) {
    this.llmService = llmService;
    this.storageService = storageService;
    this.followupTool = followupTool;
    this.config = {
      confidenceThreshold: config?.confidenceThreshold ?? llmConfig.confidenceThreshold,
      autoAdvanceState: config?.autoAdvanceState ?? true,
      persistIntents: config?.persistIntents ?? true,
      autoGenerateFollowups: config?.autoGenerateFollowups ?? false
    };
  }

  /**
   * Main method: Classify a reply and handle state transitions
   */
  async classifyReply(
    leadId: string,
    messageContent: string,
    options?: {
      skipStateAdvancement?: boolean;
      skipPersistence?: boolean;
      skipFollowup?: boolean;
      skipIdempotencyCheck?: boolean;
    }
  ): Promise<{
    classification: IntentClassification;
    stateAdvanced: boolean;
    persisted: boolean;
    meetsThreshold: boolean;
    followupGenerated: boolean;
    followupMessage?: string;
    reasoning?: string;
  }> {
    // Get lead data
    const lead = await this.storageService.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Idempotency check: prevent duplicate classifications
    if (!options?.skipIdempotencyCheck) {
      const duplicateCheck = isDuplicateClassification(lead, messageContent);
      if (duplicateCheck.isDuplicate) {
        console.warn(`⚠️  ${duplicateCheck.reason}. Returning existing classification.`);
        return {
          classification: lead.lastClassification!,
          stateAdvanced: false,
          persisted: false,
          meetsThreshold: true,
          followupGenerated: false,
          reasoning: 'Idempotent operation - duplicate classification skipped'
        };
      }
    }

    // Build conversation context
    const conversationContext = lead.conversationHistory
      .slice(-5) // Last 5 messages for context
      .map(msg => `[${msg.sender}]: ${msg.content}`);

    // Prepare classification request
    const request: ClassificationRequest = {
      messageContent,
      conversationContext,
      leadInfo: {
        name: lead.name,
        previousState: lead.state
      }
    };

    // Call LLM service
    const result: ClassificationResult = await this.llmService.classifyIntent(request);
    const { classification, reasoning } = result;

    // Validate confidence threshold
    const meetsThreshold = this.validateConfidenceThreshold(classification);

    // Create message record
    const message: Message = {
      id: uuidv4(),
      leadId,
      content: messageContent,
      sender: 'lead',
      timestamp: new Date(),
      classification
    };

    // Add message to conversation history
    await this.storageService.addMessage(leadId, message);

    let stateAdvanced = false;
    let persisted = false;
    let followupGenerated = false;
    let followupMessage: string | undefined;

    // Only proceed with state advancement if confidence threshold is met
    if (meetsThreshold) {
      // Advance lead state if enabled and not skipped
      if (
        this.config.autoAdvanceState &&
        !options?.skipStateAdvancement
      ) {
        stateAdvanced = await this.advanceLeadState(leadId, classification);
      }

      // Persist intent if enabled and not skipped
      if (
        this.config.persistIntents &&
        !options?.skipPersistence
      ) {
        await this.persistIntent(leadId, message.id, classification);
        persisted = true;
      }

      // Auto-generate follow-up if enabled and conditions are met
      if (
        this.config.autoGenerateFollowups &&
        this.followupTool &&
        !options?.skipFollowup
      ) {
        const followupResult = await this.followupTool.execute(leadId);
        followupGenerated = followupResult.followupGenerated;
        followupMessage = followupResult.message?.content;

        if (followupGenerated) {
          console.log(`📨 Follow-up auto-generated for ${lead.name}`);
        }
      }
    } else {
      console.warn(
        `Classification confidence ${classification.confidence} below threshold ${this.config.confidenceThreshold}. ` +
        `Skipping state advancement and persistence.`
      );
    }

    return {
      classification,
      stateAdvanced,
      persisted,
      meetsThreshold,
      followupGenerated,
      followupMessage,
      reasoning
    };
  }

  /**
   * Validate that classification confidence meets threshold
   */
  private validateConfidenceThreshold(classification: IntentClassification): boolean {
    return classification.confidence >= this.config.confidenceThreshold;
  }

  /**
   * Advance lead state based on classification
   * Uses state transition guard for validation
   */
  private async advanceLeadState(
    leadId: string,
    classification: IntentClassification
  ): Promise<boolean> {
    const lead = await this.storageService.getLead(leadId);
    if (!lead) {
      return false;
    }

    const currentState = lead.state;
    const nextState = classification.next_state;

    // Validate state transition using guard
    const validation = validateTransition(currentState, nextState);

    if (!validation.valid) {
      console.warn(
        `❌ Invalid state transition: ${currentState} → ${nextState}. ${validation.reason}`
      );
      return false;
    }

    if (validation.warning) {
      console.warn(`⚠️  ${validation.warning}`);
    }

    // Update lead state (will validate again in storage layer)
    try {
      await this.storageService.updateLeadState(leadId, nextState);
    } catch (error) {
      console.error(`Failed to update lead state: ${error}`);
      return false;
    }

    console.log(
      `Lead ${leadId} state advanced: ${currentState} → ${nextState} ` +
      `(Intent: ${classification.intent}, Confidence: ${classification.confidence})`
    );

    return true;
  }

  /**
   * Persist intent classification
   */
  private async persistIntent(
    leadId: string,
    messageId: string,
    classification: IntentClassification
  ): Promise<void> {
    await this.storageService.saveClassification(leadId, messageId, classification);
    console.log(
      `Persisted classification for lead ${leadId}: ${classification.intent} ` +
      `(confidence: ${classification.confidence})`
    );
  }

  /**
   * Batch process multiple replies
   */
  async classifyBatch(
    requests: Array<{ leadId: string; messageContent: string }>
  ): Promise<Array<{
    leadId: string;
    classification: IntentClassification;
    stateAdvanced: boolean;
    persisted: boolean;
    meetsThreshold: boolean;
  }>> {
    const results = await Promise.all(
      requests.map(req => this.classifyReply(req.leadId, req.messageContent))
    );

    return results.map((result, idx) => ({
      leadId: requests[idx].leadId,
      ...result
    }));
  }

  /**
   * Get classification statistics for a lead
   */
  async getLeadStats(leadId: string): Promise<{
    totalClassifications: number;
    intentBreakdown: Record<Intent, number>;
    averageConfidence: number;
    currentState: LeadState;
  }> {
    const lead = await this.storageService.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const classifications = await this.storageService.getLeadClassifications(leadId);

    const intentBreakdown: Record<Intent, number> = {
      [Intent.INTERESTED]: 0,
      [Intent.BOOKED]: 0,
      [Intent.NEUTRAL]: 0,
      [Intent.NEGATIVE]: 0
    };

    let totalConfidence = 0;

    classifications.forEach((c: any) => {
      const intent = c.classification.intent;
      intentBreakdown[intent as Intent]++;
      totalConfidence += c.classification.confidence;
    });

    return {
      totalClassifications: classifications.length,
      intentBreakdown,
      averageConfidence: classifications.length > 0
        ? totalConfidence / classifications.length
        : 0,
      currentState: lead.state
    };
  }
}

export default ClassificationController;
