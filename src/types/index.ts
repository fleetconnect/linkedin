import { z } from 'zod';
import type { LeadScore } from './scoring';
import type { ResearchSnapshot as ResearchSnapshotV2 } from './research';

// Intent Classification Types
export enum Intent {
  INTERESTED = 'interested',
  BOOKED = 'booked',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export enum Sentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export enum LeadState {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  READY_TO_SEND = 'READY_TO_SEND',  // 🔒 EXECUTION BOUNDARY: Our system stops here. External tools (HeyReach/n8n) handle actual sending.
  CONTACTED = 'CONTACTED',
  REPLIED = 'REPLIED',
  INTERESTED = 'INTERESTED',
  BOOKED = 'BOOKED',
  CLOSED = 'CLOSED',
  LOST = 'LOST'
}

// Zod schemas for validation
export const IntentClassificationSchema = z.object({
  intent: z.nativeEnum(Intent),
  sentiment: z.nativeEnum(Sentiment),
  confidence: z.number().min(0).max(1),
  next_state: z.nativeEnum(LeadState)
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

// Research Snapshot
export interface ResearchSnapshot {
  companyName?: string;
  companyDescription?: string;
  industry?: string;
  recentNews?: string[];
  keyProducts?: string[];
  challenges?: string[];
  opportunities?: string[];
  fundingInfo?: string;
  employeeCount?: string;
  researched_at: Date;
  sources?: string[];
}

// Lead model
export interface Lead {
  id: string;
  name: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  email?: string;
  state: LeadState;
  conversationHistory: Message[];
  lastClassification?: IntentClassification;
  research_snapshot?: ResearchSnapshot; // Legacy field
  researchSnapshot?: ResearchSnapshotV2; // New research format
  score?: LeadScore; // Lead scoring data
  campaignId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message model
export interface Message {
  id: string;
  leadId?: string;
  content: string;
  sender: 'user' | 'lead';
  timestamp: Date;
  classification?: IntentClassification;
  variant?: 'A' | 'B'; // A/B testing variant

  // Human approval fields
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejected?: boolean;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Message editing
  edited?: boolean;
  originalContent?: string;
  editedBy?: string;
  editedAt?: Date;

  // Delivery tracking
  sent?: boolean;
  sentAt?: Date;
  failed?: boolean;
  failureReason?: string;
  source?: string; // e.g., 'linkedin_webhook', 'manual'

  // Quality tracking
  qualityRating?: number; // 1-5
  ratedBy?: string;
  ratedAt?: Date;
  ratingNotes?: string;
  flagged?: boolean;
  flagReason?: string;
  flaggedBy?: string;
  flaggedAt?: Date;
}

// Classification request
export interface ClassificationRequest {
  messageContent: string;
  conversationContext?: string[];
  leadInfo?: {
    id?: string;
    name: string;
    previousState: LeadState;
  };
}

// Classification result with metadata
export interface ClassificationResult {
  classification: IntentClassification;
  reasoning?: string;
  timestamp: Date;
  modelUsed: string;
}

// Controller configuration
export interface ControllerConfig {
  confidenceThreshold: number;
  autoAdvanceState: boolean;
  persistIntents: boolean;
}

// Campaign Configuration
export interface MessagingRules {
  personalization: boolean;
  maxMessagesPerDay?: number;
  researchRequired?: boolean;
  toneOfVoice?: 'professional' | 'casual' | 'friendly';
  prompt_variant?: 'A' | 'B'; // A/B testing prompt variant
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  messaging_rules: MessagingRules;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Research Hook Types
export interface ResearchRequest {
  leadId: string;
  companyName: string;
  additionalContext?: string;
}

export interface ResearchResult {
  snapshot: ResearchSnapshot;
  success: boolean;
  error?: string;
}

// Pre-Message Hook Context
export interface PreMessageHookContext {
  lead: Lead;
  campaign: Campaign;
  messageType: 'initial' | 'follow-up' | 'reply';
}

export interface HookResult {
  success: boolean;
  shouldProceed: boolean;
  data?: any;
  error?: string;
}

// ==================== Message Generation API Response Types ====================

/**
 * Binary status for message validation
 */
export type MessageValidationStatus = 'PASS' | 'FAIL';

/**
 * Response from message generation endpoints (initial & follow-up)
 * CRITICAL: status determines whether message is ready to send
 */
export interface MessageGenerationResponse {
  status: MessageValidationStatus;
  data: {
    leadId: string;
    messageId?: string;      // Only present on PASS
    content?: string;        // Only present on PASS
    variant?: 'A' | 'B';     // Only present on PASS
    state: LeadState;        // READY_TO_SEND on PASS, LOST on FAIL
  };
  reason?: string;           // Only present on FAIL - explains why validation failed
  validationErrors?: Array<{ // Only present on FAIL - detailed validation errors
    rule: string;
    actual: any;
    expected: any;
    severity: 'error' | 'warning';
  }>;
}

/**
 * Successful message generation (PASS)
 */
export interface MessageGenerationSuccess {
  status: 'PASS';
  data: {
    leadId: string;
    messageId: string;
    content: string;
    variant: 'A' | 'B';
    state: 'READY_TO_SEND';
  };
}

/**
 * Failed message generation (FAIL)
 */
export interface MessageGenerationFailure {
  status: 'FAIL';
  data: {
    leadId: string;
    state: 'LOST';
  };
  reason: string;
  validationErrors: Array<{
    rule: string;
    actual: any;
    expected: any;
    severity: 'error' | 'warning';
  }>;
}
