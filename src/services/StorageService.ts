import fs from 'fs/promises';
import path from 'path';
import { Lead, Message, IntentClassification, LeadState, Campaign, ResearchSnapshot } from '../types';
import { validateTransition, assertValidTransition } from '../utils/stateTransitionGuard';
import { isDuplicateMessage } from '../utils/idempotencyGuard';

/**
 * Simple file-based storage service for leads and classifications
 * Can be replaced with a database implementation later
 */
export class StorageService {
  private dataDir: string;
  private leadsFile: string;
  private classificationsFile: string;
  private campaignsFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.leadsFile = path.join(dataDir, 'leads.json');
    this.classificationsFile = path.join(dataDir, 'classifications.json');
    this.campaignsFile = path.join(dataDir, 'campaigns.json');
  }

  /**
   * Initialize storage directory and files
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // Create leads file if it doesn't exist
      try {
        await fs.access(this.leadsFile);
      } catch {
        await fs.writeFile(this.leadsFile, JSON.stringify([], null, 2));
      }

      // Create classifications file if it doesn't exist
      try {
        await fs.access(this.classificationsFile);
      } catch {
        await fs.writeFile(this.classificationsFile, JSON.stringify([], null, 2));
      }

      // Create campaigns file if it doesn't exist
      try {
        await fs.access(this.campaignsFile);
      } catch {
        await fs.writeFile(this.campaignsFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error}`);
    }
  }

  /**
   * Get all leads
   */
  async getLeads(): Promise<Lead[]> {
    try {
      const data = await fs.readFile(this.leadsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading leads:', error);
      return [];
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLead(leadId: string): Promise<Lead | null> {
    const leads = await this.getLeads();
    return leads.find(lead => lead.id === leadId) || null;
  }

  /**
   * Save or update a lead
   * Includes state transition validation
   */
  async saveLead(lead: Lead, options?: {
    skipStateValidation?: boolean;
  }): Promise<Lead> {
    const leads = await this.getLeads();
    const existingIndex = leads.findIndex(l => l.id === lead.id);

    // Validate state transition if updating existing lead
    if (existingIndex >= 0 && !options?.skipStateValidation) {
      const existingLead = leads[existingIndex];

      if (existingLead.state !== lead.state) {
        const validation = validateTransition(existingLead.state, lead.state);

        if (!validation.valid) {
          throw new Error(
            `Invalid state transition: ${existingLead.state} → ${lead.state}. ${validation.reason}`
          );
        }

        if (validation.warning) {
          console.warn(`⚠️  ${validation.warning}`);
        }
      }
    }

    lead.updatedAt = new Date();

    if (existingIndex >= 0) {
      leads[existingIndex] = lead;
    } else {
      leads.push(lead);
    }

    await fs.writeFile(this.leadsFile, JSON.stringify(leads, null, 2));
    return lead;
  }

  /**
   * Update lead state with transition validation
   */
  async updateLeadState(
    leadId: string,
    newState: LeadState,
    options?: {
      allowTerminalOverride?: boolean;
    }
  ): Promise<Lead | null> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      return null;
    }

    // Validate transition
    assertValidTransition(lead.state, newState, {
      allowTerminalOverride: options?.allowTerminalOverride
    });

    lead.state = newState;
    lead.updatedAt = new Date();

    return await this.saveLead(lead, { skipStateValidation: true });  // Already validated above
  }

  /**
   * Add message to lead's conversation history
   * Includes idempotency check to prevent duplicate messages
   */
  async addMessage(
    leadId: string,
    message: Message,
    options?: {
      skipDuplicateCheck?: boolean;
      duplicateWindowMs?: number;
    }
  ): Promise<Lead | null> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      return null;
    }

    // Check for duplicate messages (unless explicitly skipped)
    if (!options?.skipDuplicateCheck) {
      const duplicateCheck = isDuplicateMessage(
        lead,
        message.content,
        message.sender,
        { timeWindowMs: options?.duplicateWindowMs }
      );

      if (duplicateCheck.isDuplicate) {
        console.warn(
          `⚠️  Duplicate message detected for lead ${leadId}: ${duplicateCheck.reason}. Skipping.`
        );
        return lead;  // Return unchanged lead (idempotent)
      }
    }

    lead.conversationHistory.push(message);
    lead.updatedAt = new Date();

    return await this.saveLead(lead, { skipStateValidation: true });
  }

  /**
   * Save classification result
   */
  async saveClassification(
    leadId: string,
    messageId: string,
    classification: IntentClassification
  ): Promise<void> {
    try {
      const data = await fs.readFile(this.classificationsFile, 'utf-8');
      const classifications = JSON.parse(data);

      classifications.push({
        leadId,
        messageId,
        classification,
        timestamp: new Date().toISOString()
      });

      await fs.writeFile(this.classificationsFile, JSON.stringify(classifications, null, 2));

      // Also update the lead's last classification
      const lead = await this.getLead(leadId);
      if (lead) {
        lead.lastClassification = classification;
        await this.saveLead(lead);
      }
    } catch (error) {
      throw new Error(`Failed to save classification: ${error}`);
    }
  }

  /**
   * Get all classifications for a lead
   */
  async getLeadClassifications(leadId: string): Promise<any[]> {
    try {
      const data = await fs.readFile(this.classificationsFile, 'utf-8');
      const classifications = JSON.parse(data);
      return classifications.filter((c: any) => c.leadId === leadId);
    } catch (error) {
      console.error('Error reading classifications:', error);
      return [];
    }
  }

  /**
   * Create a new lead
   */
  async createLead(data: {
    id: string;
    name: string;
    company?: string;
    linkedinUrl?: string;
    email?: string;
    campaignId?: string;
  }): Promise<Lead> {
    const lead: Lead = {
      ...data,
      state: LeadState.NEW,
      conversationHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.saveLead(lead);
  }

  /**
   * Save research snapshot to lead
   */
  async saveResearchSnapshot(leadId: string, snapshot: ResearchSnapshot): Promise<Lead | null> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      return null;
    }

    lead.research_snapshot = snapshot;
    lead.updatedAt = new Date();

    return await this.saveLead(lead);
  }

  /**
   * Get research snapshot for a lead
   */
  async getResearchSnapshot(leadId: string): Promise<ResearchSnapshot | null> {
    const lead = await this.getLead(leadId);
    return lead?.research_snapshot || null;
  }

  // ==================== Campaign Methods ====================

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const data = await fs.readFile(this.campaignsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading campaigns:', error);
      return [];
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const campaigns = await this.getCampaigns();
    return campaigns.find(c => c.id === campaignId) || null;
  }

  /**
   * Save or update a campaign
   */
  async saveCampaign(campaign: Campaign): Promise<Campaign> {
    const campaigns = await this.getCampaigns();
    const existingIndex = campaigns.findIndex(c => c.id === campaign.id);

    campaign.updatedAt = new Date();

    if (existingIndex >= 0) {
      campaigns[existingIndex] = campaign;
    } else {
      campaigns.push(campaign);
    }

    await fs.writeFile(this.campaignsFile, JSON.stringify(campaigns, null, 2));
    return campaign;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    id: string;
    name: string;
    messaging_rules: {
      personalization: boolean;
      maxMessagesPerDay?: number;
      researchRequired?: boolean;
      toneOfVoice?: 'professional' | 'casual' | 'friendly';
    };
  }): Promise<Campaign> {
    const campaign: Campaign = {
      ...data,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.saveCampaign(campaign);
  }

  /**
   * Get all leads for a campaign
   */
  async getLeadsByCampaign(campaignId: string): Promise<Lead[]> {
    const allLeads = await this.getLeads();
    return allLeads.filter(lead => lead.campaignId === campaignId);
  }
}

export default StorageService;
