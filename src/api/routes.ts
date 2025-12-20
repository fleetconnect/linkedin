import { Router, Request, Response } from 'express';
import { ClassificationController } from '../controllers/ClassificationController';
import { DraftFollowupTool } from '../tools/draftFollowup';
import { IStorageService } from '../services/StorageFactory';
import { compareVariants, formatComparison } from '../utils/variantAnalytics';
import { v4 as uuidv4 } from 'uuid';
import observability from '../services/ObservabilityService';
import { LeadState } from '../types';

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

  return router;
}
