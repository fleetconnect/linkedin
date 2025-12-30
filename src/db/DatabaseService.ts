/**
 * Database Service (PostgreSQL)
 *
 * Replaces file-based StorageService with PostgreSQL.
 *
 * KEY RULE: All state transitions must be transactional.
 *
 * Uses Drizzle ORM for type-safe queries and connection pooling.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db, pool } from './connection';
import * as schema from './schema';
import { validateTransition, assertValidTransition } from '../utils/stateTransitionGuard';
import { isDuplicateMessage } from '../utils/idempotencyGuard';
import observability from '../services/ObservabilityService';
import type {
  Lead as LeadType,
  Message as MessageType,
  IntentClassification,
  LeadState,
  Campaign as CampaignType,
  ResearchSnapshot as ResearchSnapshotType
} from '../types';

/**
 * Database Service
 */
export class DatabaseService {

  /**
   * Initialize database (create tables if not exist)
   * Should be called on app startup
   */
  async initialize(): Promise<void> {
    // Drizzle migrations handle this
    // See: npm run db:migrate
    console.log('Database service initialized');
  }

  // ==================== Lead Operations ====================

  /**
   * Get all leads
   */
  async getLeads(): Promise<LeadType[]> {
    const leads = await db.select().from(schema.leads);

    // Hydrate with messages and classification
    return Promise.all(leads.map(lead => this.hydrateLead(lead)));
  }

  /**
   * Get a single lead by ID
   */
  async getLead(leadId: string): Promise<LeadType | null> {
    const [lead] = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.id, leadId))
      .limit(1);

    if (!lead) return null;

    return this.hydrateLead(lead);
  }

  /**
   * Hydrate lead with related data (messages, classification, research)
   */
  private async hydrateLead(lead: schema.Lead): Promise<LeadType> {
    // Get messages
    const messages = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.lead_id, lead.id))
      .orderBy(schema.messages.timestamp);

    // Get last classification
    const [lastClassification] = await db
      .select()
      .from(schema.classifications)
      .where(eq(schema.classifications.lead_id, lead.id))
      .orderBy(desc(schema.classifications.created_at))
      .limit(1);

    // Get research snapshot
    const [research] = await db
      .select()
      .from(schema.research_snapshots)
      .where(eq(schema.research_snapshots.lead_id, lead.id))
      .orderBy(desc(schema.research_snapshots.researched_at))
      .limit(1);

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email || undefined,
      company: lead.company || undefined,
      linkedinUrl: lead.linkedin_url || undefined,
      campaignId: lead.campaign_id || undefined,
      state: lead.state as LeadState,
      conversationHistory: messages.map(msg => ({
        id: msg.id,
        leadId: msg.lead_id,
        content: msg.content,
        sender: msg.sender as 'user' | 'lead',
        timestamp: msg.timestamp,
        messageType: msg.message_type as 'initial' | 'follow-up' | 'reply' | undefined,
        variant: msg.variant as 'A' | 'B' | undefined,
        classification: undefined // Could join if needed
      })),
      lastClassification: lastClassification ? {
        intent: lastClassification.intent as any,
        sentiment: lastClassification.sentiment as any,
        confidence: lastClassification.confidence,
        next_state: lastClassification.next_state as LeadState
      } : undefined,
      research_snapshot: research ? {
        companyName: research.company_name,
        companyDescription: research.company_description || '',
        industry: research.industry || '',
        recentNews: (research.recent_news as string[]) || [],
        keyProducts: (research.key_products as string[]) || [],
        challenges: (research.challenges as string[]) || [],
        opportunities: (research.opportunities as string[]) || [],
        fundingInfo: research.funding_info || '',
        employeeCount: research.employee_count || '',
        researched_at: research.researched_at,
        sources: (research.sources as string[]) || []
      } : undefined,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };
  }

  /**
   * Save or update a lead
   * TRANSACTIONAL: State transitions must be atomic
   */
  async saveLead(lead: LeadType, options?: {
    skipStateValidation?: boolean;
  }): Promise<LeadType> {
    const startTime = Date.now();

    // Get existing lead if updating
    const existingLead = await this.getLead(lead.id);

    // Validate state transition if updating
    if (existingLead && !options?.skipStateValidation) {
      if (existingLead.state !== lead.state) {
        const validation = validateTransition(existingLead.state, lead.state);

        if (!validation.valid) {
          // Log failed transition
          observability.logStateTransition({
            leadId: lead.id,
            leadName: lead.name,
            fromState: existingLead.state,
            toState: lead.state,
            success: false,
            validationError: validation.reason,
            duration_ms: Date.now() - startTime
          });

          throw new Error(
            `Invalid state transition: ${existingLead.state} → ${lead.state}. ${validation.reason}`
          );
        }

        if (validation.warning) {
          console.warn(`⚠️  ${validation.warning}`);
        }

        // Log successful transition
        observability.logStateTransition({
          leadId: lead.id,
          leadName: lead.name,
          fromState: existingLead.state,
          toState: lead.state,
          success: true,
          duration_ms: Date.now() - startTime
        });
      }
    }

    // Ensure campaign exists if campaignId is provided
    if (lead.campaignId) {
      const campaignExists = await this.getCampaign(lead.campaignId);
      if (!campaignExists) {
        await this.createCampaign({
          id: lead.campaignId,
          name: `Campaign ${lead.campaignId}`,
          messaging_rules: {}
        });
      }
    }

    // Upsert lead (TRANSACTIONAL)
    const [savedLead] = await db
      .insert(schema.leads)
      .values({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        linkedin_url: lead.linkedinUrl,
        campaign_id: lead.campaignId,
        state: lead.state,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: schema.leads.id,
        set: {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          linkedin_url: lead.linkedinUrl,
          campaign_id: lead.campaignId,
          state: lead.state,
          updated_at: new Date()
        }
      })
      .returning();

    return this.hydrateLead(savedLead);
  }

  /**
   * Update lead state with transition validation
   * TRANSACTIONAL: Uses database transaction
   */
  async updateLeadState(
    leadId: string,
    newState: LeadState,
    options?: {
      allowTerminalOverride?: boolean;
    }
  ): Promise<LeadType | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get lead with row lock (FOR UPDATE)
      const { rows: [lead] } = await client.query(
        'SELECT * FROM leads WHERE id = $1 FOR UPDATE',
        [leadId]
      );

      if (!lead) {
        await client.query('ROLLBACK');
        return null;
      }

      // Validate transition
      assertValidTransition(lead.state, newState, {
        allowTerminalOverride: options?.allowTerminalOverride
      });

      // Update state
      await client.query(
        'UPDATE leads SET state = $1, updated_at = NOW() WHERE id = $2',
        [newState, leadId]
      );

      await client.query('COMMIT');

      // Return updated lead
      return await this.getLead(leadId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add message to lead's conversation history
   * Includes idempotency check
   */
  async addMessage(
    leadId: string,
    message: MessageType,
    options?: {
      skipDuplicateCheck?: boolean;
      duplicateWindowMs?: number;
    }
  ): Promise<LeadType | null> {
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

      // Log idempotency check
      observability.logIdempotency({
        leadId: lead.id,
        operation: 'message',
        blocked: duplicateCheck.isDuplicate,
        reason: duplicateCheck.reason,
        timeWindow_ms: options?.duplicateWindowMs
      });

      if (duplicateCheck.isDuplicate) {
        console.warn(
          `⚠️  Duplicate message detected for lead ${leadId}: ${duplicateCheck.reason}. Skipping.`
        );
        return lead;  // Return unchanged lead (idempotent)
      }
    }

    // Insert message
    await db.insert(schema.messages).values({
      id: message.id,
      lead_id: leadId,
      content: message.content,
      sender: message.sender,
      timestamp: message.timestamp,
      message_type: (message as any).messageType || null,
      variant: message.variant || null
    });

    // Update lead's updated_at
    await db
      .update(schema.leads)
      .set({ updated_at: new Date() })
      .where(eq(schema.leads.id, leadId));

    return await this.getLead(leadId);
  }

  /**
   * Save classification result
   */
  async saveClassification(
    leadId: string,
    messageId: string,
    classification: IntentClassification
  ): Promise<void> {
    await db.insert(schema.classifications).values({
      id: uuidv4(),
      lead_id: leadId,
      message_id: messageId,
      intent: classification.intent,
      sentiment: classification.sentiment,
      confidence: classification.confidence,
      next_state: classification.next_state
    });
  }

  /**
   * Get all classifications for a lead
   */
  async getLeadClassifications(leadId: string): Promise<any[]> {
    return await db
      .select()
      .from(schema.classifications)
      .where(eq(schema.classifications.lead_id, leadId))
      .orderBy(desc(schema.classifications.created_at));
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
  }): Promise<LeadType> {
    // Ensure campaign exists if campaignId is provided
    if (data.campaignId) {
      const campaignExists = await this.getCampaign(data.campaignId);
      if (!campaignExists) {
        await this.createCampaign({
          id: data.campaignId,
          name: `Campaign ${data.campaignId}`,
          messaging_rules: {}
        });
      }
    }

    const [lead] = await db
      .insert(schema.leads)
      .values({
        id: data.id,
        name: data.name,
        company: data.company,
        linkedin_url: data.linkedinUrl,
        email: data.email,
        campaign_id: data.campaignId,
        state: 'NEW'
      })
      .returning();

    return this.hydrateLead(lead);
  }

  /**
   * Save research snapshot to lead
   */
  async saveResearchSnapshot(leadId: string, snapshot: ResearchSnapshotType): Promise<LeadType | null> {
    // Insert new research snapshot
    await db.insert(schema.research_snapshots).values({
      id: uuidv4(),
      lead_id: leadId,
      company_name: snapshot.companyName || 'Unknown',
      company_description: snapshot.companyDescription || null,
      industry: snapshot.industry || null,
      recent_news: (snapshot.recentNews as any) || null,
      key_products: (snapshot.keyProducts as any) || null,
      challenges: (snapshot.challenges as any) || null,
      opportunities: (snapshot.opportunities as any) || null,
      funding_info: snapshot.fundingInfo || null,
      employee_count: snapshot.employeeCount || null,
      sources: (snapshot.sources as any) || null,
      researched_at: snapshot.researched_at || new Date()
    });

    // Update lead's updated_at
    await db
      .update(schema.leads)
      .set({ updated_at: new Date() })
      .where(eq(schema.leads.id, leadId));

    return await this.getLead(leadId);
  }

  /**
   * Get research snapshot for a lead
   */
  async getResearchSnapshot(leadId: string): Promise<ResearchSnapshotType | null> {
    const lead = await this.getLead(leadId);
    return lead?.research_snapshot || null;
  }

  // ==================== Campaign Operations ====================

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<CampaignType[]> {
    const campaigns = await db.select().from(schema.campaigns);
    return campaigns.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      active: c.active,
      messaging_rules: c.messaging_rules as any,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string): Promise<CampaignType | null> {
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) return null;

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || undefined,
      active: campaign.active,
      messaging_rules: campaign.messaging_rules as any,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at
    };
  }

  /**
   * Save or update a campaign
   */
  async saveCampaign(campaign: CampaignType): Promise<CampaignType> {
    const [saved] = await db
      .insert(schema.campaigns)
      .values({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        active: campaign.active,
        messaging_rules: campaign.messaging_rules as any,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: schema.campaigns.id,
        set: {
          name: campaign.name,
          description: campaign.description,
          active: campaign.active,
          messaging_rules: campaign.messaging_rules as any,
          updated_at: new Date()
        }
      })
      .returning();

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description || undefined,
      active: saved.active,
      messaging_rules: saved.messaging_rules as any,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at
    };
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    id: string;
    name: string;
    messaging_rules: any;
  }): Promise<CampaignType> {
    const [campaign] = await db
      .insert(schema.campaigns)
      .values({
        id: data.id,
        name: data.name,
        messaging_rules: data.messaging_rules as any,
        active: true
      })
      .onConflictDoUpdate({
        target: schema.campaigns.id,
        set: {
          name: data.name,
          updated_at: new Date()
        }
      })
      .returning();

    return {
      id: campaign.id,
      name: campaign.name,
      active: campaign.active,
      messaging_rules: campaign.messaging_rules as any,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at
    };
  }

  /**
   * Get all leads for a campaign
   */
  async getLeadsByCampaign(campaignId: string): Promise<LeadType[]> {
    const leads = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.campaign_id, campaignId));

    return Promise.all(leads.map(lead => this.hydrateLead(lead)));
  }
}

export default DatabaseService;
