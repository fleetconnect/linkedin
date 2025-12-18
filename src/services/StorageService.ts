import fs from 'fs/promises';
import path from 'path';
import { Lead, Message, IntentClassification, LeadState } from '../types';

/**
 * Simple file-based storage service for leads and classifications
 * Can be replaced with a database implementation later
 */
export class StorageService {
  private dataDir: string;
  private leadsFile: string;
  private classificationsFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.leadsFile = path.join(dataDir, 'leads.json');
    this.classificationsFile = path.join(dataDir, 'classifications.json');
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
   */
  async saveLead(lead: Lead): Promise<Lead> {
    const leads = await this.getLeads();
    const existingIndex = leads.findIndex(l => l.id === lead.id);

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
   * Update lead state
   */
  async updateLeadState(leadId: string, newState: LeadState): Promise<Lead | null> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      return null;
    }

    lead.state = newState;
    lead.updatedAt = new Date();

    return await this.saveLead(lead);
  }

  /**
   * Add message to lead's conversation history
   */
  async addMessage(leadId: string, message: Message): Promise<Lead | null> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      return null;
    }

    lead.conversationHistory.push(message);
    lead.updatedAt = new Date();

    return await this.saveLead(lead);
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
    linkedinUrl?: string;
    email?: string;
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
}

export default StorageService;
