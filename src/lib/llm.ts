import Anthropic from '@anthropic-ai/sdk';

// Singleton Anthropic client
let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable is not set. Add it to your .env file.'
      );
    }

    anthropicClient = new Anthropic({
      apiKey,
    });
  }

  return anthropicClient;
}

/**
 * Call Claude API with a prompt
 */
export async function callClaude(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: options?.model || 'claude-3-5-sonnet-20241022',
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature || 0.7,
    system: options?.systemPrompt,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response format from Claude API');
}

/**
 * Call Claude API for structured JSON output
 */
export async function callClaudeJSON<T = any>(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<T> {
  const systemPrompt = `${options?.systemPrompt || ''}\n\nYou must respond with valid JSON only. Do not include any explanation or markdown formatting.`;

  const response = await callClaude(prompt, {
    ...options,
    systemPrompt,
    temperature: options?.temperature || 0.3, // Lower temperature for structured output
  });

  try {
    // Try to parse JSON, handling potential markdown code blocks
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', response);
    throw new Error(`Failed to parse JSON response from Claude: ${error}`);
  }
}
