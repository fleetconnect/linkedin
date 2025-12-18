import { z } from 'zod';

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
  linkedinUrl?: string;
  email?: string;
  state: LeadState;
  conversationHistory: Message[];
  lastClassification?: IntentClassification;
  research_snapshot?: ResearchSnapshot;
  campaignId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message model
export interface Message {
  id: string;
  leadId: string;
  content: string;
  sender: 'user' | 'lead';
  timestamp: Date;
  classification?: IntentClassification;
}

// Classification request
export interface ClassificationRequest {
  messageContent: string;
  conversationContext?: string[];
  leadInfo?: {
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
}

export interface Campaign {
  id: string;
  name: string;
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
