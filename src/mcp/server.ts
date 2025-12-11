#!/usr/bin/env node

/**
 * MCP Server for AI Outreach Agent
 * Provides tools for Claude to interact with the outreach system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { HeyReachClient } from '../api/heyreach.js';
import { LeadManager } from '../core/leads/manager.js';
import { PersonalizationEngine } from '../core/personalization/engine.js';
import { CampaignOrchestrator } from '../core/campaigns/orchestrator.js';
import { FeedbackLoop } from '../core/feedback/loop.js';
import { SafetyGuard } from '../core/safety/guard.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { MCPToolResult } from '../types/index.js';

class OutreachMCPServer {
  private server: Server;
  private heyReachClient: HeyReachClient;
  private leadManager: LeadManager;
  private personalizationEngine: PersonalizationEngine;
  private campaignOrchestrator: CampaignOrchestrator;
  private feedbackLoop: FeedbackLoop;
  private safetyGuard: SafetyGuard;

  constructor() {
    this.server = new Server(
      {
        name: 'ai-outreach-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize components
    this.heyReachClient = new HeyReachClient(config.api.heyReach);
    this.leadManager = new LeadManager();
    this.personalizationEngine = new PersonalizationEngine();
    this.campaignOrchestrator = new CampaignOrchestrator(
      this.heyReachClient,
      this.personalizationEngine
    );
    this.feedbackLoop = new FeedbackLoop();
    this.safetyGuard = new SafetyGuard(config.limits);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info(`MCP tool called: ${name}`, { args });

        switch (name) {
          case 'import_leads':
            return await this.handleImportLeads(args);
          case 'validate_leads':
            return await this.handleValidateLeads(args);
          case 'get_campaign_status':
            return await this.handleGetCampaignStatus(args);
          case 'generate_message':
            return await this.handleGenerateMessage(args);
          case 'send_message':
            return await this.handleSendMessage(args);
          case 'schedule_followup':
            return await this.handleScheduleFollowup(args);
          case 'tag_reply':
            return await this.handleTagReply(args);
          case 'pause_campaign':
            return await this.handlePauseCampaign(args);
          case 'get_insights':
            return await this.handleGetInsights(args);
          case 'update_lead_status':
            return await this.handleUpdateLeadStatus(args);
          case 'check_safety_limits':
            return await this.handleCheckSafetyLimits(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              } as MCPToolResult),
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'import_leads',
        description: 'Import and enrich leads from CSV or API source',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Source type: csv, clay, or api',
            },
            data: {
              type: 'string',
              description: 'CSV file path or JSON data',
            },
            campaignId: {
              type: 'string',
              description: 'Campaign ID to associate leads with',
            },
          },
          required: ['source', 'data'],
        },
      },
      {
        name: 'validate_leads',
        description: 'Validate leads against ICP criteria and data quality checks',
        inputSchema: {
          type: 'object',
          properties: {
            leadIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of lead IDs to validate',
            },
            icpCriteria: {
              type: 'object',
              description: 'ICP criteria to validate against',
            },
          },
          required: ['leadIds'],
        },
      },
      {
        name: 'get_campaign_status',
        description: 'Get current status and metrics for a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID',
            },
          },
          required: ['campaignId'],
        },
      },
      {
        name: 'generate_message',
        description: 'Generate personalized message using AI based on lead context',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
            campaignId: {
              type: 'string',
              description: 'Campaign ID',
            },
            stepNumber: {
              type: 'number',
              description: 'Sequence step number',
            },
            context: {
              type: 'object',
              description: 'Additional context for message generation',
            },
          },
          required: ['leadId', 'campaignId'],
        },
      },
      {
        name: 'send_message',
        description: 'Send a message through HeyReach (subject to safety checks)',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
            messageId: {
              type: 'string',
              description: 'Message ID (if pre-generated)',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            channel: {
              type: 'string',
              enum: ['linkedin_connection', 'linkedin_message', 'email'],
              description: 'Communication channel',
            },
          },
          required: ['leadId', 'content', 'channel'],
        },
      },
      {
        name: 'schedule_followup',
        description: 'Schedule a follow-up message for a lead',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
            delayHours: {
              type: 'number',
              description: 'Delay in hours before sending follow-up',
            },
            messageTemplate: {
              type: 'string',
              description: 'Message template or content',
            },
          },
          required: ['leadId', 'delayHours'],
        },
      },
      {
        name: 'tag_reply',
        description: 'Classify and tag a reply from a lead',
        inputSchema: {
          type: 'object',
          properties: {
            replyId: {
              type: 'string',
              description: 'Reply ID',
            },
            content: {
              type: 'string',
              description: 'Reply content',
            },
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
          },
          required: ['content', 'leadId'],
        },
      },
      {
        name: 'pause_campaign',
        description: 'Pause a campaign or specific sequence',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID',
            },
            leadId: {
              type: 'string',
              description: 'Optional: pause campaign for specific lead only',
            },
            reason: {
              type: 'string',
              description: 'Reason for pausing',
            },
          },
          required: ['campaignId'],
        },
      },
      {
        name: 'get_insights',
        description: 'Get AI-generated insights and recommendations for a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID',
            },
            timeframe: {
              type: 'string',
              description: 'Timeframe for insights (e.g., "7d", "30d")',
            },
          },
          required: ['campaignId'],
        },
      },
      {
        name: 'update_lead_status',
        description: 'Update the status of a lead',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Lead ID',
            },
            status: {
              type: 'string',
              enum: ['new', 'validated', 'in_campaign', 'replied', 'positive', 'negative', 'bounced', 'unsubscribed', 'converted'],
              description: 'New status',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tags to add',
            },
          },
          required: ['leadId', 'status'],
        },
      },
      {
        name: 'check_safety_limits',
        description: 'Check if an action would exceed safety limits',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['linkedin_connection', 'linkedin_message', 'email'],
              description: 'Action type to check',
            },
            count: {
              type: 'number',
              description: 'Number of actions to check',
            },
          },
          required: ['action'],
        },
      },
    ];
  }

  // Tool handler implementations
  private async handleImportLeads(args: any) {
    const result = await this.leadManager.importLeads(args.source, args.data, args.campaignId);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: result } as MCPToolResult) }],
    };
  }

  private async handleValidateLeads(args: any) {
    const results = await this.leadManager.validateLeads(args.leadIds, args.icpCriteria);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: results } as MCPToolResult) }],
    };
  }

  private async handleGetCampaignStatus(args: any) {
    const status = await this.campaignOrchestrator.getCampaignStatus(args.campaignId);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: status } as MCPToolResult) }],
    };
  }

  private async handleGenerateMessage(args: any) {
    const message = await this.personalizationEngine.generateMessage({
      leadId: args.leadId,
      campaignId: args.campaignId,
      stepNumber: args.stepNumber,
      context: args.context,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: message } as MCPToolResult) }],
    };
  }

  private async handleSendMessage(args: any) {
    // Safety check first
    const safetyCheck = await this.safetyGuard.checkAction(args.channel, 1);
    if (!safetyCheck.allowed) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: safetyCheck.reason,
            } as MCPToolResult),
          },
        ],
      };
    }

    const result = await this.campaignOrchestrator.sendMessage(args);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: result } as MCPToolResult) }],
    };
  }

  private async handleScheduleFollowup(args: any) {
    const result = await this.campaignOrchestrator.scheduleFollowup(args);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: result } as MCPToolResult) }],
    };
  }

  private async handleTagReply(args: any) {
    const result = await this.feedbackLoop.tagReply(args);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: result } as MCPToolResult) }],
    };
  }

  private async handlePauseCampaign(args: any) {
    const result = await this.campaignOrchestrator.pauseCampaign(args.campaignId, args.leadId, args.reason);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: result } as MCPToolResult) }],
    };
  }

  private async handleGetInsights(args: any) {
    const insights = await this.feedbackLoop.getInsights(args.campaignId, args.timeframe);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: insights } as MCPToolResult) }],
    };
  }

  private async handleUpdateLeadStatus(args: any) {
    const result = await this.leadManager.updateLeadStatus(args.leadId, args.status, args.tags);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: result } as MCPToolResult) }],
    };
  }

  private async handleCheckSafetyLimits(args: any) {
    const check = await this.safetyGuard.checkAction(args.action, args.count || 1);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, data: check } as MCPToolResult) }],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server started');
  }
}

// Start server
const server = new OutreachMCPServer();
server.run().catch((error) => {
  logger.error('Server error:', error);
  process.exit(1);
});
