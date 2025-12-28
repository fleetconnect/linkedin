/**
 * Lead Data Normalization Utilities
 *
 * Ensures consistent data formatting across lead records
 */

export interface NormalizationResult {
  normalized: boolean;
  changes: string[];
}

/**
 * Normalize a lead's data fields
 * Returns the normalized lead and a report of changes made
 */
export function normalizeLead(lead: any): { lead: any; result: NormalizationResult } {
  const changes: string[] = [];
  const normalized = { ...lead };

  // Normalize name (Title Case, trim)
  if (normalized.name && typeof normalized.name === 'string') {
    const originalName = normalized.name;
    normalized.name = toTitleCase(normalized.name.trim());
    if (normalized.name !== originalName) {
      changes.push(`name: "${originalName}" → "${normalized.name}"`);
    }
  }

  // Normalize company (Title Case, trim)
  if (normalized.company && typeof normalized.company === 'string') {
    const originalCompany = normalized.company;
    normalized.company = normalized.company.trim();
    // Don't force title case for companies (e.g., "iPhone" should stay "iPhone")
    if (normalized.company !== originalCompany) {
      changes.push(`company: "${originalCompany}" → "${normalized.company}"`);
    }
  }

  // Normalize email (lowercase, trim)
  if (normalized.email && typeof normalized.email === 'string') {
    const originalEmail = normalized.email;
    normalized.email = normalized.email.trim().toLowerCase();
    if (normalized.email !== originalEmail) {
      changes.push(`email: "${originalEmail}" → "${normalized.email}"`);
    }
    // Validate email format
    if (!isValidEmail(normalized.email)) {
      changes.push(`email: INVALID FORMAT - "${normalized.email}"`);
    }
  }

  // Normalize LinkedIn URL
  if (normalized.linkedinUrl && typeof normalized.linkedinUrl === 'string') {
    const originalUrl = normalized.linkedinUrl;
    normalized.linkedinUrl = normalizeLinkedInUrl(normalized.linkedinUrl);
    if (normalized.linkedinUrl !== originalUrl) {
      changes.push(`linkedinUrl: "${originalUrl}" → "${normalized.linkedinUrl}"`);
    }
  }

  // Normalize title (trim)
  if (normalized.title && typeof normalized.title === 'string') {
    const originalTitle = normalized.title;
    normalized.title = normalized.title.trim();
    if (normalized.title !== originalTitle) {
      changes.push(`title: "${originalTitle}" → "${normalized.title}"`);
    }
  }

  // Ensure timestamps are Date objects
  if (normalized.createdAt && !(normalized.createdAt instanceof Date)) {
    normalized.createdAt = new Date(normalized.createdAt);
    changes.push('createdAt: converted to Date object');
  }

  if (normalized.updatedAt && !(normalized.updatedAt instanceof Date)) {
    normalized.updatedAt = new Date(normalized.updatedAt);
    changes.push('updatedAt: converted to Date object');
  }

  // Clean up null/undefined optional fields
  if (normalized.email === null || normalized.email === undefined) {
    delete normalized.email;
  }
  if (normalized.company === null || normalized.company === undefined) {
    delete normalized.company;
  }
  if (normalized.linkedinUrl === null || normalized.linkedinUrl === undefined) {
    delete normalized.linkedinUrl;
  }
  if (normalized.title === null || normalized.title === undefined) {
    delete normalized.title;
  }

  return {
    lead: normalized,
    result: {
      normalized: changes.length > 0,
      changes
    }
  };
}

/**
 * Convert string to Title Case
 * Handles: "john doe" → "John Doe", "JOHN DOE" → "John Doe"
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle special cases (McDonalds, O'Brien, etc.)
      if (word.startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3);
      }
      if (word.includes("'") && word.indexOf("'") > 0) {
        const parts = word.split("'");
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + "'" +
               parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize LinkedIn URL to consistent format
 * Removes query params, trailing slashes, ensures https
 *
 * Examples:
 * - linkedin.com/in/johndoe/ → https://linkedin.com/in/johndoe
 * - http://www.linkedin.com/in/johndoe?trk=123 → https://linkedin.com/in/johndoe
 * - /in/johndoe → https://linkedin.com/in/johndoe
 */
function normalizeLinkedInUrl(url: string): string {
  let normalized = url.trim();

  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove www. if present
  normalized = normalized.replace(/^www\./, '');

  // Remove query parameters
  if (normalized.includes('?')) {
    normalized = normalized.split('?')[0];
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Handle case where only path is provided (e.g., "/in/johndoe")
  if (normalized.startsWith('/')) {
    normalized = 'linkedin.com' + normalized;
  }

  // Ensure it starts with linkedin.com
  if (!normalized.startsWith('linkedin.com')) {
    // Invalid LinkedIn URL - return as-is with https
    return 'https://' + normalized;
  }

  // Add https protocol
  return 'https://' + normalized;
}

/**
 * Normalize conversation history timestamps
 */
export function normalizeConversationHistory(history: any[]): any[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
  }));
}

/**
 * Batch normalize multiple leads
 */
export function normalizeLeads(leads: any[]): Array<{ lead: any; result: NormalizationResult }> {
  return leads.map(lead => normalizeLead(lead));
}
