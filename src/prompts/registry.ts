/**
 * Prompt Registry
 *
 * Central prompt selection logic.
 * Prompts are selected by logic, not humans.
 *
 * Handles:
 * - Version selection
 * - A/B testing variants
 * - Context-based selection (message type, intent, etc.)
 * - Future: Experiment-based selection
 */

import {
  PromptDefinition,
  PromptSelector,
  ClassifyReplyInput,
  GenerateMessageInput,
  FollowUpInput
} from './types';

// Import all prompts
import { classifyReplyV1, classifyReplyV2 } from './classifyReply';
import { generateInitialV1, generateInitialV2, generateFollowupV1 } from './generateMessage';
import { followUpPositiveV1, followUpNeutralV1, followUpV2 } from './followUp';

/**
 * Select appropriate prompt based on context
 *
 * @param selector - Prompt selection parameters
 * @returns PromptDefinition to use
 * @throws Error if no matching prompt found
 */
export function selectPrompt<TInput = any>(
  selector: PromptSelector
): PromptDefinition<TInput> {
  // Classification prompts
  if (selector.type === 'classify_reply') {
    // Use specified version or default to v2 (conservative)
    const version = selector.version || 'v2';

    if (version === 'v2') {
      return classifyReplyV2 as PromptDefinition<TInput>;
    }

    if (version === 'v1') {
      return classifyReplyV1 as PromptDefinition<TInput>;
    }

    // Default to v2
    return classifyReplyV2 as PromptDefinition<TInput>;
  }

  // Message generation prompts
  if (selector.type === 'generate_message') {
    if (selector.messageType === 'initial') {
      // Use specified version or default to v2 (executive-grade)
      const version = selector.version || 'v2';

      if (version === 'v2') {
        return generateInitialV2 as PromptDefinition<TInput>;
      }

      if (version === 'v1') {
        return generateInitialV1 as PromptDefinition<TInput>;
      }

      return generateInitialV2 as PromptDefinition<TInput>;
    }

    if (selector.messageType === 'follow-up') {
      return generateFollowupV1 as PromptDefinition<TInput>;
    }

    // Default to initial v2 if messageType not specified
    return generateInitialV2 as PromptDefinition<TInput>;
  }

  // Follow-up prompts (based on intent)
  if (selector.type === 'follow_up') {
    // Use specified version or default to v2 (respectful)
    const version = selector.version || 'v2';

    if (version === 'v2') {
      // v2 handles both positive and neutral appropriately
      return followUpV2 as PromptDefinition<TInput>;
    }

    // v1 uses separate prompts for positive vs neutral
    if (version === 'v1') {
      if (selector.intent === 'interested') {
        return followUpPositiveV1 as PromptDefinition<TInput>;
      }

      if (selector.intent === 'neutral') {
        return followUpNeutralV1 as PromptDefinition<TInput>;
      }

      // Default to neutral for safety
      console.warn(`Unknown intent for follow-up: ${selector.intent}. Defaulting to neutral.`);
      return followUpNeutralV1 as PromptDefinition<TInput>;
    }

    // Default to v2
    return followUpV2 as PromptDefinition<TInput>;
  }

  // No matching prompt found
  throw new Error(
    `No prompt found for selector: ${JSON.stringify(selector)}`
  );
}

/**
 * Get all available prompts for a given type
 *
 * Useful for A/B testing, experimentation, or prompt comparison
 */
export function getAllPromptsForType(type: PromptSelector['type']): PromptDefinition[] {
  const prompts: Record<string, PromptDefinition[]> = {
    classify_reply: [classifyReplyV1, classifyReplyV2],
    generate_message: [generateInitialV1, generateInitialV2, generateFollowupV1],
    follow_up: [followUpPositiveV1, followUpNeutralV1, followUpV2]
  };

  return prompts[type] || [];
}

/**
 * Get prompt by ID
 *
 * Useful for direct access or testing
 */
export function getPromptById(id: string): PromptDefinition | null {
  const allPrompts = [
    classifyReplyV1,
    classifyReplyV2,
    generateInitialV1,
    generateInitialV2,
    generateFollowupV1,
    followUpPositiveV1,
    followUpNeutralV1,
    followUpV2
  ];

  return allPrompts.find(p => p.id === id) || null;
}

/**
 * List all registered prompts
 *
 * Useful for auditing and testing
 */
export function listAllPrompts(): Array<{
  id: string;
  type: string;
  version: string;
  description?: string;
}> {
  const allPrompts = [
    classifyReplyV1,
    classifyReplyV2,
    generateInitialV1,
    generateInitialV2,
    generateFollowupV1,
    followUpPositiveV1,
    followUpNeutralV1,
    followUpV2
  ];

  return allPrompts.map(p => ({
    id: p.id,
    type: p.type,
    version: p.version,
    description: p.metadata?.description
  }));
}

/**
 * Validate prompt definition
 *
 * Ensures prompt follows required structure
 */
export function validatePromptDefinition(prompt: PromptDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!prompt.id) errors.push('Missing id');
  if (!prompt.type) errors.push('Missing type');
  if (!prompt.version) errors.push('Missing version');
  if (!prompt.model) errors.push('Missing model');
  if (typeof prompt.temperature !== 'number') errors.push('Missing or invalid temperature');
  if (typeof prompt.maxTokens !== 'number') errors.push('Missing or invalid maxTokens');
  if (!prompt.system) errors.push('Missing system prompt');
  if (typeof prompt.user !== 'function') errors.push('Missing or invalid user prompt function');

  return {
    valid: errors.length === 0,
    errors
  };
}

// Export types for external use
export * from './types';
