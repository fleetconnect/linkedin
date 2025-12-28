import { Router, Request, Response } from 'express';
import { ClassificationController } from '../controllers/ClassificationController';
import { DraftFollowupTool } from '../tools/draftFollowup';
import { IStorageService } from '../services/StorageFactory';
import { ResearchService } from '../services/ResearchService';
import { ScoringService } from '../services/ScoringService';
import { compareVariants, formatComparison } from '../utils/variantAnalytics';
import { normalizeLead, normalizeLeads } from '../utils/leadNormalizer';
import { v4 as uuidv4 } from 'uuid';
import observability, { LogLevel, LogCategory } from '../services/ObservabilityService';
import { LeadState, Intent, Sentiment } from '../types';

export function createRouter(
  controller: ClassificationController,
  followupTool?: DraftFollowupTool,
  storageService?: IStorageService
): Router {
  const router = Router();

  /**
   * POST /api/classify
   * Classify a single message reply
   */
  router.post('/classify', async (req: Request, res: Response) => {
    try {
      const { leadId, messageContent } = req.body;

      if (!leadId || !messageContent) {
        return res.status(400).json({
          error: 'Missing required fields: leadId and messageContent'
        });
      }

      const result = await controller.classifyReply(leadId, messageContent);

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Classification error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * POST /api/classify/batch
   * Classify multiple message replies
   */
  router.post('/classify/batch', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'messages must be a non-empty array'
        });
      }

      const results = await controller.classifyBatch(messages);

      return res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Batch classification error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * GET /api/leads/:leadId/stats
   * Get classification statistics for a lead
   */
  router.get('/leads/:leadId/stats', async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;

      const stats = await controller.getLeadStats(leadId);

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Stats error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * GET /health
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==================== Lead Management (CRUD) ====================

  if (storageService) {
    /**
     * POST /api/leads
     * Create a new lead
     */
    router.post('/leads', async (req: Request, res: Response) => {
      try {
        const { name, email, company, linkedinUrl, campaignId } = req.body;

        if (!name) {
          return res.status(400).json({
            error: 'Missing required field: name'
          });
        }

        const lead = await storageService.createLead({
          id: uuidv4(),
          name,
          email,
          company,
          linkedinUrl,
          campaignId
        });

        return res.json({
          success: true,
          data: lead
        });

      } catch (error) {
        console.error('Create lead error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * PUT /api/leads/:leadId
     * Update lead metadata (not state - use dedicated state endpoints)
     */
    router.put('/leads/:leadId', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { name, email, company, linkedinUrl, campaignId } = req.body;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Update only provided fields
        if (name) lead.name = name;
        if (email !== undefined) lead.email = email;
        if (company !== undefined) lead.company = company;
        if (linkedinUrl !== undefined) lead.linkedinUrl = linkedinUrl;
        if (campaignId !== undefined) lead.campaignId = campaignId;

        const updated = await storageService.saveLead(lead, { skipStateValidation: true });

        return res.json({
          success: true,
          data: updated
        });

      } catch (error) {
        console.error('Update lead error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * DELETE /api/leads/:leadId
     * Delete a lead (soft delete - mark as LOST)
     */
    router.delete('/leads/:leadId', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { hard } = req.query; // ?hard=true for permanent deletion

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        if (hard === 'true') {
          // Hard delete - not implemented in StorageService yet
          // Would need to implement in DatabaseService
          return res.status(501).json({
            error: 'Hard delete not yet implemented. Use soft delete (mark as LOST).'
          });
        } else {
          // Soft delete - mark as LOST
          await storageService.updateLeadState(leadId, LeadState.LOST);
        }

        return res.json({
          success: true,
          message: 'Lead marked as LOST'
        });

      } catch (error) {
        console.error('Delete lead error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/import
     * Bulk import leads from JSON array
     */
    router.post('/leads/import', async (req: Request, res: Response) => {
      try {
        const { leads, campaignId } = req.body;

        if (!Array.isArray(leads) || leads.length === 0) {
          return res.status(400).json({
            error: 'leads must be a non-empty array'
          });
        }

        const imported = [];
        const errors = [];

        for (const leadData of leads) {
          try {
            const lead = await storageService.createLead({
              id: uuidv4(),
              name: leadData.name,
              email: leadData.email,
              company: leadData.company,
              linkedinUrl: leadData.linkedinUrl,
              campaignId: leadData.campaignId || campaignId
            });
            imported.push(lead);
          } catch (error) {
            errors.push({
              lead: leadData,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return res.json({
          success: true,
          imported: imported.length,
          failed: errors.length,
          data: imported,
          errors
        });

      } catch (error) {
        console.error('Import leads error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/:leadId/normalize
     * Normalize lead data (name, email, LinkedIn URL, etc.)
     */
    router.post('/leads/:leadId/normalize', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Normalize the lead data
        const { lead: normalizedLead, result } = normalizeLead(lead);

        // Save if changes were made
        if (result.normalized) {
          await storageService.saveLead(normalizedLead, { skipStateValidation: true });

          observability.log(
            LogLevel.INFO,
            LogCategory.API,
            `Lead ${leadId} normalized`,
            { leadId, changes: result.changes }
          );
        }

        return res.json({
          success: true,
          data: {
            leadId: normalizedLead.id,
            normalized: result.normalized,
            changes: result.changes,
            lead: normalizedLead
          }
        });

      } catch (error) {
        console.error('Normalize lead error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/normalize-all
     * Normalize all leads in the database
     * Query params: ?campaignId=xxx (optional - normalize only leads in campaign)
     */
    router.post('/leads/normalize-all', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.query;

        let leads = await storageService.getLeads();

        // Filter by campaign if provided
        if (campaignId && typeof campaignId === 'string') {
          leads = leads.filter(l => l.campaignId === campaignId);
        }

        const results = normalizeLeads(leads);
        const changedLeads = results.filter(r => r.result.normalized);

        // Save all changed leads
        for (const { lead: normalizedLead } of changedLeads) {
          await storageService.saveLead(normalizedLead, { skipStateValidation: true });
        }

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Batch normalization complete: ${changedLeads.length} of ${leads.length} leads updated`,
          {
            totalLeads: leads.length,
            normalizedCount: changedLeads.length,
            campaignId: campaignId || 'all'
          }
        );

        return res.json({
          success: true,
          data: {
            totalLeads: leads.length,
            normalizedCount: changedLeads.length,
            unchangedCount: leads.length - changedLeads.length,
            changes: changedLeads.map(r => ({
              leadId: r.lead.id,
              leadName: r.lead.name,
              changes: r.result.changes
            }))
          }
        });

      } catch (error) {
        console.error('Normalize all leads error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Campaign Management (CRUD) ====================

  if (storageService) {
    /**
     * GET /api/campaigns
     * Get all campaigns
     */
    router.get('/campaigns', async (req: Request, res: Response) => {
      try {
        const campaigns = await storageService.getCampaigns();

        return res.json({
          success: true,
          count: campaigns.length,
          data: campaigns
        });

      } catch (error) {
        console.error('Get campaigns error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/campaigns
     * Create a new campaign
     */
    router.post('/campaigns', async (req: Request, res: Response) => {
      try {
        const { name, description, messaging_rules } = req.body;

        if (!name) {
          return res.status(400).json({
            error: 'Missing required field: name'
          });
        }

        if (!messaging_rules) {
          return res.status(400).json({
            error: 'Missing required field: messaging_rules'
          });
        }

        const campaign = await storageService.createCampaign({
          id: uuidv4(),
          name,
          messaging_rules: {
            personalization: messaging_rules.personalization ?? true,
            maxMessagesPerDay: messaging_rules.maxMessagesPerDay,
            researchRequired: messaging_rules.researchRequired,
            toneOfVoice: messaging_rules.toneOfVoice || 'professional',
            prompt_variant: messaging_rules.prompt_variant
          }
        });

        return res.json({
          success: true,
          data: campaign
        });

      } catch (error) {
        console.error('Create campaign error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/campaigns/:campaignId
     * Get campaign details
     */
    router.get('/campaigns/:campaignId', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;

        const campaign = await storageService.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${campaignId}`
          });
        }

        return res.json({
          success: true,
          data: campaign
        });

      } catch (error) {
        console.error('Get campaign error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * PUT /api/campaigns/:campaignId
     * Update campaign
     */
    router.put('/campaigns/:campaignId', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;
        const { name, description, active, messaging_rules } = req.body;

        const campaign = await storageService.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${campaignId}`
          });
        }

        // Update provided fields
        if (name) campaign.name = name;
        if (description !== undefined) campaign.description = description;
        if (active !== undefined) campaign.active = active;
        if (messaging_rules) campaign.messaging_rules = messaging_rules;

        const updated = await storageService.saveCampaign(campaign);

        return res.json({
          success: true,
          data: updated
        });

      } catch (error) {
        console.error('Update campaign error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * DELETE /api/campaigns/:campaignId
     * Delete campaign (deactivate)
     */
    router.delete('/campaigns/:campaignId', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;

        const campaign = await storageService.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${campaignId}`
          });
        }

        // Soft delete - deactivate campaign
        campaign.active = false;
        await storageService.saveCampaign(campaign);

        return res.json({
          success: true,
          message: 'Campaign deactivated'
        });

      } catch (error) {
        console.error('Delete campaign error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/campaigns/:campaignId/leads
     * Get all leads for a campaign
     */
    router.get('/campaigns/:campaignId/leads', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;
        const { state } = req.query;

        let leads = await storageService.getLeadsByCampaign(campaignId);

        // Filter by state if provided
        if (state && typeof state === 'string') {
          leads = leads.filter(l => l.state === state);
        }

        return res.json({
          success: true,
          count: leads.length,
          data: leads
        });

      } catch (error) {
        console.error('Get campaign leads error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Research Integration ====================

  if (storageService) {
    const researchService = new ResearchService(storageService);
    const scoringService = new ScoringService(storageService, researchService);

    /**
     * POST /api/leads/:leadId/research
     * Trigger or save research data for a lead
     */
    router.post('/leads/:leadId/research', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { snapshot, trigger } = req.body;

        if (trigger) {
          // Trigger new research (placeholder for Perplexity integration)
          const result = await researchService.triggerResearch({
            leadId,
            linkedinUrl: req.body.linkedinUrl,
            companyWebsite: req.body.companyWebsite,
            additionalContext: req.body.additionalContext
          });

          return res.json({
            success: result.success,
            data: result
          });
        } else if (snapshot) {
          // Save provided research snapshot
          const result = await researchService.saveResearch(leadId, snapshot);

          return res.json({
            success: result.success,
            data: result
          });
        } else {
          return res.status(400).json({
            error: 'Must provide either "trigger: true" or "snapshot" object'
          });
        }

      } catch (error) {
        console.error('Research error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/:leadId/research
     * Get research snapshot for a lead
     */
    router.get('/leads/:leadId/research', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const snapshot = await researchService.getResearch(leadId);

        if (!snapshot) {
          return res.status(404).json({
            error: `No research data found for lead: ${leadId}`
          });
        }

        return res.json({
          success: true,
          data: snapshot
        });

      } catch (error) {
        console.error('Get research error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * PUT /api/leads/:leadId/research
     * Update research snapshot for a lead
     */
    router.put('/leads/:leadId/research', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { snapshot } = req.body;

        if (!snapshot) {
          return res.status(400).json({
            error: 'Missing required field: snapshot'
          });
        }

        const result = await researchService.saveResearch(leadId, snapshot);

        return res.json({
          success: result.success,
          data: result
        });

      } catch (error) {
        console.error('Update research error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/:leadId/enrichment-status
     * Get enrichment status for a lead
     */
    router.get('/leads/:leadId/enrichment-status', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const status = await researchService.getEnrichmentStatus(leadId);

        return res.json({
          success: true,
          data: status
        });

      } catch (error) {
        console.error('Enrichment status error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Conversation Management ====================

  if (storageService) {
    /**
     * POST /api/leads/:leadId/messages
     * Add a message to conversation history
     */
    router.post('/leads/:leadId/messages', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { content, sender, variant } = req.body;

        if (!content || !sender) {
          return res.status(400).json({
            error: 'Missing required fields: content and sender'
          });
        }

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Create new message
        const message = {
          id: uuidv4(),
          content,
          sender, // 'user' or 'lead'
          timestamp: new Date(),
          variant: variant || undefined
        };

        // Add to conversation history
        if (!lead.conversationHistory) {
          lead.conversationHistory = [];
        }
        lead.conversationHistory.push(message);

        await storageService.saveLead(lead, { skipStateValidation: true });

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message added to lead ${leadId} conversation`,
          { leadId, messageId: message.id, sender }
        );

        return res.json({
          success: true,
          data: message
        });

      } catch (error) {
        console.error('Add message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/:leadId/messages
     * Get conversation history for a lead
     */
    router.get('/leads/:leadId/messages', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { limit, sender } = req.query;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        let messages = lead.conversationHistory || [];

        // Filter by sender if provided
        if (sender && typeof sender === 'string') {
          messages = messages.filter((m: any) => m.sender === sender);
        }

        // Sort by timestamp (newest first)
        messages = [...messages].sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Apply limit if provided
        if (limit && typeof limit === 'string') {
          const limitNum = parseInt(limit, 10);
          messages = messages.slice(0, limitNum);
        }

        return res.json({
          success: true,
          count: messages.length,
          data: messages
        });

      } catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * PUT /api/leads/:leadId/messages/:messageId
     * Update a message in conversation history
     */
    router.put('/leads/:leadId/messages/:messageId', async (req: Request, res: Response) => {
      try {
        const { leadId, messageId } = req.params;
        const { content, sentAt, delivered, failed } = req.body;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        if (!lead.conversationHistory) {
          return res.status(404).json({
            error: `No conversation history for lead: ${leadId}`
          });
        }

        const message = lead.conversationHistory.find((m: any) => m.id === messageId);
        if (!message) {
          return res.status(404).json({
            error: `Message not found: ${messageId}`
          });
        }

        // Update message fields
        if (content !== undefined) message.content = content;
        if (sentAt !== undefined) message.timestamp = new Date(sentAt);
        if (delivered !== undefined) message.delivered = delivered;
        if (failed !== undefined) message.failed = failed;

        await storageService.saveLead(lead, { skipStateValidation: true });

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message ${messageId} updated for lead ${leadId}`,
          { leadId, messageId, updates: Object.keys(req.body) }
        );

        return res.json({
          success: true,
          data: message
        });

      } catch (error) {
        console.error('Update message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * DELETE /api/leads/:leadId/messages/:messageId
     * Delete a message from conversation history
     */
    router.delete('/leads/:leadId/messages/:messageId', async (req: Request, res: Response) => {
      try {
        const { leadId, messageId } = req.params;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        if (!lead.conversationHistory) {
          return res.status(404).json({
            error: `No conversation history for lead: ${leadId}`
          });
        }

        const messageIndex = lead.conversationHistory.findIndex((m: any) => m.id === messageId);
        if (messageIndex === -1) {
          return res.status(404).json({
            error: `Message not found: ${messageId}`
          });
        }

        lead.conversationHistory.splice(messageIndex, 1);
        await storageService.saveLead(lead, { skipStateValidation: true });

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message ${messageId} deleted from lead ${leadId}`,
          { leadId, messageId }
        );

        return res.json({
          success: true,
          message: 'Message deleted'
        });

      } catch (error) {
        console.error('Delete message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Human Approval Flow ====================

  if (storageService) {
    /**
     * POST /api/leads/:leadId/approve-message
     * Approve a suggested message for sending
     * This respects the Human Approval Boundary by requiring explicit approval
     */
    router.post('/leads/:leadId/approve-message', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { messageId, approvedBy } = req.body;

        if (!approvedBy) {
          return res.status(400).json({
            error: 'Missing required field: approvedBy (operator name/email)'
          });
        }

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Find the suggested message in conversation history
        const message = messageId
          ? lead.conversationHistory?.find((m: any) => m.id === messageId)
          : lead.conversationHistory?.slice(-1)[0]; // Latest message if no ID provided

        if (!message) {
          return res.status(404).json({
            error: 'No message found to approve'
          });
        }

        // Mark as approved
        message.approved = true;
        message.approvedBy = approvedBy;
        message.approvedAt = new Date();

        // Update lead state to READY_TO_SEND
        lead.state = LeadState.READY_TO_SEND;

        await storageService.saveLead(lead);

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message approved for lead ${leadId}`,
          { leadId, messageId: message.id, approvedBy }
        );

        return res.json({
          success: true,
          data: {
            leadId,
            messageId: message.id,
            state: lead.state,
            message: message.content,
            approvedBy,
            approvedAt: message.approvedAt
          }
        });

      } catch (error) {
        console.error('Approve message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/:leadId/reject-message
     * Reject a suggested message
     */
    router.post('/leads/:leadId/reject-message', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { messageId, rejectedBy, reason } = req.body;

        if (!rejectedBy) {
          return res.status(400).json({
            error: 'Missing required field: rejectedBy (operator name/email)'
          });
        }

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Find the message
        const message = messageId
          ? lead.conversationHistory?.find((m: any) => m.id === messageId)
          : lead.conversationHistory?.slice(-1)[0];

        if (!message) {
          return res.status(404).json({
            error: 'No message found to reject'
          });
        }

        // Mark as rejected
        message.rejected = true;
        message.rejectedBy = rejectedBy;
        message.rejectedAt = new Date();
        message.rejectionReason = reason;

        // Keep lead in current state (don't change state on rejection)
        // Operator can manually update state if needed

        await storageService.saveLead(lead, { skipStateValidation: true });

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message rejected for lead ${leadId}`,
          { leadId, messageId: message.id, rejectedBy, reason }
        );

        return res.json({
          success: true,
          data: {
            leadId,
            messageId: message.id,
            state: lead.state,
            rejectedBy,
            rejectedAt: message.rejectedAt,
            reason
          }
        });

      } catch (error) {
        console.error('Reject message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/:leadId/edit-message
     * Edit and approve a suggested message
     */
    router.post('/leads/:leadId/edit-message', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { messageId, editedContent, editedBy } = req.body;

        if (!editedContent || !editedBy) {
          return res.status(400).json({
            error: 'Missing required fields: editedContent and editedBy'
          });
        }

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Find the message
        const message = messageId
          ? lead.conversationHistory?.find((m: any) => m.id === messageId)
          : lead.conversationHistory?.slice(-1)[0];

        if (!message) {
          return res.status(404).json({
            error: 'No message found to edit'
          });
        }

        // Store original content
        message.originalContent = message.content;

        // Update with edited content
        message.content = editedContent;
        message.edited = true;
        message.editedBy = editedBy;
        message.editedAt = new Date();

        // Approve the edited message
        message.approved = true;
        message.approvedBy = editedBy;
        message.approvedAt = new Date();

        // Update lead state
        lead.state = LeadState.READY_TO_SEND;

        await storageService.saveLead(lead);

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message edited and approved for lead ${leadId}`,
          { leadId, messageId: message.id, editedBy }
        );

        return res.json({
          success: true,
          data: {
            leadId,
            messageId: message.id,
            state: lead.state,
            originalContent: message.originalContent,
            editedContent: message.content,
            editedBy,
            editedAt: message.editedAt
          }
        });

      } catch (error) {
        console.error('Edit message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/pending-approval
     * Get all leads with messages awaiting human approval
     */
    router.get('/leads/pending-approval', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.query;

        let leads = await storageService.getLeads();

        // Filter by campaign if provided
        if (campaignId && typeof campaignId === 'string') {
          leads = leads.filter(l => l.campaignId === campaignId);
        }

        // Find leads with unapproved messages
        const pending = leads
          .filter(lead => {
            // Check if lead has suggested messages that need approval
            if (!lead.conversationHistory || lead.conversationHistory.length === 0) {
              return false;
            }

            // Get last message
            const lastMessage = lead.conversationHistory[lead.conversationHistory.length - 1];

            // Check if it's from us and not yet approved/rejected
            return (
              lastMessage.sender === 'user' &&
              !lastMessage.approved &&
              !lastMessage.rejected
            );
          })
          .map(lead => {
            const lastMessage = lead.conversationHistory![lead.conversationHistory!.length - 1];

            return {
              leadId: lead.id,
              leadName: lead.name,
              company: lead.company,
              state: lead.state,
              messageId: lastMessage.id,
              suggestedMessage: lastMessage.content,
              suggestedAt: lastMessage.timestamp,
              classification: lead.lastClassification,
              conversationHistory: lead.conversationHistory
            };
          });

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Found ${pending.length} leads pending approval`,
          { count: pending.length, campaignId: campaignId || 'all' }
        );

        return res.json({
          success: true,
          count: pending.length,
          data: pending
        });

      } catch (error) {
        console.error('Pending approval error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Message Generation ====================

  if (storageService) {
    /**
     * POST /api/leads/:leadId/generate-initial
     * Generate initial outreach message for a lead
     */
    router.post('/leads/:leadId/generate-initial', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { campaignId, customPrompt } = req.body;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Get campaign (use lead's campaign or provided)
        const cId = campaignId || lead.campaignId;
        if (!cId) {
          return res.status(400).json({
            error: 'No campaign specified. Provide campaignId or assign lead to a campaign.'
          });
        }

        const campaign = await storageService.getCampaign(cId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${cId}`
          });
        }

        // Generate message using MessageGenerationService
        // Note: This requires MessageGenerationService to be available
        // For now, return a placeholder - you'll wire this up
        return res.status(501).json({
          error: 'Message generation not yet wired to API. Implement MessageGenerationService integration.'
        });

      } catch (error) {
        console.error('Generate initial message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Follow-up Recommendation (Human-in-the-Loop) ====================

  if (storageService) {
    /**
     * GET /api/leads/eligible-for-followup
     * Returns leads that MIGHT need follow-up (conservative logic)
     * API decides eligibility based on:
     * - Current state (INTERESTED, REPLIED)
     * - Time since last contact
     * - Conversation sentiment
     * - Campaign rules
     *
     * Note: May return zero leads (valid outcome)
     */
    router.get('/leads/eligible-for-followup', async (req: Request, res: Response) => {
      try {
        const allLeads = await storageService.getLeads();
        const eligible: any[] = [];

        // Conservative eligibility criteria
        const MIN_DAYS_SINCE_CONTACT = 3; // Wait at least 3 days before suggesting follow-up
        const MAX_DAYS_SINCE_CONTACT = 14; // Don't suggest if more than 14 days (probably lost)

        for (const lead of allLeads) {
          const reasons: string[] = [];
          const disqualifiers: string[] = [];

          // Check 1: State must be INTERESTED or REPLIED
          if (lead.state !== LeadState.INTERESTED && lead.state !== LeadState.REPLIED) {
            disqualifiers.push(`State is ${lead.state}, not INTERESTED or REPLIED`);
            observability.log(
              LogLevel.DEBUG,
              LogCategory.API,
              `Lead ${lead.id} (${lead.name}) ineligible: wrong state`,
              { leadId: lead.id, state: lead.state }
            );
            continue;
          }
          reasons.push(`State is ${lead.state}`);

          // Check 2: Must have conversation history
          if (!lead.conversationHistory || lead.conversationHistory.length === 0) {
            disqualifiers.push('No conversation history');
            observability.log(
              LogLevel.DEBUG,
              LogCategory.API,
              `Lead ${lead.id} (${lead.name}) ineligible: no conversation history`,
              { leadId: lead.id }
            );
            continue;
          }

          // Check 3: Calculate time since last message
          const sortedMessages = [...lead.conversationHistory].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const lastMessage = sortedMessages[0];
          const daysSinceLastMessage = (Date.now() - new Date(lastMessage.timestamp).getTime()) / (1000 * 60 * 60 * 24);

          // Too soon to follow up (conservative: wait at least MIN_DAYS_SINCE_CONTACT days)
          if (daysSinceLastMessage < MIN_DAYS_SINCE_CONTACT) {
            disqualifiers.push(`Only ${daysSinceLastMessage.toFixed(1)} days since last message (min: ${MIN_DAYS_SINCE_CONTACT})`);
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `Lead ${lead.id} (${lead.name}) ineligible: too soon to follow up`,
              {
                leadId: lead.id,
                daysSinceLastMessage: daysSinceLastMessage.toFixed(1),
                minDays: MIN_DAYS_SINCE_CONTACT
              }
            );
            continue;
          }

          // Too late to follow up (probably lost interest)
          if (daysSinceLastMessage > MAX_DAYS_SINCE_CONTACT) {
            disqualifiers.push(`${daysSinceLastMessage.toFixed(1)} days since last message (max: ${MAX_DAYS_SINCE_CONTACT})`);
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `Lead ${lead.id} (${lead.name}) ineligible: too long since contact`,
              {
                leadId: lead.id,
                daysSinceLastMessage: daysSinceLastMessage.toFixed(1),
                maxDays: MAX_DAYS_SINCE_CONTACT
              }
            );
            continue;
          }

          reasons.push(`${daysSinceLastMessage.toFixed(1)} days since last message (within ${MIN_DAYS_SINCE_CONTACT}-${MAX_DAYS_SINCE_CONTACT} day window)`);

          // Check 4: INVARIANT - Last message must be from prospect (not us)
          // Belt-and-suspenders: If lead replied after our last message, only human can approve next send
          const lastMessageFromUs = lastMessage.sender === 'user';
          if (lastMessageFromUs) {
            // We already sent a follow-up, they haven't replied
            // Conservative: Don't double-follow-up
            disqualifiers.push('Last message was from us (no prospect reply yet)');
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `Lead ${lead.id} (${lead.name}) ineligible: INVARIANT VIOLATION - last message from us, not prospect`,
              { leadId: lead.id, lastSender: 'user', invariant: 'prospect_must_reply_last' }
            );
            continue;
          }

          reasons.push('Last message was from prospect (our turn to respond)');

          // Additional invariant check: Verify prospect actually replied after any of our messages
          const ourMessages = lead.conversationHistory.filter((m: any) => m.sender === 'user');
          const theirMessages = lead.conversationHistory.filter((m: any) => m.sender === 'lead');

          if (ourMessages.length > 0 && theirMessages.length > 0) {
            const lastOutboundTimestamp = Math.max(...ourMessages.map((m: any) => new Date(m.timestamp).getTime()));
            const lastInboundTimestamp = Math.max(...theirMessages.map((m: any) => new Date(m.timestamp).getTime()));

            if (lastOutboundTimestamp > lastInboundTimestamp) {
              // Our message is newer - they haven't replied yet
              disqualifiers.push('Our last outbound message is newer than their last reply');
              observability.log(
                LogLevel.WARN,
                LogCategory.API,
                `Lead ${lead.id} (${lead.name}) ineligible: INVARIANT VIOLATION - outbound message timestamp after last reply`,
                {
                  leadId: lead.id,
                  lastOutboundTimestamp: new Date(lastOutboundTimestamp).toISOString(),
                  lastInboundTimestamp: new Date(lastInboundTimestamp).toISOString(),
                  invariant: 'no_send_without_reply'
                }
              );
              continue;
            }
          }

          // Check 5: Check sentiment of last classification
          // Conservative: Only suggest follow-up if sentiment is positive or neutral
          if (lead.lastClassification) {
            const sentiment = lead.lastClassification.sentiment;
            if (sentiment === Sentiment.NEGATIVE) {
              disqualifiers.push('Last classification sentiment was negative');
              observability.log(
                LogLevel.INFO,
                LogCategory.API,
                `Lead ${lead.id} (${lead.name}) ineligible: negative sentiment`,
                { leadId: lead.id, sentiment }
              );
              continue;
            }
            reasons.push(`Last classification sentiment: ${sentiment}`);
          }

          // ELIGIBLE - Add to results
          eligible.push({
            leadId: lead.id,
            name: lead.name,
            company: lead.company,
            state: lead.state,
            lastContactedAt: lastMessage.timestamp,
            daysSinceLastMessage: parseFloat(daysSinceLastMessage.toFixed(1)),
            conversationSummary: lead.lastClassification
              ? `Prospect showed ${lead.lastClassification.intent} intent with ${lead.lastClassification.sentiment} sentiment`
              : 'No classification available',
            classification: lead.lastClassification,
            eligibilityReasons: reasons
          });

          observability.log(
            LogLevel.INFO,
            LogCategory.API,
            `Lead ${lead.id} (${lead.name}) ELIGIBLE for follow-up`,
            {
              leadId: lead.id,
              reasons,
              daysSinceLastMessage: daysSinceLastMessage.toFixed(1)
            }
          );
        }

        // Log summary
        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Follow-up eligibility check complete: ${eligible.length} eligible out of ${allLeads.length} total leads`,
          {
            totalLeads: allLeads.length,
            eligibleCount: eligible.length,
            eligibleLeadIds: eligible.map(e => e.leadId)
          }
        );

        return res.json({
          success: true,
          count: eligible.length,
          data: eligible
        });

      } catch (error) {
        console.error('Eligible for follow-up error:', error);
        observability.log(
          LogLevel.ERROR,
          LogCategory.API,
          'Error checking follow-up eligibility',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/:leadId/suggest-followup
     * Generate follow-up suggestion OR return WAIT
     *
     * CRITICAL:
     * - Does NOT change state
     * - Does NOT mark as READY_TO_SEND
     * - Conservative logic: bias toward WAIT
     * - Silence is a first-class outcome
     *
     * Returns either:
     * - {action: "SUGGEST", suggestedMessage: "...", reasoning: "...", confidence: "..."}
     * - {action: "WAIT", reasoning: "..."}
     */
    router.post('/leads/:leadId/suggest-followup', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Evaluating follow-up suggestion for lead ${leadId} (${lead.name})`,
          { leadId, leadName: lead.name, state: lead.state }
        );

        // CONSERVATIVE CHECKS - Bias toward WAIT

        // Check 0: INVARIANT - Prospect must have replied after our last message
        // Belt-and-suspenders safety: No auto-suggestion if we sent last message
        if (lead.conversationHistory && lead.conversationHistory.length > 0) {
          const ourMessages = lead.conversationHistory.filter((m: any) => m.sender === 'user');
          const theirMessages = lead.conversationHistory.filter((m: any) => m.sender === 'lead');

          if (ourMessages.length > 0 && theirMessages.length > 0) {
            const lastOutboundTimestamp = Math.max(...ourMessages.map((m: any) => new Date(m.timestamp).getTime()));
            const lastInboundTimestamp = Math.max(...theirMessages.map((m: any) => new Date(m.timestamp).getTime()));

            if (lastOutboundTimestamp > lastInboundTimestamp) {
              const reasoning = 'INVARIANT VIOLATION: Our last outbound message is newer than their last reply. No suggestions allowed without human review.';
              observability.log(
                LogLevel.WARN,
                LogCategory.API,
                `WAIT decision for lead ${leadId}: INVARIANT - we sent last message`,
                {
                  leadId,
                  lastOutboundTimestamp: new Date(lastOutboundTimestamp).toISOString(),
                  lastInboundTimestamp: new Date(lastInboundTimestamp).toISOString(),
                  invariant: 'no_send_without_reply',
                  reasoning
                }
              );
              return res.json({
                success: true,
                data: {
                  action: 'WAIT',
                  reasoning
                }
              });
            }
          } else if (theirMessages.length === 0) {
            // No replies from prospect at all - shouldn't be suggesting follow-up
            const reasoning = 'No replies from prospect yet. Follow-ups only appropriate after prospect has engaged.';
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `WAIT decision for lead ${leadId}: no prospect replies`,
              { leadId, reasoning }
            );
            return res.json({
              success: true,
              data: {
                action: 'WAIT',
                reasoning
              }
            });
          }
        }

        // Check 1: Verify state is appropriate
        if (lead.state !== LeadState.INTERESTED && lead.state !== LeadState.REPLIED) {
          const reasoning = `Lead state is ${lead.state}. Follow-ups are only appropriate for INTERESTED or REPLIED leads.`;
          observability.log(
            LogLevel.INFO,
            LogCategory.API,
            `WAIT decision for lead ${leadId}: inappropriate state`,
            { leadId, state: lead.state, reasoning }
          );
          return res.json({
            success: true,
            data: {
              action: 'WAIT',
              reasoning
            }
          });
        }

        // Check 2: Analyze last message content for "polite brush-off" signals
        if (lead.conversationHistory && lead.conversationHistory.length > 0) {
          const sortedMessages = [...lead.conversationHistory].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const lastProspectMessage = sortedMessages.find(m => m.sender === 'lead');

          if (lastProspectMessage) {
            const content = lastProspectMessage.content.toLowerCase();
            const brushOffSignals = [
              'thanks',
              'thank you',
              'i\'ll let you know',
              'i\'ll reach out',
              'i\'ll be in touch',
              'not right now',
              'not at this time',
              'maybe later',
              'busy',
              'swamped',
              'not interested',
              'no thanks'
            ];

            const hasBrushOffSignal = brushOffSignals.some(signal => content.includes(signal));

            // Conservative: If they gave a polite brush-off, WAIT
            if (hasBrushOffSignal && content.length < 100) {
              // Short polite message = brush off
              const reasoning = `Last response was a polite brush-off ("${lastProspectMessage.content.substring(0, 50)}..."). Following up now would likely reduce trust. Recommend waiting or marking as LOST.`;
              observability.log(
                LogLevel.INFO,
                LogCategory.API,
                `WAIT decision for lead ${leadId}: polite brush-off detected`,
                { leadId, lastMessage: lastProspectMessage.content, reasoning }
              );
              return res.json({
                success: true,
                data: {
                  action: 'WAIT',
                  reasoning
                }
              });
            }
          }
        }

        // Check 3: Check if classification is INTERESTED with positive/neutral sentiment
        if (lead.lastClassification) {
          const { intent, sentiment, confidence } = lead.lastClassification;

          // Conservative: Only suggest if INTERESTED + positive/neutral sentiment + high confidence
          if (intent !== Intent.INTERESTED && intent !== Intent.BOOKED) {
            const reasoning = `Last classification intent was "${intent}". Only INTERESTED or BOOKED leads should receive follow-ups.`;
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `WAIT decision for lead ${leadId}: intent not interested`,
              { leadId, intent, reasoning }
            );
            return res.json({
              success: true,
              data: {
                action: 'WAIT',
                reasoning
              }
            });
          }

          // Conservative: If low confidence, WAIT
          if (confidence < 0.6) {
            const reasoning = `Classification confidence is ${(confidence * 100).toFixed(0)}% (below 60% threshold). Not confident enough to suggest follow-up. Recommend human review.`;
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `WAIT decision for lead ${leadId}: low classification confidence`,
              { leadId, confidence, reasoning }
            );
            return res.json({
              success: true,
              data: {
                action: 'WAIT',
                reasoning
              }
            });
          }

          // Conservative: If negative sentiment, WAIT
          if (sentiment === Sentiment.NEGATIVE) {
            const reasoning = `Last classification sentiment was negative. Following up could damage relationship. Recommend waiting or marking as LOST.`;
            observability.log(
              LogLevel.INFO,
              LogCategory.API,
              `WAIT decision for lead ${leadId}: negative sentiment`,
              { leadId, sentiment, reasoning }
            );
            return res.json({
              success: true,
              data: {
                action: 'WAIT',
                reasoning
              }
            });
          }
        }

        // Check 4: If we get here, generate suggestion (if followupTool available)
        if (!followupTool) {
          const reasoning = 'Follow-up generation tool not configured. Cannot generate suggestion.';
          observability.log(
            LogLevel.WARN,
            LogCategory.API,
            `WAIT decision for lead ${leadId}: no followupTool available`,
            { leadId, reasoning }
          );
          return res.json({
            success: true,
            data: {
              action: 'WAIT',
              reasoning
            }
          });
        }

        // Generate suggestion using existing followupTool
        try {
          const followupResult = await followupTool.execute(leadId);

          if (!followupResult.success || !followupResult.message) {
            const reasoning = 'Failed to generate follow-up message. Recommend manual review.';
            observability.log(
              LogLevel.WARN,
              LogCategory.API,
              `WAIT decision for lead ${leadId}: followup generation failed`,
              { leadId, reasoning, error: followupResult.error }
            );
            return res.json({
              success: true,
              data: {
                action: 'WAIT',
                reasoning
              }
            });
          }

          // Success - return suggestion
          const confidence = lead.lastClassification?.confidence || 0.7;
          const confidenceLevel = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';

          const reasoning = `Lead showed ${lead.lastClassification?.intent || 'positive'} intent with ${lead.lastClassification?.sentiment || 'neutral'} sentiment. Appropriate to follow up.`;

          observability.log(
            LogLevel.INFO,
            LogCategory.API,
            `SUGGEST decision for lead ${leadId}: generated follow-up message`,
            {
              leadId,
              confidence: confidenceLevel,
              intent: lead.lastClassification?.intent,
              sentiment: lead.lastClassification?.sentiment
            }
          );

          return res.json({
            success: true,
            data: {
              action: 'SUGGEST',
              suggestedMessage: followupResult.message,
              reasoning,
              confidence: confidenceLevel,
              metadata: {
                leadId: lead.id,
                leadName: lead.name,
                company: lead.company,
                state: lead.state,
                lastIntent: lead.lastClassification?.intent,
                lastSentiment: lead.lastClassification?.sentiment
              }
            }
          });

        } catch (error) {
          const reasoning = 'Error generating follow-up message. Recommend manual review.';
          observability.log(
            LogLevel.ERROR,
            LogCategory.API,
            `WAIT decision for lead ${leadId}: generation error`,
            { leadId, reasoning, error: error instanceof Error ? error.message : 'Unknown error' }
          );
          return res.json({
            success: true,
            data: {
              action: 'WAIT',
              reasoning
            }
          });
        }

      } catch (error) {
        console.error('Suggest follow-up error:', error);
        observability.log(
          LogLevel.ERROR,
          LogCategory.API,
          'Error in suggest-followup endpoint',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== External Integration Routes (🔒 Execution Boundary) ====================

  if (storageService) {
    /**
     * GET /api/leads
     * Get leads by state (for external tools to poll READY_TO_SEND leads)
     * Query params: ?state=READY_TO_SEND&campaignId=xxx
     */
    router.get('/leads', async (req: Request, res: Response) => {
      try {
        const { state, campaignId } = req.query;

        let leads = await storageService.getLeads();

        // Filter by state if provided
        if (state && typeof state === 'string') {
          leads = leads.filter(l => l.state === state);
        }

        // Filter by campaign if provided
        if (campaignId && typeof campaignId === 'string') {
          leads = leads.filter(l => l.campaignId === campaignId);
        }

        // Map to integration-friendly format
        const integrationLeads = leads.map(lead => {
          const lastMessage = lead.conversationHistory
            .filter((m: any) => m.sender === 'user')
            .slice(-1)[0];

          return {
            id: lead.id,
            name: lead.name,
            company: lead.company,
            state: lead.state,
            nextMessage: lastMessage?.content,
            messageId: lastMessage?.id,
            variant: lastMessage?.variant,
            campaignId: lead.campaignId,
            updatedAt: lead.updatedAt
          };
        });

        return res.json({
          success: true,
          count: integrationLeads.length,
          data: integrationLeads
        });

      } catch (error) {
        console.error('Get leads error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/leads/:leadId/state
     * Update lead state (for external tools after sending)
     * Body: { state: string, sentAt?: string, messageId?: string }
     */
    router.post('/leads/:leadId/state', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { state, sentAt, messageId } = req.body;

        if (!state) {
          return res.status(400).json({
            error: 'Missing required field: state'
          });
        }

        // Get lead
        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        const previousState = lead.state;

        // Update state
        lead.state = state;
        lead.updatedAt = new Date();

        // If sentAt provided, update message timestamp
        if (sentAt && messageId) {
          const message = lead.conversationHistory.find((m: any) => m.id === messageId);
          if (message) {
            message.timestamp = new Date(sentAt);
          }
        }

        await storageService.saveLead(lead);

        return res.json({
          success: true,
          data: {
            leadId: lead.id,
            previousState,
            newState: state,
            updatedAt: lead.updatedAt
          }
        });

      } catch (error) {
        console.error('Update lead state error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/:leadId
     * Get single lead details
     */
    router.get('/leads/:leadId', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const lead = await storageService.getLead(leadId);

        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        return res.json({
          success: true,
          data: lead
        });

      } catch (error) {
        console.error('Get lead error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Follow-up Routes ====================

  if (followupTool) {
    /**
     * POST /api/followup/generate
     * Generate follow-up for a single lead
     */
    router.post('/followup/generate', async (req: Request, res: Response) => {
      try {
        const { leadId, customPrompt } = req.body;

        if (!leadId) {
          return res.status(400).json({
            error: 'Missing required field: leadId'
          });
        }

        const result = await followupTool.execute(leadId, customPrompt);

        return res.json({
          success: true,
          data: result
        });

      } catch (error) {
        console.error('Follow-up generation error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/followup/batch
     * Generate follow-ups for multiple leads
     */
    router.post('/followup/batch', async (req: Request, res: Response) => {
      try {
        const { leadIds } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
          return res.status(400).json({
            error: 'leadIds must be a non-empty array'
          });
        }

        const results = await followupTool.executeBatch(leadIds);

        // Convert Map to object for JSON response
        const resultsObj = Object.fromEntries(results);

        return res.json({
          success: true,
          data: resultsObj
        });

      } catch (error) {
        console.error('Batch follow-up error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/followup/eligible/:leadId
     * Check if a lead is eligible for follow-up
     */
    router.get('/followup/eligible/:leadId', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const eligibility = await followupTool.checkEligibility(leadId);

        return res.json({
          success: true,
          data: eligibility
        });

      } catch (error) {
        console.error('Eligibility check error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/followup/campaign/:campaignId/eligible
     * Get all leads needing follow-up in a campaign
     */
    router.get('/followup/campaign/:campaignId/eligible', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;

        const leads = await followupTool.getLeadsNeedingFollowup(campaignId);

        return res.json({
          success: true,
          data: {
            count: leads.length,
            leads: leads.map(l => ({
              id: l.id,
              name: l.name,
              company: l.company,
              lastIntent: l.lastClassification?.intent,
              confidence: l.lastClassification?.confidence
            }))
          }
        });

      } catch (error) {
        console.error('Campaign eligible leads error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/followup/campaign/:campaignId/generate-all
     * Generate follow-ups for all eligible leads in a campaign
     */
    router.post('/followup/campaign/:campaignId/generate-all', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;

        const results = await followupTool.generateFollowupsForCampaign(campaignId);

        return res.json({
          success: true,
          data: results
        });

      } catch (error) {
        console.error('Campaign follow-up generation error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== A/B Testing Analytics Routes ====================

  if (storageService) {
    /**
     * GET /api/analytics/variants
     * Get A/B test performance comparison across all leads
     */
    router.get('/analytics/variants', async (req: Request, res: Response) => {
      try {
        const leads = await storageService.getLeads();
        const comparison = compareVariants(leads);

        return res.json({
          success: true,
          data: comparison
        });

      } catch (error) {
        console.error('Variant analytics error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/analytics/variants/report
     * Get formatted A/B test report
     */
    router.get('/analytics/variants/report', async (req: Request, res: Response) => {
      try {
        const leads = await storageService.getLeads();
        const comparison = compareVariants(leads);
        const report = formatComparison(comparison);

        return res.json({
          success: true,
          data: {
            report,
            comparison
          }
        });

      } catch (error) {
        console.error('Variant report error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/analytics/variants/campaign/:campaignId
     * Get A/B test performance for a specific campaign
     */
    router.get('/analytics/variants/campaign/:campaignId', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;
        const allLeads = await storageService.getLeads();
        const campaignLeads = allLeads.filter(l => l.campaignId === campaignId);

        if (campaignLeads.length === 0) {
          return res.status(404).json({
            error: `No leads found for campaign: ${campaignId}`
          });
        }

        const comparison = compareVariants(campaignLeads);

        return res.json({
          success: true,
          data: {
            campaignId,
            leadCount: campaignLeads.length,
            comparison
          }
        });

      } catch (error) {
        console.error('Campaign variant analytics error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Webhook Callbacks ====================

  /**
   * POST /api/webhooks/linkedin-reply
   * External notification that a prospect replied on LinkedIn
   */
  router.post('/api/webhooks/linkedin-reply', async (req: Request, res: Response) => {
    try {
      const { leadId, linkedinUrl, replyContent, timestamp } = req.body;

      if (!leadId || !replyContent) {
        return res.status(400).json({
          error: 'Missing required fields: leadId and replyContent'
        });
      }

      if (storageService) {
        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Add reply to conversation history
        const message = {
          id: uuidv4(),
          content: replyContent,
          sender: 'lead',
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          source: 'linkedin_webhook'
        };

        if (!lead.conversationHistory) {
          lead.conversationHistory = [];
        }
        lead.conversationHistory.push(message);

        // Update state to REPLIED if not already more advanced
        if (lead.state === LeadState.NEW || lead.state === LeadState.CONTACTED) {
          lead.state = LeadState.REPLIED;
        }

        await storageService.saveLead(lead);

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `LinkedIn reply received via webhook for lead ${leadId}`,
          { leadId, messageId: message.id }
        );
      }

      return res.json({
        success: true,
        message: 'Reply processed'
      });

    } catch (error) {
      console.error('LinkedIn reply webhook error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * POST /api/webhooks/message-sent
   * Confirmation from HeyReach that message was sent
   */
  router.post('/api/webhooks/message-sent', async (req: Request, res: Response) => {
    try {
      const { leadId, messageId, sentAt, externalId } = req.body;

      if (!leadId || !messageId) {
        return res.status(400).json({
          error: 'Missing required fields: leadId and messageId'
        });
      }

      if (storageService) {
        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Find and update the message
        const message = lead.conversationHistory?.find((m: any) => m.id === messageId);
        if (message) {
          message.sent = true;
          message.sentAt = sentAt ? new Date(sentAt) : new Date();
          message.externalId = externalId;
        }

        // Update lead state
        lead.state = LeadState.CONTACTED;

        await storageService.saveLead(lead);

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message sent confirmation received for lead ${leadId}`,
          { leadId, messageId, externalId }
        );
      }

      return res.json({
        success: true,
        message: 'Send confirmation processed'
      });

    } catch (error) {
      console.error('Message sent webhook error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * POST /api/webhooks/message-failed
   * Notification that message send failed
   */
  router.post('/api/webhooks/message-failed', async (req: Request, res: Response) => {
    try {
      const { leadId, messageId, error: sendError } = req.body;

      if (!leadId || !messageId) {
        return res.status(400).json({
          error: 'Missing required fields: leadId and messageId'
        });
      }

      if (storageService) {
        const lead = await storageService.getLead(leadId);
        if (!lead) {
          return res.status(404).json({
            error: `Lead not found: ${leadId}`
          });
        }

        // Mark message as failed
        const message = lead.conversationHistory?.find((m: any) => m.id === messageId);
        if (message) {
          message.failed = true;
          message.failedAt = new Date();
          message.failureReason = sendError;
        }

        // Return to READY_TO_SEND for retry or keep current state
        // Don't auto-transition on failure - require human decision

        await storageService.saveLead(lead, { skipStateValidation: true });

        observability.log(
          LogLevel.WARN,
          LogCategory.API,
          `Message send failed for lead ${leadId}`,
          { leadId, messageId, error: sendError }
        );
      }

      return res.json({
        success: true,
        message: 'Failure recorded'
      });

    } catch (error) {
      console.error('Message failed webhook error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // ==================== Message Quality Rating (M5 Tracking) ====================

  if (storageService) {
    /**
     * POST /api/messages/:messageId/rate
     * Rate a message M1-M5 for quality tracking
     */
    router.post('/messages/:messageId/rate', async (req: Request, res: Response) => {
      try {
        const { messageId } = req.params;
        const { rating, ratedBy, notes } = req.body;

        if (!rating || !ratedBy) {
          return res.status(400).json({
            error: 'Missing required fields: rating (1-5) and ratedBy'
          });
        }

        if (rating < 1 || rating > 5) {
          return res.status(400).json({
            error: 'Rating must be between 1 and 5'
          });
        }

        // Find lead containing this message
        const leads = await storageService.getLeads();
        let foundLead = null;
        let foundMessage = null;

        for (const lead of leads) {
          if (lead.conversationHistory) {
            const msg = lead.conversationHistory.find((m: any) => m.id === messageId);
            if (msg) {
              foundLead = lead;
              foundMessage = msg;
              break;
            }
          }
        }

        if (!foundMessage) {
          return res.status(404).json({
            error: `Message not found: ${messageId}`
          });
        }

        // Add rating
        foundMessage.qualityRating = rating;
        foundMessage.ratedBy = ratedBy;
        foundMessage.ratedAt = new Date();
        foundMessage.ratingNotes = notes;

        await storageService.saveLead(foundLead!, { skipStateValidation: true });

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Message ${messageId} rated M${rating}`,
          { messageId, rating, ratedBy }
        );

        return res.json({
          success: true,
          data: {
            messageId,
            rating,
            ratedBy,
            ratedAt: foundMessage.ratedAt
          }
        });

      } catch (error) {
        console.error('Rate message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/messages/rated
     * Get all rated messages for training/analysis
     */
    router.get('/messages/rated', async (req: Request, res: Response) => {
      try {
        const { minRating, campaignId } = req.query;

        let leads = await storageService.getLeads();

        // Filter by campaign if provided
        if (campaignId && typeof campaignId === 'string') {
          leads = leads.filter(l => l.campaignId === campaignId);
        }

        const ratedMessages: any[] = [];

        for (const lead of leads) {
          if (lead.conversationHistory) {
            for (const message of lead.conversationHistory) {
              if (message.qualityRating) {
                // Filter by minimum rating if provided
                if (minRating && message.qualityRating < parseInt(minRating as string, 10)) {
                  continue;
                }

                ratedMessages.push({
                  messageId: message.id,
                  leadId: lead.id,
                  leadName: lead.name,
                  company: lead.company,
                  content: message.content,
                  rating: message.qualityRating,
                  ratedBy: message.ratedBy,
                  ratedAt: message.ratedAt,
                  notes: message.ratingNotes,
                  variant: message.variant
                });
              }
            }
          }
        }

        return res.json({
          success: true,
          count: ratedMessages.length,
          data: ratedMessages
        });

      } catch (error) {
        console.error('Get rated messages error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/messages/:messageId/flag
     * Flag a message as bad/problematic
     */
    router.post('/messages/:messageId/flag', async (req: Request, res: Response) => {
      try {
        const { messageId } = req.params;
        const { reason, flaggedBy } = req.body;

        if (!reason || !flaggedBy) {
          return res.status(400).json({
            error: 'Missing required fields: reason and flaggedBy'
          });
        }

        // Find lead containing this message
        const leads = await storageService.getLeads();
        let foundLead = null;
        let foundMessage = null;

        for (const lead of leads) {
          if (lead.conversationHistory) {
            const msg = lead.conversationHistory.find((m: any) => m.id === messageId);
            if (msg) {
              foundLead = lead;
              foundMessage = msg;
              break;
            }
          }
        }

        if (!foundMessage) {
          return res.status(404).json({
            error: `Message not found: ${messageId}`
          });
        }

        // Add flag
        foundMessage.flagged = true;
        foundMessage.flagReason = reason;
        foundMessage.flaggedBy = flaggedBy;
        foundMessage.flaggedAt = new Date();

        await storageService.saveLead(foundLead!, { skipStateValidation: true });

        observability.log(
          LogLevel.WARN,
          LogCategory.API,
          `Message ${messageId} flagged as problematic`,
          { messageId, reason, flaggedBy }
        );

        return res.json({
          success: true,
          message: 'Message flagged'
        });

      } catch (error) {
        console.error('Flag message error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Prompt Management ====================

  /**
   * GET /api/prompts
   * List all available prompts
   */
  router.get('/api/prompts', (req: Request, res: Response) => {
    // Import prompt registry dynamically
    const prompts = [
      { id: 'classify_reply_v1', type: 'classify_reply', version: 'v1', description: 'Original classification prompt' },
      { id: 'classify_reply_v2', type: 'classify_reply', version: 'v2', description: 'Enhanced classification with better intent detection' },
      { id: 'generate_message_initial_v1', type: 'generate_message', version: 'v1', description: 'Original initial message generation' },
      { id: 'generate_message_initial_v2', type: 'generate_message', version: 'v2', description: 'Executive-grade initial outreach (max 280 chars)' },
      { id: 'generate_message_followup_v1', type: 'generate_message', version: 'v1', description: 'Follow-up message generation' },
      { id: 'followup_v2', type: 'follow_up', version: 'v2', description: 'Respectful follow-ups (max 220 chars)' },
      { id: 'followup_neutral_v1', type: 'follow_up', version: 'v1', description: 'Follow-up for neutral leads' },
      { id: 'followup_positive_v1', type: 'follow_up', version: 'v1', description: 'Follow-up for interested leads' }
    ];

    return res.json({
      success: true,
      count: prompts.length,
      data: prompts
    });
  });

  /**
   * GET /api/prompts/:promptId
   * Get details for a specific prompt
   */
  router.get('/api/prompts/:promptId', (req: Request, res: Response) => {
    const { promptId } = req.params;

    // This would normally load from prompt registry
    // For now, return basic info
    return res.json({
      success: true,
      data: {
        id: promptId,
        message: 'Prompt details endpoint - integrate with prompt registry for full details'
      }
    });
  });

  // ==================== Bulk Operations ====================

  if (storageService) {
    /**
     * POST /api/leads/bulk-update-state
     * Update state for multiple leads at once
     */
    router.post('/leads/bulk-update-state', async (req: Request, res: Response) => {
      try {
        const { leadIds, newState } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
          return res.status(400).json({
            error: 'leadIds must be a non-empty array'
          });
        }

        if (!newState) {
          return res.status(400).json({
            error: 'Missing required field: newState'
          });
        }

        const results = {
          updated: [] as string[],
          failed: [] as any[]
        };

        for (const leadId of leadIds) {
          try {
            await storageService.updateLeadState(leadId, newState);
            results.updated.push(leadId);
          } catch (error) {
            results.failed.push({
              leadId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Bulk state update: ${results.updated.length} updated, ${results.failed.length} failed`,
          { newState, updatedCount: results.updated.length, failedCount: results.failed.length }
        );

        return res.json({
          success: true,
          data: {
            updatedCount: results.updated.length,
            failedCount: results.failed.length,
            updated: results.updated,
            failed: results.failed
          }
        });

      } catch (error) {
        console.error('Bulk update state error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Campaign Execution ====================

  if (storageService) {
    /**
     * POST /api/campaigns/:campaignId/start
     * Activate a campaign
     */
    router.post('/campaigns/:campaignId/start', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;

        const campaign = await storageService.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${campaignId}`
          });
        }

        campaign.active = true;
        campaign.startedAt = new Date();

        await storageService.saveCampaign(campaign);

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Campaign ${campaignId} started`,
          { campaignId, campaignName: campaign.name }
        );

        return res.json({
          success: true,
          data: campaign
        });

      } catch (error) {
        console.error('Start campaign error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * POST /api/campaigns/:campaignId/pause
     * Pause a campaign
     */
    router.post('/campaigns/:campaignId/pause', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;

        const campaign = await storageService.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${campaignId}`
          });
        }

        campaign.active = false;
        campaign.pausedAt = new Date();

        await storageService.saveCampaign(campaign);

        observability.log(
          LogLevel.INFO,
          LogCategory.API,
          `Campaign ${campaignId} paused`,
          { campaignId, campaignName: campaign.name }
        );

        return res.json({
          success: true,
          data: campaign
        });

      } catch (error) {
        console.error('Pause campaign error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/campaigns/:campaignId/next-batch
     * Get next batch of leads to contact for a campaign
     */
    router.get('/campaigns/:campaignId/next-batch', async (req: Request, res: Response) => {
      try {
        const { campaignId } = req.params;
        const { limit } = req.query;

        const campaign = await storageService.getCampaign(campaignId);
        if (!campaign) {
          return res.status(404).json({
            error: `Campaign not found: ${campaignId}`
          });
        }

        if (!campaign.active) {
          return res.status(400).json({
            error: 'Campaign is not active'
          });
        }

        // Get QUALIFIED leads for this campaign
        let leads = await storageService.getLeadsByCampaign(campaignId);
        leads = leads.filter(l => l.state === LeadState.QUALIFIED);

        // Apply limit
        const batchSize = limit ? parseInt(limit as string, 10) : 10;
        const batch = leads.slice(0, batchSize);

        return res.json({
          success: true,
          count: batch.length,
          totalQualified: leads.length,
          data: batch.map(l => ({
            id: l.id,
            name: l.name,
            company: l.company,
            linkedinUrl: l.linkedinUrl,
            state: l.state
          }))
        });

      } catch (error) {
        console.error('Get next batch error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  // ==================== Observability Routes ====================

  /**
   * GET /api/observability/stats
   * Get observability statistics
   * Query params: ?since=ISO8601_timestamp
   */
  router.get('/observability/stats', (req: Request, res: Response) => {
    try {
      const { since } = req.query;
      const sinceDate = since && typeof since === 'string' ? new Date(since) : undefined;

      const stats = observability.getStats(sinceDate);

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Observability stats error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * GET /api/observability/logs
   * Query observability logs
   * Query params: ?category=STATE_TRANSITION&level=ERROR&leadId=xxx&limit=100
   */
  router.get('/observability/logs', (req: Request, res: Response) => {
    try {
      const { category, level, leadId, limit, since } = req.query;

      const filters: any = {};

      if (category && typeof category === 'string') {
        filters.category = category;
      }

      if (level && typeof level === 'string') {
        filters.level = level;
      }

      if (leadId && typeof leadId === 'string') {
        filters.leadId = leadId;
      }

      if (limit && typeof limit === 'string') {
        filters.limit = parseInt(limit, 10);
      }

      if (since && typeof since === 'string') {
        filters.since = new Date(since);
      }

      const logs = observability.query(filters);

      return res.json({
        success: true,
        count: logs.length,
        data: logs
      });

    } catch (error) {
      console.error('Observability logs error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // ==================== Lead Scoring ====================

  if (storageService) {
    const researchService = new ResearchService(storageService);
    const scoringService = new ScoringService(storageService, researchService);

    /**
     * POST /api/leads/:leadId/score
     * Calculate lead score
     * Body: { forceRecalculate?: boolean }
     */
    router.post('/leads/:leadId/score', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;
        const { forceRecalculate } = req.body;

        const result = await scoringService.getLeadScore({
          leadId,
          forceRecalculate: forceRecalculate || false
        });

        if (!result.success) {
          return res.status(404).json({
            success: false,
            error: result.error
          });
        }

        return res.json({
          success: true,
          data: result.score
        });

      } catch (error) {
        console.error('Lead scoring error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/:leadId/score
     * Get current lead score (uses cached score if available)
     */
    router.get('/leads/:leadId/score', async (req: Request, res: Response) => {
      try {
        const { leadId } = req.params;

        const result = await scoringService.getLeadScore({
          leadId,
          forceRecalculate: false
        });

        if (!result.success) {
          return res.status(404).json({
            success: false,
            error: result.error
          });
        }

        return res.json({
          success: true,
          data: result.score
        });

      } catch (error) {
        console.error('Get lead score error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });

    /**
     * GET /api/leads/scores
     * Get scores for multiple leads with filtering
     * Query params:
     *   - minScore: minimum overall score (0-100)
     *   - tier: score tier (A, B, C, D, F)
     *   - state: lead state
     *   - sortBy: overallScore | icpFit | engagementLevel | scoredAt
     *   - sortOrder: asc | desc
     *   - limit: max results (default 100)
     *   - offset: pagination offset (default 0)
     */
    router.get('/leads/scores', async (req: Request, res: Response) => {
      try {
        const {
          minScore,
          tier,
          state,
          sortBy,
          sortOrder,
          limit,
          offset
        } = req.query;

        const query: any = {};

        if (minScore !== undefined && typeof minScore === 'string') {
          query.minScore = parseFloat(minScore);
        }

        if (tier && typeof tier === 'string') {
          if (['A', 'B', 'C', 'D', 'F'].includes(tier)) {
            query.tier = tier as 'A' | 'B' | 'C' | 'D' | 'F';
          }
        }

        if (state && typeof state === 'string') {
          query.state = state;
        }

        if (sortBy && typeof sortBy === 'string') {
          if (['overallScore', 'icpFit', 'engagementLevel', 'scoredAt'].includes(sortBy)) {
            query.sortBy = sortBy as 'overallScore' | 'icpFit' | 'engagementLevel' | 'scoredAt';
          }
        }

        if (sortOrder && typeof sortOrder === 'string') {
          if (['asc', 'desc'].includes(sortOrder)) {
            query.sortOrder = sortOrder as 'asc' | 'desc';
          }
        }

        if (limit && typeof limit === 'string') {
          query.limit = parseInt(limit, 10);
        }

        if (offset && typeof offset === 'string') {
          query.offset = parseInt(offset, 10);
        }

        const result = await scoringService.getBatchScores(query);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: result.error
          });
        }

        return res.json({
          success: true,
          total: result.total,
          count: result.scores.length,
          data: result.scores
        });

      } catch (error) {
        console.error('Batch scores error:', error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    });
  }

  return router;
}
