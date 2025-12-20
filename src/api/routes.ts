import { Router, Request, Response } from 'express';
import { ClassificationController } from '../controllers/ClassificationController';
import { DraftFollowupTool } from '../tools/draftFollowup';
import { StorageService } from '../services/StorageService';
import { compareVariants, formatComparison } from '../utils/variantAnalytics';
import { v4 as uuidv4 } from 'uuid';
import observability from '../services/ObservabilityService';

export function createRouter(
  controller: ClassificationController,
  followupTool?: DraftFollowupTool,
  storageService?: StorageService
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
            .filter(m => m.sender === 'user')
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
          const message = lead.conversationHistory.find(m => m.id === messageId);
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
