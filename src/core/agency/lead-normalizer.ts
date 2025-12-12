/**
 * Lead Normalizer
 * Converts leads from any source into unified schema
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import type { Lead } from '../../types/index.js';

export interface RawLead {
  [key: string]: any;
}

export interface NormalizedLead extends Lead {
  lead_id: string;
  source: string;
}

export interface LeadNormalizationResult {
  leads: NormalizedLead[];
  stats: {
    input_count: number;
    output_count: number;
    duplicates_removed: number;
    invalid_removed: number;
  };
}

export class LeadNormalizer {
  /**
   * Normalize leads from any source
   */
  normalize(
    rawLeads: RawLead[],
    source: 'salesnav' | 'csv' | 'heyreach' | 'jotform' | 'api'
  ): LeadNormalizationResult {
    logger.info('Normalizing leads', { source, count: rawLeads.length });

    const normalized: NormalizedLead[] = [];
    const seenKeys = new Set<string>();
    let duplicates = 0;
    let invalid = 0;

    for (const raw of rawLeads) {
      try {
        const lead = this.normalizeOne(raw, source);

        if (!this.isValid(lead)) {
          invalid++;
          continue;
        }

        // Generate dedup key
        const dedupKey = this.generateDedupKey(lead);
        if (seenKeys.has(dedupKey)) {
          duplicates++;
          continue;
        }

        seenKeys.add(dedupKey);
        normalized.push(lead);
      } catch (error) {
        logger.warn('Failed to normalize lead', { error, raw });
        invalid++;
      }
    }

    logger.info('Lead normalization complete', {
      input: rawLeads.length,
      output: normalized.length,
      duplicates,
      invalid,
    });

    return {
      leads: normalized,
      stats: {
        input_count: rawLeads.length,
        output_count: normalized.length,
        duplicates_removed: duplicates,
        invalid_removed: invalid,
      },
    };
  }

  /**
   * Normalize a single lead based on source
   */
  private normalizeOne(raw: RawLead, source: string): NormalizedLead {
    switch (source) {
      case 'salesnav':
        return this.normalizeSalesNav(raw);
      case 'csv':
        return this.normalizeCSV(raw);
      case 'heyreach':
        return this.normalizeHeyReach(raw);
      case 'jotform':
        return this.normalizeJotform(raw);
      case 'api':
        return this.normalizeAPI(raw);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }

  /**
   * Sales Navigator export format
   */
  private normalizeSalesNav(raw: RawLead): NormalizedLead {
    return {
      id: uuidv4(),
      lead_id: this.generateLeadId(raw),
      firstName: this.cleanString(raw['First Name'] || raw.firstName),
      lastName: this.cleanString(raw['Last Name'] || raw.lastName),
      email: this.cleanEmail(raw['Email'] || raw.email),
      linkedInUrl: this.cleanLinkedInUrl(
        raw['Profile URL'] || raw.linkedInUrl || raw.linkedin_url
      ),
      title: this.cleanString(raw['Title'] || raw.title),
      company: this.cleanString(raw['Company'] || raw.company),
      companySize: this.parseCompanySize(
        raw['Company Size'] || raw.companySize || raw.company_size
      ),
      location: this.cleanString(raw['Location'] || raw.location),
      industry: this.cleanString(raw['Industry'] || raw.industry),
      source: 'salesnav',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generic CSV format
   */
  private normalizeCSV(raw: RawLead): NormalizedLead {
    // Try common field names
    return {
      id: uuidv4(),
      lead_id: this.generateLeadId(raw),
      firstName: this.cleanString(
        raw.firstName ||
          raw.first_name ||
          raw['First Name'] ||
          raw.firstname ||
          ''
      ),
      lastName: this.cleanString(
        raw.lastName || raw.last_name || raw['Last Name'] || raw.lastname || ''
      ),
      email: this.cleanEmail(raw.email || raw.Email || ''),
      linkedInUrl: this.cleanLinkedInUrl(
        raw.linkedInUrl ||
          raw.linkedin_url ||
          raw.linkedin ||
          raw['LinkedIn URL'] ||
          ''
      ),
      title: this.cleanString(raw.title || raw.Title || raw.job_title || ''),
      company: this.cleanString(
        raw.company || raw.Company || raw.company_name || ''
      ),
      companySize: this.parseCompanySize(
        raw.companySize || raw.company_size || raw['Company Size']
      ),
      location: this.cleanString(
        raw.location || raw.Location || raw.city || ''
      ),
      industry: this.cleanString(raw.industry || raw.Industry || ''),
      source: 'csv',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * HeyReach export format
   */
  private normalizeHeyReach(raw: RawLead): NormalizedLead {
    return {
      id: uuidv4(),
      lead_id: raw.id || this.generateLeadId(raw),
      firstName: this.cleanString(raw.first_name || raw.firstName),
      lastName: this.cleanString(raw.last_name || raw.lastName),
      email: this.cleanEmail(raw.email),
      linkedInUrl: this.cleanLinkedInUrl(raw.linkedin_url || raw.linkedInUrl),
      title: this.cleanString(raw.title || raw.job_title),
      company: this.cleanString(raw.company || raw.company_name),
      companySize: this.parseCompanySize(raw.company_size || raw.companySize),
      location: this.cleanString(raw.location),
      industry: this.cleanString(raw.industry),
      source: 'heyreach',
      status: raw.status || 'new',
      createdAt: raw.created_at || new Date().toISOString(),
      updatedAt: raw.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Jotform submission format
   */
  private normalizeJotform(raw: RawLead): NormalizedLead {
    // Jotform uses field IDs, so this needs mapping
    return {
      id: uuidv4(),
      lead_id: this.generateLeadId(raw),
      firstName: this.cleanString(raw.firstName || raw.first_name || ''),
      lastName: this.cleanString(raw.lastName || raw.last_name || ''),
      email: this.cleanEmail(raw.email || ''),
      linkedInUrl: this.cleanLinkedInUrl(raw.linkedInUrl || raw.linkedin || ''),
      title: this.cleanString(raw.title || ''),
      company: this.cleanString(raw.company || ''),
      companySize: this.parseCompanySize(raw.companySize || raw.company_size),
      location: this.cleanString(raw.location || ''),
      industry: this.cleanString(raw.industry || ''),
      source: 'jotform',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * API format (assumes already normalized)
   */
  private normalizeAPI(raw: RawLead): NormalizedLead {
    return {
      id: uuidv4(),
      lead_id: raw.lead_id || this.generateLeadId(raw),
      firstName: this.cleanString(raw.firstName || raw.first_name),
      lastName: this.cleanString(raw.lastName || raw.last_name),
      email: this.cleanEmail(raw.email),
      linkedInUrl: this.cleanLinkedInUrl(raw.linkedInUrl || raw.linkedin_url),
      title: this.cleanString(raw.title),
      company: this.cleanString(raw.company),
      companySize: this.parseCompanySize(raw.companySize || raw.company_size),
      location: this.cleanString(raw.location),
      industry: this.cleanString(raw.industry),
      source: 'api',
      status: raw.status || 'new',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Validation
   */
  private isValid(lead: NormalizedLead): boolean {
    // Must have name OR company
    const hasName = lead.firstName || lead.lastName;
    const hasCompany = lead.company && lead.company.length > 0;

    // Must have at least one contact method
    const hasContact = lead.email || lead.linkedInUrl;

    return (hasName || hasCompany) && hasContact;
  }

  /**
   * Generate stable lead ID for deduplication
   */
  private generateLeadId(lead: RawLead): string {
    // Use email if available, otherwise LinkedIn URL, otherwise name+company
    const key =
      lead.email ||
      lead.linkedInUrl ||
      lead.linkedin_url ||
      `${lead.firstName}${lead.lastName}${lead.company}`;

    return crypto.createHash('md5').update(key.toLowerCase()).digest('hex');
  }

  /**
   * Generate dedup key (more strict than lead_id)
   */
  private generateDedupKey(lead: NormalizedLead): string {
    if (lead.email) return `email:${lead.email.toLowerCase()}`;
    if (lead.linkedInUrl)
      return `linkedin:${lead.linkedInUrl.toLowerCase()}`;
    return `name:${lead.firstName}${lead.lastName}${lead.company}`.toLowerCase();
  }

  /**
   * Cleaning helpers
   */
  private cleanString(value: any): string {
    if (!value) return '';
    return String(value).trim();
  }

  private cleanEmail(value: any): string {
    if (!value) return '';
    const email = String(value).trim().toLowerCase();
    // Basic validation
    if (!email.includes('@') || !email.includes('.')) return '';
    return email;
  }

  private cleanLinkedInUrl(value: any): string {
    if (!value) return '';
    let url = String(value).trim();

    // Normalize LinkedIn URLs
    if (!url.startsWith('http')) {
      url = `https://linkedin.com/in/${url}`;
    }

    return url;
  }

  private parseCompanySize(value: any): number | undefined {
    if (!value) return undefined;
    if (typeof value === 'number') return value;

    const str = String(value).toLowerCase();

    // Handle ranges like "50-200"
    if (str.includes('-')) {
      const [min, max] = str.split('-').map((n) => parseInt(n.trim()));
      return Math.round((min + max) / 2);
    }

    // Handle "1000+" format
    if (str.includes('+')) {
      return parseInt(str.replace(/\D/g, ''));
    }

    // Try to parse as number
    const parsed = parseInt(str.replace(/\D/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }
}
