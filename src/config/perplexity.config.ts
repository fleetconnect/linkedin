import dotenv from 'dotenv';

dotenv.config();

export const perplexityConfig = {
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  model: process.env.RESEARCH_MODEL || 'llama-3.1-sonar-large-128k-online',
  timeout: parseInt(process.env.RESEARCH_TIMEOUT || '30000', 10),
  baseURL: 'https://api.perplexity.ai'
};

export const validatePerplexityConfig = (): void => {
  if (!perplexityConfig.apiKey) {
    throw new Error('PERPLEXITY_API_KEY is required in environment variables');
  }

  if (perplexityConfig.timeout < 5000 || perplexityConfig.timeout > 60000) {
    throw new Error('RESEARCH_TIMEOUT must be between 5000 and 60000 milliseconds');
  }
};
