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

// Lead model
export interface Lead {
  id: string;
  name: string;
  linkedinUrl?: string;
  email?: string;
  state: LeadState;
  conversationHistory: Message[];
  lastClassification?: IntentClassification;
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
