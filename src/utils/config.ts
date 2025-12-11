import dotenv from 'dotenv';
import { AgentConfig } from '../types/index.js';

dotenv.config();

export function loadConfig(): AgentConfig {
  const requiredEnvVars = ['HEYREACH_API_KEY', 'ANTHROPIC_API_KEY'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    api: {
      heyReach: {
        apiKey: process.env.HEYREACH_API_KEY!,
        baseUrl: process.env.HEYREACH_API_URL || 'https://api.heyreach.io/v1',
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY!,
      },
    },
    limits: {
      maxDailyLinkedInConnections: parseInt(process.env.MAX_DAILY_LINKEDIN_CONNECTIONS || '100'),
      maxDailyLinkedInMessages: parseInt(process.env.MAX_DAILY_LINKEDIN_MESSAGES || '150'),
      maxDailyEmails: parseInt(process.env.MAX_DAILY_EMAILS || '500'),
      enableProxyRotation: process.env.ENABLE_PROXY_ROTATION === 'true',
      enableBehavioralSimulation: process.env.ENABLE_BEHAVIORAL_SIMULATION !== 'false',
      spamFilterEnabled: process.env.SPAM_FILTER_ENABLED !== 'false',
    },
    campaigns: {
      defaultFollowUpDelayHours: parseInt(process.env.DEFAULT_FOLLOW_UP_DELAY_HOURS || '48'),
      messageRateLimitSeconds: parseInt(process.env.MESSAGE_RATE_LIMIT_SECONDS || '120'),
    },
    features: {
      autoSend: process.env.ENABLE_AUTO_SEND === 'true',
      autoFollowUp: process.env.ENABLE_AUTO_FOLLOWUP !== 'false',
      autoTagging: process.env.ENABLE_AUTO_TAGGING !== 'false',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE,
    },
  };
}

export const config = loadConfig();
