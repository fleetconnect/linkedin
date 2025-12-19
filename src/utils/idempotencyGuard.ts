import { createHash } from 'crypto';
import { Lead, Message, IntentClassification } from '../types';

/**
 * Idempotency Guard
 *
 * Prevents duplicate messages and classifications from causing double-writes.
 *
 * Uses:
 * - Content hashing to detect duplicate messages
 * - Timestamp windows to prevent rapid duplicates
 * - Message ID tracking
 */

/**
 * Generate content hash for message
 */
export function generateMessageHash(content: string, leadId: string): string {
  return createHash('sha256')
    .update(`${leadId}:${content.trim().toLowerCase()}`)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Check if message is duplicate based on content
 */
export function isDuplicateMessage(
  lead: Lead,
  messageContent: string,
  sender: 'user' | 'lead',
  options?: {
    timeWindowMs?: number;  // Consider duplicates within this window (default: 60000 = 1 min)
    exactMatch?: boolean;   // Require exact match or use hash (default: false)
  }
): { isDuplicate: boolean; existingMessage?: Message; reason?: string } {
  const timeWindowMs = options?.timeWindowMs ?? 60000;  // Default 1 minute
  const exactMatch = options?.exactMatch === true;

  const now = Date.now();
  const contentHash = generateMessageHash(messageContent, lead.id);

  // Check recent messages from the same sender
  const recentMessages = lead.conversationHistory
    .filter(m => m.sender === sender)
    .filter(m => {
      const messageTime = new Date(m.timestamp).getTime();
      return (now - messageTime) <= timeWindowMs;
    });

  for (const msg of recentMessages) {
    // Exact match check
    if (exactMatch) {
      if (msg.content.trim() === messageContent.trim()) {
        return {
          isDuplicate: true,
          existingMessage: msg,
          reason: `Exact duplicate found within ${timeWindowMs}ms window`
        };
      }
    } else {
      // Hash-based check
      const msgHash = generateMessageHash(msg.content, lead.id);
      if (msgHash === contentHash) {
        return {
          isDuplicate: true,
          existingMessage: msg,
          reason: `Content hash match found within ${timeWindowMs}ms window`
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Check if classification is duplicate
 */
export function isDuplicateClassification(
  lead: Lead,
  messageContent: string,
  options?: {
    timeWindowMs?: number;  // Default: 60000 = 1 min
  }
): { isDuplicate: boolean; reason?: string } {
  const timeWindowMs = options?.timeWindowMs ?? 60000;

  if (!lead.lastClassification) {
    return { isDuplicate: false };
  }

  const lastClassTime = new Date(lead.updatedAt).getTime();
  const now = Date.now();

  // Check if classification happened recently
  if ((now - lastClassTime) > timeWindowMs) {
    return { isDuplicate: false };
  }

  // Check if we're classifying the same message again
  const lastMessage = lead.conversationHistory
    .filter(m => m.sender === 'lead')
    .slice(-1)[0];

  if (lastMessage && lastMessage.content.trim() === messageContent.trim()) {
    return {
      isDuplicate: true,
      reason: `Classification already exists for this message within ${timeWindowMs}ms window`
    };
  }

  return { isDuplicate: false };
}

/**
 * Check if follow-up generation is duplicate
 */
export function isDuplicateFollowup(
  lead: Lead,
  options?: {
    timeWindowMs?: number;  // Default: 300000 = 5 min
  }
): { isDuplicate: boolean; reason?: string; lastFollowup?: Message } {
  const timeWindowMs = options?.timeWindowMs ?? 300000;  // Default 5 minutes

  const now = Date.now();

  // Get last user message (potential follow-up)
  const userMessages = lead.conversationHistory
    .filter(m => m.sender === 'user')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (userMessages.length === 0) {
    return { isDuplicate: false };
  }

  const lastUserMessage = userMessages[0];
  const lastMessageTime = new Date(lastUserMessage.timestamp).getTime();

  // Check if we just generated a follow-up
  if ((now - lastMessageTime) <= timeWindowMs) {
    return {
      isDuplicate: true,
      lastFollowup: lastUserMessage,
      reason: `Follow-up already generated within ${timeWindowMs}ms window`
    };
  }

  return { isDuplicate: false };
}

/**
 * Idempotency error
 */
export class IdempotencyError extends Error {
  constructor(
    public operation: string,
    public reason: string,
    public existingData?: any
  ) {
    super(`Idempotency violation: ${operation}. ${reason}`);
    this.name = 'IdempotencyError';
  }
}

/**
 * Assert message is not duplicate (throws if it is)
 */
export function assertNotDuplicateMessage(
  lead: Lead,
  messageContent: string,
  sender: 'user' | 'lead',
  options?: {
    timeWindowMs?: number;
    exactMatch?: boolean;
    throwOnDuplicate?: boolean;  // Default: true
  }
): void {
  const throwOnDuplicate = options?.throwOnDuplicate !== false;

  const check = isDuplicateMessage(lead, messageContent, sender, options);

  if (check.isDuplicate) {
    const message = `Duplicate message detected from ${sender}. ${check.reason}`;

    if (throwOnDuplicate) {
      throw new IdempotencyError('addMessage', message, check.existingMessage);
    } else {
      console.warn(`⚠️  ${message}`);
    }
  }
}

/**
 * Assert classification is not duplicate (throws if it is)
 */
export function assertNotDuplicateClassification(
  lead: Lead,
  messageContent: string,
  options?: {
    timeWindowMs?: number;
    throwOnDuplicate?: boolean;  // Default: true
  }
): void {
  const throwOnDuplicate = options?.throwOnDuplicate !== false;

  const check = isDuplicateClassification(lead, messageContent, options);

  if (check.isDuplicate) {
    const message = `Duplicate classification detected. ${check.reason}`;

    if (throwOnDuplicate) {
      throw new IdempotencyError('classifyReply', message);
    } else {
      console.warn(`⚠️  ${message}`);
    }
  }
}

/**
 * Assert follow-up is not duplicate (throws if it is)
 */
export function assertNotDuplicateFollowup(
  lead: Lead,
  options?: {
    timeWindowMs?: number;
    throwOnDuplicate?: boolean;  // Default: false (just warn)
  }
): void {
  const throwOnDuplicate = options?.throwOnDuplicate === true;  // Default false

  const check = isDuplicateFollowup(lead, options);

  if (check.isDuplicate) {
    const message = `Duplicate follow-up generation detected. ${check.reason}`;

    if (throwOnDuplicate) {
      throw new IdempotencyError('generateFollowup', message, check.lastFollowup);
    } else {
      console.warn(`⚠️  ${message}`);
    }
  }
}
