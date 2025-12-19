/**
 * Prompt Registry Types
 *
 * Prompts are first-class system assets:
 * - Versioned (v1, v2, etc.)
 * - Typed (with clear input/output schemas)
 * - Centrally owned (in registry)
 * - Selected by logic, not humans
 */

/**
 * Prompt types in the system
 */
export type PromptType =
  | 'classify_reply'
  | 'generate_message'
  | 'follow_up';

/**
 * Prompt versions
 */
export type PromptVersion = 'v1' | 'v2' | 'v3';

/**
 * Message types for generation
 */
export type MessageType = 'initial' | 'follow-up' | 'reply';

/**
 * Follow-up types based on intent
 */
export type FollowUpType = 'positive' | 'neutral';

/**
 * Model options
 */
export type ModelType =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229';

/**
 * Prompt definition interface
 *
 * All prompts must implement this structure
 */
export interface PromptDefinition<TInput = any, TOutput = any> {
  /** Unique identifier */
  id: string;

  /** Prompt type */
  type: PromptType;

  /** Version */
  version: PromptVersion;

  /** Claude model to use */
  model: ModelType;

  /** Temperature setting */
  temperature: number;

  /** Max tokens */
  maxTokens: number;

  /** System prompt (static or function) */
  system: string | ((input: TInput) => string);

  /** User prompt generator */
  user: (input: TInput) => string;

  /** Expected output schema (for validation) */
  outputSchema?: object;

  /** Metadata */
  metadata?: {
    description?: string;
    createdAt?: string;
    deprecatedAt?: string;
    replacedBy?: string;
  };
}

/**
 * Prompt selector parameters
 */
export interface PromptSelector {
  type: PromptType;
  messageType?: MessageType;
  intent?: 'interested' | 'neutral' | 'negative' | 'booked';
  variant?: 'A' | 'B';
  campaign?: string;
  experiment?: string;
  version?: PromptVersion;
}

/**
 * Classification input
 */
export interface ClassifyReplyInput {
  messageContent: string;
  conversationContext?: string[];
  leadInfo?: {
    name: string;
    previousState: string;
  };
}

/**
 * Message generation input
 */
export interface GenerateMessageInput {
  messageType: MessageType;
  leadName: string;
  company?: string;
  toneOfVoice: 'professional' | 'casual' | 'friendly';
  researchSnapshot?: any;
  conversationHistory?: Array<{ sender: string; content: string }>;
  customPrompt?: string;
  variant?: 'A' | 'B';
}

/**
 * Follow-up input
 */
export interface FollowUpInput {
  leadName: string;
  lastReply: string;
  intent: 'interested' | 'neutral';
  conversationHistory?: Array<{ sender: string; content: string }>;
  customPrompt?: string;
}
