import dotenv from 'dotenv';

dotenv.config();

export const llmConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-4-turbo-preview',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
  maxTokens: 500,
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7')
};

export const validateConfig = (): void => {
  if (!llmConfig.apiKey) {
    throw new Error('OPENAI_API_KEY is required in environment variables');
  }

  if (llmConfig.temperature < 0 || llmConfig.temperature > 2) {
    throw new Error('LLM_TEMPERATURE must be between 0 and 2');
  }

  if (llmConfig.confidenceThreshold < 0 || llmConfig.confidenceThreshold > 1) {
    throw new Error('CONFIDENCE_THRESHOLD must be between 0 and 1');
  }
};
