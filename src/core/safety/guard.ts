/**
 * Safety Guard
 * Implements safety checks, rate limiting, and deliverability protection
 */

import { logger } from '../../utils/logger.js';
import { containsSpamIndicators } from '../../utils/validators.js';
import type { SafeguardSettings, Channel } from '../../types/index.js';

interface UsageTracker {
  date: string;
  linkedInConnections: number;
  linkedInMessages: number;
  emails: number;
  profileViews: number;
  lastActionTime: Date;
}

interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  suggestedDelay?: number;
}

export class SafetyGuard {
  private usageTrackers: Map<string, UsageTracker> = new Map();
  private accountWarnings: Map<string, string[]> = new Map();
  private blockedDomains: Set<string> = new Set(['example.com', 'test.com']);
  private spamPatterns: RegExp[] = [
    /\b(viagra|casino|lottery|prize winner)\b/i,
    /\${3,}/,
    /!{4,}/,
    /\b(CLICK HERE|BUY NOW|ACT NOW)\b/g,
  ];

  constructor(private settings: SafeguardSettings) {
    logger.info('Safety Guard initialized', { settings });
  }

  /**
   * Check if an action is allowed based on safety limits
   */
  async checkAction(
    action: string,
    count: number = 1,
    accountId: string = 'default'
  ): Promise<SafetyCheckResult> {
    const today = new Date().toISOString().split('T')[0];
    const tracker = this.getOrCreateTracker(accountId, today);

    switch (action) {
      case 'linkedin_connection':
      case Channel.LINKEDIN_CONNECTION:
        return this.checkLinkedInConnection(tracker, count);

      case 'linkedin_message':
      case Channel.LINKEDIN_MESSAGE:
        return this.checkLinkedInMessage(tracker, count);

      case 'email':
      case Channel.EMAIL:
        return this.checkEmail(tracker, count);

      default:
        return { allowed: true };
    }
  }

  /**
   * Validate message content for spam and safety issues
   */
  validateMessage(content: string, subject?: string): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for spam indicators
    if (containsSpamIndicators(content)) {
      issues.push('Message contains spam indicators');
    }

    // Check for additional spam patterns
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        issues.push(`Message matches spam pattern: ${pattern.source}`);
      }
    }

    // Check message length
    if (content.length < 10) {
      issues.push('Message too short (minimum 10 characters)');
    }

    if (content.length > 2000) {
      warnings.push('Message is quite long, consider shortening for better engagement');
    }

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      warnings.push('Excessive capitalization detected');
    }

    // Check for excessive punctuation
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      warnings.push('Excessive exclamation marks');
    }

    // Check for URLs and email addresses
    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 2) {
      warnings.push('Multiple URLs may reduce deliverability');
    }

    // Subject line checks
    if (subject) {
      if (subject.length > 60) {
        warnings.push('Subject line longer than recommended 60 characters');
      }

      if (containsSpamIndicators(subject)) {
        issues.push('Subject line contains spam indicators');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Check email deliverability
   */
  async checkEmailDeliverability(email: string, domain: string): Promise<{
    deliverable: boolean;
    reason?: string;
    risk: 'low' | 'medium' | 'high';
  }> {
    // Check if domain is blocked
    if (this.blockedDomains.has(domain)) {
      return {
        deliverable: false,
        reason: 'Domain is blocked',
        risk: 'high',
      };
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        deliverable: false,
        reason: 'Invalid email format',
        risk: 'high',
      };
    }

    // Check for disposable email domains
    const disposableDomains = [
      'tempmail.com',
      'guerrillamail.com',
      '10minutemail.com',
      'throwaway.email',
    ];

    if (disposableDomains.some((d) => domain.includes(d))) {
      return {
        deliverable: false,
        reason: 'Disposable email address',
        risk: 'high',
      };
    }

    // Check for common typos in popular domains
    const popularDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const typoCheck = this.checkDomainTypos(domain, popularDomains);
    if (typoCheck.isTypo) {
      return {
        deliverable: true,
        reason: `Possible typo: did you mean ${typoCheck.suggestion}?`,
        risk: 'medium',
      };
    }

    return {
      deliverable: true,
      risk: 'low',
    };
  }

  /**
   * Calculate safe sending rate based on account age and history
   */
  calculateSafeRate(params: {
    accountAge: number; // days
    historicalBounceRate: number;
    historicalReplyRate: number;
  }): {
    dailyLimit: number;
    hourlyLimit: number;
    delayBetweenMessages: number;
  } {
    let dailyLimit = 50; // Conservative default

    // Increase limits for mature accounts with good history
    if (params.accountAge > 90 && params.historicalBounceRate < 0.05) {
      dailyLimit = 150;
    } else if (params.accountAge > 30 && params.historicalBounceRate < 0.1) {
      dailyLimit = 100;
    }

    // Reduce limits for accounts with poor metrics
    if (params.historicalBounceRate > 0.15) {
      dailyLimit = Math.max(20, dailyLimit - 30);
    }

    if (params.historicalReplyRate < 0.02) {
      dailyLimit = Math.max(30, dailyLimit - 20);
    }

    return {
      dailyLimit,
      hourlyLimit: Math.ceil(dailyLimit / 8), // Spread over 8 hours
      delayBetweenMessages: Math.ceil((8 * 60 * 60) / dailyLimit), // seconds
    };
  }

  /**
   * Simulate behavioral patterns to appear more human
   */
  getRandomDelay(baseDelay: number): number {
    // Add randomness: ±30% of base delay
    const variance = baseDelay * 0.3;
    const random = Math.random() * variance * 2 - variance;
    return Math.max(60, Math.round(baseDelay + random)); // Minimum 60 seconds
  }

  /**
   * Get recommended send time based on recipient timezone
   */
  getOptimalSendTime(recipientTimezone: string = 'America/New_York'): {
    hour: number;
    reason: string;
  } {
    // Business hours: 9 AM - 5 PM in recipient's timezone
    const optimalHours = [9, 10, 11, 14, 15, 16]; // Avoid lunch hour
    const randomHour = optimalHours[Math.floor(Math.random() * optimalHours.length)];

    return {
      hour: randomHour,
      reason: `Sending during business hours in ${recipientTimezone}`,
    };
  }

  /**
   * Add warning to account
   */
  addWarning(accountId: string, warning: string): void {
    const warnings = this.accountWarnings.get(accountId) || [];
    warnings.push(`${new Date().toISOString()}: ${warning}`);
    this.accountWarnings.set(accountId, warnings);

    logger.warn(`Account warning added for ${accountId}: ${warning}`);

    // If too many warnings, suggest pausing
    if (warnings.length >= 5) {
      logger.error(`Account ${accountId} has ${warnings.length} warnings - recommend pausing`);
    }
  }

  /**
   * Get account health status
   */
  getAccountHealth(accountId: string): {
    status: 'healthy' | 'warning' | 'critical';
    warnings: string[];
    usageToday: UsageTracker;
  } {
    const warnings = this.accountWarnings.get(accountId) || [];
    const today = new Date().toISOString().split('T')[0];
    const usage = this.getOrCreateTracker(accountId, today);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (warnings.length >= 5) {
      status = 'critical';
    } else if (warnings.length >= 2) {
      status = 'warning';
    }

    return {
      status,
      warnings,
      usageToday: usage,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getOrCreateTracker(accountId: string, date: string): UsageTracker {
    const key = `${accountId}-${date}`;
    let tracker = this.usageTrackers.get(key);

    if (!tracker) {
      tracker = {
        date,
        linkedInConnections: 0,
        linkedInMessages: 0,
        emails: 0,
        profileViews: 0,
        lastActionTime: new Date(),
      };
      this.usageTrackers.set(key, tracker);

      // Clean up old trackers
      this.cleanupOldTrackers();
    }

    return tracker;
  }

  private checkLinkedInConnection(
    tracker: UsageTracker,
    count: number
  ): SafetyCheckResult {
    const limit = this.settings.maxDailyLinkedInConnections;

    if (tracker.linkedInConnections + count > limit) {
      return {
        allowed: false,
        reason: `Daily LinkedIn connection limit reached (${limit})`,
      };
    }

    // Check rate limiting
    const timeSinceLastAction = Date.now() - tracker.lastActionTime.getTime();
    const minDelay = 90 * 1000; // 90 seconds minimum between connections

    if (timeSinceLastAction < minDelay) {
      return {
        allowed: false,
        reason: 'Rate limit: wait before sending next connection request',
        suggestedDelay: Math.ceil((minDelay - timeSinceLastAction) / 1000),
      };
    }

    // Update tracker
    tracker.linkedInConnections += count;
    tracker.lastActionTime = new Date();

    return { allowed: true };
  }

  private checkLinkedInMessage(
    tracker: UsageTracker,
    count: number
  ): SafetyCheckResult {
    const limit = this.settings.maxDailyLinkedInMessages;

    if (tracker.linkedInMessages + count > limit) {
      return {
        allowed: false,
        reason: `Daily LinkedIn message limit reached (${limit})`,
      };
    }

    // Check rate limiting
    const timeSinceLastAction = Date.now() - tracker.lastActionTime.getTime();
    const minDelay = 120 * 1000; // 120 seconds minimum between messages

    if (timeSinceLastAction < minDelay) {
      return {
        allowed: false,
        reason: 'Rate limit: wait before sending next message',
        suggestedDelay: Math.ceil((minDelay - timeSinceLastAction) / 1000),
      };
    }

    // Update tracker
    tracker.linkedInMessages += count;
    tracker.lastActionTime = new Date();

    return { allowed: true };
  }

  private checkEmail(tracker: UsageTracker, count: number): SafetyCheckResult {
    const limit = this.settings.maxDailyEmails;

    if (tracker.emails + count > limit) {
      return {
        allowed: false,
        reason: `Daily email limit reached (${limit})`,
      };
    }

    // Update tracker
    tracker.emails += count;
    tracker.lastActionTime = new Date();

    return { allowed: true };
  }

  private checkDomainTypos(
    domain: string,
    popularDomains: string[]
  ): { isTypo: boolean; suggestion?: string } {
    for (const popular of popularDomains) {
      const distance = this.levenshteinDistance(domain, popular);
      if (distance === 1 || distance === 2) {
        return { isTypo: true, suggestion: popular };
      }
    }

    return { isTypo: false };
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private cleanupOldTrackers(): void {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const cutoffDate = threeDaysAgo.toISOString().split('T')[0];

    for (const [key, tracker] of this.usageTrackers.entries()) {
      if (tracker.date < cutoffDate) {
        this.usageTrackers.delete(key);
      }
    }
  }
}
