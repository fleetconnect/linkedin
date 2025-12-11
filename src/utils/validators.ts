import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

export const emailSchema = z.string().email();

export const linkedInUrlSchema = z.string().url().refine(
  (url) => url.includes('linkedin.com/in/'),
  { message: 'Must be a valid LinkedIn profile URL' }
);

export const leadSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: emailSchema.optional(),
  linkedInUrl: linkedInUrlSchema.optional(),
  title: z.string().min(1),
  company: z.string().min(1),
  companySize: z.number().positive().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  enrichmentData: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const icpCriteriaSchema = z.object({
  titles: z.array(z.string()).min(1),
  seniority: z.array(z.string()).optional(),
  companySize: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
  }).optional(),
  locations: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  excludedCompanies: z.array(z.string()).optional(),
  excludedTitles: z.array(z.string()).optional(),
});

export const messageSchema = z.object({
  subject: z.string().optional(),
  content: z.string().min(10).max(2000),
  channel: z.enum(['linkedin_connection', 'linkedin_message', 'email', 'twitter_dm']),
});

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Validates LinkedIn URL format
 */
export function isValidLinkedInUrl(url: string): boolean {
  return linkedInUrlSchema.safeParse(url).success;
}

/**
 * Checks if a message contains potential spam indicators
 */
export function containsSpamIndicators(message: string): boolean {
  const spamPatterns = [
    /\b(click here|act now|limited time|urgent|free money|guarantee|risk-free)\b/i,
    /\${2,}/, // Multiple dollar signs
    /!{3,}/, // Multiple exclamation marks
    /CLICK HERE|BUY NOW|FREE/g, // All caps spam words
    /\b(viagra|casino|lottery|prize)\b/i,
  ];

  return spamPatterns.some(pattern => pattern.test(message));
}

/**
 * Validates message length and format
 */
export function validateMessageLength(message: string, channel: string): { valid: boolean; reason?: string } {
  const limits = {
    linkedin_connection: 300,
    linkedin_message: 8000,
    email: 10000,
    twitter_dm: 10000,
  };

  const limit = limits[channel as keyof typeof limits] || 1000;

  if (message.length === 0) {
    return { valid: false, reason: 'Message cannot be empty' };
  }

  if (message.length > limit) {
    return { valid: false, reason: `Message exceeds ${limit} character limit for ${channel}` };
  }

  return { valid: true };
}
