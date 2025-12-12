/**
 * Agency MCP Tools
 * New tools for multi-client agency install model
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const AGENCY_TOOLS: Tool[] = [
  {
    name: 'normalize_leads',
    description:
      'Normalize leads from any source (Sales Nav, CSV, HeyReach, Jotform, API) into unified schema with deduplication',
    inputSchema: {
      type: 'object',
      properties: {
        leads: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of leads in any format',
        },
        source: {
          type: 'string',
          enum: ['salesnav', 'csv', 'heyreach', 'jotform', 'api'],
          description: 'Source type for format detection',
        },
      },
      required: ['leads', 'source'],
    },
  },
  {
    name: 'validate_client_config',
    description:
      'Validate client onboarding configuration (ICP, offer, preferences) before activation',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        client_name: { type: 'string' },
        icp: {
          type: 'object',
          description: 'ICP criteria (company size, titles, industries, etc)',
        },
        offer: {
          type: 'object',
          description: 'Offer definition (product, value prop, outcome)',
        },
        heyreach_api_key: { type: 'string' },
        preferences: {
          type: 'object',
          description: 'Optional: tone, cta_style, risk_tolerance, etc',
        },
      },
      required: ['client_id', 'client_name', 'icp', 'offer', 'heyreach_api_key'],
    },
  },
  {
    name: 'score_leads_against_icp',
    description:
      'Score leads against client ICP with firmographic, persona, timing, and risk breakdown',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Client ID for ICP configuration',
        },
        leads: {
          type: 'array',
          items: { type: 'object' },
          description: 'Normalized leads to score',
        },
        scoring_weights: {
          type: 'object',
          description:
            'Optional: custom scoring weights (firmographic, persona, timing, risk)',
        },
      },
      required: ['client_id', 'leads'],
    },
  },
  {
    name: 'clean_lead_list',
    description:
      'Apply thresholds to scored leads and separate into keep/review/drop buckets',
    inputSchema: {
      type: 'object',
      properties: {
        scored_leads: {
          type: 'array',
          items: { type: 'object' },
          description: 'Scored leads from score_leads_against_icp',
        },
        policy: {
          type: 'object',
          properties: {
            drop_below: { type: 'number' },
            review_range: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
            },
          },
        },
      },
      required: ['scored_leads', 'policy'],
    },
  },
  {
    name: 'build_message_strategy',
    description:
      'Build messaging strategy (angle, CTA style, personalization level) based on lead context and research',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        lead: { type: 'object', description: 'Normalized lead' },
        fit_score: { type: 'number' },
        company_research: {
          type: 'object',
          description: 'Optional: Perplexity research output',
        },
        person_research: {
          type: 'object',
          description: 'Optional: Person-level research',
        },
      },
      required: ['client_id', 'lead', 'fit_score'],
    },
  },
  {
    name: 'generate_linkedin_messages',
    description:
      'Generate LinkedIn connect note, DM, and follow-ups based on strategy',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        lead: { type: 'object' },
        strategy: {
          type: 'object',
          description: 'Strategy from build_message_strategy',
        },
        research: {
          type: 'object',
          description: 'Optional: research facts to incorporate',
        },
      },
      required: ['client_id', 'lead', 'strategy'],
    },
  },
  {
    name: 'validate_message_safety',
    description:
      'Final safety check for messages (spam detection, creepy personalization, compliance)',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'object',
          description: 'Messages from generate_linkedin_messages',
        },
        channel: {
          type: 'string',
          enum: ['linkedin', 'email'],
        },
        policy: {
          type: 'object',
          properties: {
            no_creepy: { type: 'boolean' },
            no_guarantees: { type: 'boolean' },
          },
        },
      },
      required: ['messages', 'channel'],
    },
  },
  {
    name: 'classify_reply',
    description:
      'Classify reply intent (interested/timing/question/objection/not_interested) and recommend next step',
    inputSchema: {
      type: 'object',
      properties: {
        thread: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string', enum: ['us', 'them'] },
                  content: { type: 'string' },
                  timestamp: { type: 'string' },
                },
                required: ['from', 'content'],
              },
            },
          },
          required: ['messages'],
        },
        lead: { type: 'object' },
      },
      required: ['thread', 'lead'],
    },
  },
  {
    name: 'draft_reply',
    description:
      'Draft human-send reply based on classification and strategy',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        classification: {
          type: 'object',
          description: 'Classification from classify_reply',
        },
        lead: { type: 'object' },
        strategy: { type: 'object', description: 'Original message strategy' },
        constraints: {
          type: 'object',
          properties: {
            max_chars: { type: 'number' },
          },
        },
      },
      required: ['client_id', 'classification', 'lead'],
    },
  },
  {
    name: 'list_clients',
    description:
      'List all configured clients with their status and install dates',
    inputSchema: {
      type: 'object',
      properties: {
        status_filter: {
          type: 'string',
          enum: ['active', 'paused', 'archived', 'all'],
          description: 'Filter by client status',
        },
      },
    },
  },
  {
    name: 'get_client_config',
    description: 'Get full configuration for a specific client',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
      },
      required: ['client_id'],
    },
  },
];
