import dotenv from 'dotenv';

dotenv.config();

export const claudeConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),
  temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7', 10),

  // Classification-specific settings
  classificationModel: process.env.CLAUDE_CLASSIFICATION_MODEL || 'claude-3-5-sonnet-20241022',
  classificationMaxTokens: parseInt(process.env.CLAUDE_CLASSIFICATION_MAX_TOKENS || '500', 10),
  classificationTemperature: parseFloat(process.env.CLAUDE_CLASSIFICATION_TEMPERATURE || '0.3', 10),

  // Confidence threshold for classification
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7', 10)
};

export const validateClaudeConfig = (): void => {
  if (!claudeConfig.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required in environment variables');
  }

  if (claudeConfig.temperature < 0 || claudeConfig.temperature > 1) {
    throw new Error('CLAUDE_TEMPERATURE must be between 0 and 1');
  }

  if (claudeConfig.confidenceThreshold < 0 || claudeConfig.confidenceThreshold > 1) {
    throw new Error('CONFIDENCE_THRESHOLD must be between 0 and 1');
  }
};
