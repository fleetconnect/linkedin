/**
 * Core type definitions for AI Outreach Agent
 */

// ============================================================================
// Lead Types
// ============================================================================

export interface ICPCriteria {
  titles: string[];
  seniority?: string[];
  companySize?: {
    min?: number;
    max?: number;
  };
  locations?: string[];
  industries?: string[];
  techStack?: string[];
  excludedCompanies?: string[];
  excludedTitles?: string[];
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  linkedInUrl?: string;
  title: string;
  company: string;
  companySize?: number;
  location?: string;
  industry?: string;
  enrichmentData?: Record<string, any>;
  tags?: string[];
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum LeadStatus {
  NEW = 'new',
  VALIDATED = 'validated',
  IN_CAMPAIGN = 'in_campaign',
  REPLIED = 'replied',
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  BOUNCED = 'bounced',
  UNSUBSCRIBED = 'unsubscribed',
  CONVERTED = 'converted'
}

export interface LeadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lead: Lead;
}

// ============================================================================
// Campaign Types
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  icpCriteria: ICPCriteria;
  sequences: Sequence[];
  status: CampaignStatus;
  metrics: CampaignMetrics;
  settings: CampaignSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface Sequence {
  id: string;
  campaignId: string;
  steps: SequenceStep[];
  channel: Channel;
  name: string;
}

export interface SequenceStep {
  id: string;
  stepNumber: number;
  channel: Channel;
  delayHours: number;
  messageTemplate?: string;
  conditions?: StepCondition[];
  aiGenerated: boolean;
}

export enum Channel {
  LINKEDIN_CONNECTION = 'linkedin_connection',
  LINKEDIN_MESSAGE = 'linkedin_message',
  EMAIL = 'email',
  TWITTER_DM = 'twitter_dm'
}

export interface StepCondition {
  type: 'reply' | 'no_reply' | 'opened' | 'clicked' | 'bounced';
  action: 'continue' | 'pause' | 'skip' | 'switch_channel';
  value?: any;
}

export interface CampaignSettings {
  dailyLimit: number;
  messageDelaySeconds: number;
  autoFollowUp: boolean;
  autoTagging: boolean;
  autoSend: boolean;
  safeguards: SafeguardSettings;
}

export interface SafeguardSettings {
  maxDailyLinkedInConnections: number;
  maxDailyLinkedInMessages: number;
  maxDailyEmails: number;
  enableProxyRotation: boolean;
  enableBehavioralSimulation: boolean;
  spamFilterEnabled: boolean;
}

export interface CampaignMetrics {
  totalLeads: number;
  contacted: number;
  replied: number;
  positive: number;
  negative: number;
  neutral: number;
  bounced: number;
  conversionRate: number;
  replyRate: number;
  averageResponseTimeHours: number;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string;
  leadId: string;
  campaignId: string;
  sequenceId: string;
  stepId: string;
  channel: Channel;
  content: string;
  subject?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  status: MessageStatus;
  metadata?: Record<string, any>;
}

export enum MessageStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  REPLIED = 'replied',
  BOUNCED = 'bounced',
  FAILED = 'failed'
}

export interface MessageGenerationContext {
  lead: Lead;
  campaign: Campaign;
  previousMessages: Message[];
  replyHistory: Reply[];
  insights?: string[];
}

export interface PersonalizedMessage {
  subject?: string;
  content: string;
  reasoning: string;
  confidence: number;
  personalizationFactors: string[];
}

// ============================================================================
// Reply Types
// ============================================================================

export interface Reply {
  id: string;
  messageId: string;
  leadId: string;
  content: string;
  sentiment: ReplySentiment;
  intent: ReplyIntent;
  receivedAt: Date;
  tags: string[];
  processedAt?: Date;
}

export enum ReplySentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  UNKNOWN = 'unknown'
}

export enum ReplyIntent {
  INTERESTED = 'interested',
  BOOK_DEMO = 'book_demo',
  REQUEST_INFO = 'request_info',
  NOT_INTERESTED = 'not_interested',
  WRONG_PERSON = 'wrong_person',
  UNSUBSCRIBE = 'unsubscribe',
  OUT_OF_OFFICE = 'out_of_office',
  UNKNOWN = 'unknown'
}

// ============================================================================
// Feedback and Learning Types
// ============================================================================

export interface FeedbackData {
  id: string;
  campaignId: string;
  messageId?: string;
  metric: string;
  value: number;
  context: Record<string, any>;
  timestamp: Date;
}

export interface CampaignInsight {
  id: string;
  campaignId: string;
  insight: string;
  category: InsightCategory;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: Date;
}

export enum InsightCategory {
  TIMING = 'timing',
  MESSAGING = 'messaging',
  CHANNEL = 'channel',
  TARGETING = 'targeting',
  PERSONALIZATION = 'personalization'
}

export interface LearningModel {
  campaignId: string;
  patterns: Pattern[];
  recommendations: Recommendation[];
  lastUpdated: Date;
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
  data: Record<string, any>;
}

export interface Recommendation {
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
}

// ============================================================================
// HeyReach API Types
// ============================================================================

export interface HeyReachAccount {
  id: string;
  email: string;
  status: 'active' | 'paused' | 'restricted';
  dailyLimits: {
    connections: number;
    messages: number;
    profileViews: number;
  };
  usageToday: {
    connections: number;
    messages: number;
    profileViews: number;
  };
}

export interface HeyReachCampaign {
  id: string;
  name: string;
  status: string;
  leadsCount: number;
  settings: Record<string, any>;
}

export interface HeyReachMessage {
  id: string;
  leadId: string;
  content: string;
  status: string;
  sentAt?: string;
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: AgentActionType;
  parameters: Record<string, any>;
  reasoning?: string;
  timestamp: Date;
}

export enum AgentActionType {
  SEND_MESSAGE = 'send_message',
  PAUSE_CAMPAIGN = 'pause_campaign',
  TAG_REPLY = 'tag_reply',
  UPDATE_LEAD = 'update_lead',
  GENERATE_MESSAGE = 'generate_message',
  SCHEDULE_FOLLOWUP = 'schedule_followup',
  SWITCH_CHANNEL = 'switch_channel'
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AgentConfig {
  api: {
    heyReach: {
      apiKey: string;
      baseUrl: string;
    };
    anthropic: {
      apiKey: string;
    };
  };
  limits: SafeguardSettings;
  campaigns: {
    defaultFollowUpDelayHours: number;
    messageRateLimitSeconds: number;
  };
  features: {
    autoSend: boolean;
    autoFollowUp: boolean;
    autoTagging: boolean;
  };
  logging: {
    level: string;
    file?: string;
  };
}
