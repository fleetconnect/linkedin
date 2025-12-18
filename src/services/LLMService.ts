import OpenAI from 'openai';
import { llmConfig } from '../config/llm.config';
import { buildClassificationPrompt } from '../utils/promptTemplates';
import {
  IntentClassification,
  IntentClassificationSchema,
  ClassificationRequest,
  ClassificationResult
} from '../types';

export class LLMService {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || llmConfig.apiKey
    });
  }

  /**
   * Classify a message using LLM
   */
  async classifyIntent(request: ClassificationRequest): Promise<ClassificationResult> {
    const prompt = buildClassificationPrompt(
      request.messageContent,
      {
        conversationHistory: request.conversationContext,
        leadName: request.leadInfo?.name,
        previousState: request.leadInfo?.previousState
      }
    );

    try {
      const completion = await this.client.chat.completions.create({
        model: llmConfig.model,
        temperature: llmConfig.temperature,
        max_tokens: llmConfig.maxTokens,
        messages: [
          {
            role: 'system',
            content: 'You are an expert intent classifier for LinkedIn messages. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from LLM');
      }

      const parsed = JSON.parse(content);

      // Validate against schema
      const classification = IntentClassificationSchema.parse({
        intent: parsed.intent,
        sentiment: parsed.sentiment,
        confidence: parsed.confidence,
        next_state: parsed.next_state
      });

      return {
        classification,
        reasoning: parsed.reasoning,
        timestamp: new Date(),
        modelUsed: llmConfig.model
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM classification failed: ${error.message}`);
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
   * Test connection to LLM service
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: llmConfig.model,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });
      return !!response.choices[0]?.message;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}

export default LLMService;
