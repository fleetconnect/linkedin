import Anthropic from '@anthropic-ai/sdk';
import { claudeConfig } from '../config/claude.config';
import { selectPrompt } from '../prompts/registry';
import type { ClassifyReplyInput } from '../prompts/types';
import {
  IntentClassification,
  IntentClassificationSchema,
  ClassificationRequest,
  ClassificationResult
} from '../types';
import observability from './ObservabilityService';

/**
 * LLM Service using Claude (Anthropic)
 *
 * ENFORCED: Claude-only for all classification and messaging
 */
export class LLMService {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || claudeConfig.apiKey
    });
  }

  /**
   * Classify a message using Claude with prompt registry
   */
  async classifyIntent(request: ClassificationRequest): Promise<ClassificationResult> {
    const startTime = Date.now();

    // Select prompt from registry (defaults to v2 - conservative)
    const prompt = selectPrompt<ClassifyReplyInput>({
      type: 'classify_reply'
      // version: 'v2' is default in registry
    });

    // Build input for prompt
    const input: ClassifyReplyInput = {
      messageContent: request.messageContent,
      conversationContext: request.conversationContext,
      leadInfo: request.leadInfo
    };

    // Get system prompt
    const systemPrompt = typeof prompt.system === 'function'
      ? prompt.system(input)
      : prompt.system;

    // Get user prompt
    const userPrompt = prompt.user(input);

    try {
      const message = await this.client.messages.create({
        model: prompt.model,
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const latency = Date.now() - startTime;
      const content = message.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from response
      const text = content.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate against schema
      const classification = IntentClassificationSchema.parse({
        intent: parsed.intent,
        sentiment: parsed.sentiment,
        confidence: parsed.confidence,
        next_state: parsed.next_state
      });

      // Log successful LLM call
      observability.logLLMCall({
        operation: 'classify',
        promptId: prompt.id,
        promptVersion: prompt.version,
        model: prompt.model,
        temperature: prompt.temperature,
        success: true,
        latency_ms: latency,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        leadId: request.leadInfo?.id
      });

      return {
        classification,
        reasoning: parsed.reasoning,
        timestamp: new Date(),
        modelUsed: prompt.model
      };

    } catch (error) {
      const latency = Date.now() - startTime;

      // Log failed LLM call
      observability.logLLMCall({
        operation: 'classify',
        promptId: prompt.id,
        promptVersion: prompt.version,
        model: prompt.model,
        temperature: prompt.temperature,
        success: false,
        latency_ms: latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        leadId: request.leadInfo?.id
      });

      if (error instanceof Error) {
        throw new Error(`Claude classification failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Batch classify multiple messages
   */
  async classifyBatch(requests: ClassificationRequest[]): Promise<ClassificationResult[]> {
    const results = await Promise.all(
      requests.map(req => this.classifyIntent(req))
    );
    return results;
  }

  /**
   * Test connection to Claude
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: claudeConfig.classificationModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      });
      return !!response.content[0];
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate text using Claude
   * Used by MessageGenerationService
   */
  async generate(systemPrompt: string, userPrompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    operation?: 'generate_message' | 'generate_followup';
    leadId?: string;
  }): Promise<string> {
    const startTime = Date.now();
    const model = claudeConfig.model;
    const temperature = options?.temperature ?? claudeConfig.temperature;

    try {
      const message = await this.client.messages.create({
        model,
        max_tokens: options?.maxTokens || claudeConfig.maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const latency = Date.now() - startTime;
      const content = message.content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Log successful LLM call
      observability.logLLMCall({
        operation: options?.operation || 'generate_message',
        promptId: 'generate_message_generic',  // MessageGenerationService uses custom prompts
        promptVersion: 'v1',
        model,
        temperature,
        success: true,
        latency_ms: latency,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
        leadId: options?.leadId
      });

      return content.text.trim();

    } catch (error) {
      const latency = Date.now() - startTime;

      // Log failed LLM call
      observability.logLLMCall({
        operation: options?.operation || 'generate_message',
        promptId: 'generate_message_generic',
        promptVersion: 'v1',
        model,
        temperature,
        success: false,
        latency_ms: latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        leadId: options?.leadId
      });

      if (error instanceof Error) {
        throw new Error(`Claude generation failed: ${error.message}`);
      }
      throw error;
    }
  }
}

export default LLMService;
