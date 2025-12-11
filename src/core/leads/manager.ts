/**
 * Lead Manager
 * Handles lead import, validation, and management
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import { leadSchema, icpCriteriaSchema } from '../../utils/validators.js';
import type {
  Lead,
  ICPCriteria,
  LeadValidationResult,
  LeadStatus,
} from '../../types/index.js';

export class LeadManager {
  private leads: Map<string, Lead> = new Map();

  /**
   * Import leads from various sources
   */
  async importLeads(
    source: 'csv' | 'clay' | 'api',
    data: string | object[],
    campaignId?: string
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    logger.info(`Importing leads from ${source}`);

    let rawLeads: any[] = [];
    const errors: string[] = [];

    try {
      switch (source) {
        case 'csv':
          rawLeads = this.parseCSV(data as string);
          break;
        case 'clay':
        case 'api':
          rawLeads = Array.isArray(data) ? data : [data];
          break;
        default:
          throw new Error(`Unsupported source: ${source}`);
      }

      let imported = 0;
      let failed = 0;

      for (const rawLead of rawLeads) {
        try {
          const lead = this.normalizeLead(rawLead, campaignId);
          this.leads.set(lead.id, lead);
          imported++;
        } catch (error) {
          failed++;
          errors.push(
            `Failed to import lead: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      logger.info(`Import complete: ${imported} imported, ${failed} failed`);
      return { imported, failed, errors };
    } catch (error) {
      logger.error('Lead import failed', error);
      throw error;
    }
  }

  /**
   * Validate leads against ICP criteria
   */
  async validateLeads(
    leadIds: string[],
    icpCriteria?: ICPCriteria
  ): Promise<LeadValidationResult[]> {
    logger.info(`Validating ${leadIds.length} leads`);

    const results: LeadValidationResult[] = [];

    for (const leadId of leadIds) {
      const lead = this.leads.get(leadId);
      if (!lead) {
        results.push({
          isValid: false,
          errors: [`Lead not found: ${leadId}`],
          warnings: [],
          lead: {} as Lead,
        });
        continue;
      }

      const validationResult = this.validateLead(lead, icpCriteria);
      results.push(validationResult);

      // Update lead status based on validation
      if (validationResult.isValid) {
        lead.status = LeadStatus.VALIDATED;
        this.leads.set(leadId, lead);
      }
    }

    return results;
  }

  /**
   * Validate a single lead
   */
  private validateLead(lead: Lead, icpCriteria?: ICPCriteria): LeadValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic data validation
    try {
      leadSchema.parse(lead);
    } catch (error: any) {
      errors.push(`Schema validation failed: ${error.message}`);
    }

    // Check required contact info
    if (!lead.email && !lead.linkedInUrl) {
      errors.push('Lead must have either email or LinkedIn URL');
    }

    // Validate email format if present
    if (lead.email && !this.isValidEmail(lead.email)) {
      errors.push('Invalid email format');
    }

    // Validate LinkedIn URL if present
    if (lead.linkedInUrl && !this.isValidLinkedInUrl(lead.linkedInUrl)) {
      errors.push('Invalid LinkedIn URL format');
    }

    // ICP validation
    if (icpCriteria) {
      const icpValidation = this.validateAgainstICP(lead, icpCriteria);
      errors.push(...icpValidation.errors);
      warnings.push(...icpValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      lead,
    };
  }

  /**
   * Validate lead against ICP criteria
   */
  private validateAgainstICP(
    lead: Lead,
    criteria: ICPCriteria
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check excluded companies
    if (criteria.excludedCompanies?.includes(lead.company)) {
      errors.push(`Company is in exclusion list: ${lead.company}`);
    }

    // Check excluded titles
    if (criteria.excludedTitles?.some((excludedTitle) =>
      lead.title.toLowerCase().includes(excludedTitle.toLowerCase())
    )) {
      errors.push(`Title is in exclusion list: ${lead.title}`);
    }

    // Check title match
    const titleMatch = criteria.titles.some((title) =>
      lead.title.toLowerCase().includes(title.toLowerCase())
    );
    if (!titleMatch) {
      warnings.push(`Title "${lead.title}" doesn't match ICP criteria`);
    }

    // Check company size
    if (criteria.companySize && lead.companySize) {
      if (
        (criteria.companySize.min && lead.companySize < criteria.companySize.min) ||
        (criteria.companySize.max && lead.companySize > criteria.companySize.max)
      ) {
        warnings.push(
          `Company size ${lead.companySize} outside ICP range (${criteria.companySize.min}-${criteria.companySize.max})`
        );
      }
    }

    // Check location
    if (criteria.locations && lead.location) {
      const locationMatch = criteria.locations.some((loc) =>
        lead.location?.toLowerCase().includes(loc.toLowerCase())
      );
      if (!locationMatch) {
        warnings.push(`Location "${lead.location}" not in ICP criteria`);
      }
    }

    // Check industry
    if (criteria.industries && lead.industry) {
      const industryMatch = criteria.industries.some((ind) =>
        lead.industry?.toLowerCase().includes(ind.toLowerCase())
      );
      if (!industryMatch) {
        warnings.push(`Industry "${lead.industry}" not in ICP criteria`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Get lead by ID
   */
  getLead(leadId: string): Lead | undefined {
    return this.leads.get(leadId);
  }

  /**
   * Get all leads
   */
  getAllLeads(): Lead[] {
    return Array.from(this.leads.values());
  }

  /**
   * Get leads by campaign
   */
  getLeadsByCampaign(campaignId: string): Lead[] {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.enrichmentData?.campaignId === campaignId
    );
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: LeadStatus,
    tags?: string[]
  ): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    lead.status = status;
    lead.updatedAt = new Date();

    if (tags) {
      lead.tags = [...(lead.tags || []), ...tags];
    }

    this.leads.set(leadId, lead);
    logger.info(`Updated lead ${leadId} status to ${status}`);

    return lead;
  }

  /**
   * Enrich lead with additional data
   */
  async enrichLead(leadId: string, enrichmentData: Record<string, any>): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    lead.enrichmentData = {
      ...lead.enrichmentData,
      ...enrichmentData,
    };
    lead.updatedAt = new Date();

    this.leads.set(leadId, lead);
    logger.info(`Enriched lead ${leadId}`);

    return lead;
  }

  /**
   * Remove duplicate leads
   */
  async deduplicateLeads(campaignId?: string): Promise<{ removed: number; kept: number }> {
    const leadsToCheck = campaignId
      ? this.getLeadsByCampaign(campaignId)
      : this.getAllLeads();

    const seen = new Set<string>();
    let removed = 0;
    let kept = 0;

    for (const lead of leadsToCheck) {
      const key = lead.email || lead.linkedInUrl || `${lead.firstName}-${lead.lastName}-${lead.company}`;

      if (seen.has(key)) {
        this.leads.delete(lead.id);
        removed++;
      } else {
        seen.add(key);
        kept++;
      }
    }

    logger.info(`Deduplication complete: ${kept} kept, ${removed} removed`);
    return { removed, kept };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private parseCSV(filePath: string): any[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      logger.error('Failed to parse CSV', error);
      throw new Error('Failed to parse CSV file');
    }
  }

  private normalizeLead(rawLead: any, campaignId?: string): Lead {
    return {
      id: rawLead.id || uuidv4(),
      firstName: rawLead.firstName || rawLead.first_name || '',
      lastName: rawLead.lastName || rawLead.last_name || '',
      email: rawLead.email || undefined,
      linkedInUrl: rawLead.linkedInUrl || rawLead.linkedin_url || undefined,
      title: rawLead.title || rawLead.job_title || '',
      company: rawLead.company || rawLead.company_name || '',
      companySize: rawLead.companySize || rawLead.company_size || undefined,
      location: rawLead.location || undefined,
      industry: rawLead.industry || undefined,
      enrichmentData: {
        ...rawLead.enrichmentData,
        campaignId,
      },
      tags: rawLead.tags || [],
      status: LeadStatus.NEW,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidLinkedInUrl(url: string): boolean {
    return url.includes('linkedin.com/in/');
  }
}
