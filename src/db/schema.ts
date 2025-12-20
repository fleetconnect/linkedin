/**
 * PostgreSQL Database Schema
 *
 * Tables:
 * - leads
 * - campaigns
 * - messages
 * - classifications
 * - research_snapshots
 *
 * NO analytics tables. NO warehouse. Keep it minimal.
 *
 * Rule: All state transitions must be transactional.
 */

import { pgTable, text, timestamp, jsonb, integer, real, boolean, uuid, varchar, index } from 'drizzle-orm/pg-core';

/**
 * Campaigns table
 */
export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  messaging_rules: jsonb('messaging_rules').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Leads table
 * Core entity with state machine
 */
export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  company: text('company'),
  linkedin_url: text('linkedin_url'),
  campaign_id: text('campaign_id').references(() => campaigns.id),

  // State machine (indexed for querying)
  state: text('state').notNull().default('NEW'),

  // Timestamps
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  // Indexes for performance
  stateIdx: index('leads_state_idx').on(table.state),
  campaignIdx: index('leads_campaign_idx').on(table.campaign_id),
  updatedAtIdx: index('leads_updated_at_idx').on(table.updated_at)
}));

/**
 * Messages table
 * Conversation history
 */
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  lead_id: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  sender: text('sender').notNull(), // 'user' | 'lead'
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  message_type: text('message_type'), // 'initial' | 'follow-up' | 'reply'
  variant: text('variant'), // 'A' | 'B' (for A/B testing)

  created_at: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  // Indexes for querying conversation history
  leadIdx: index('messages_lead_idx').on(table.lead_id),
  timestampIdx: index('messages_timestamp_idx').on(table.timestamp)
}));

/**
 * Classifications table
 * Intent classification history
 */
export const classifications = pgTable('classifications', {
  id: text('id').primaryKey(),
  lead_id: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  message_id: text('message_id').references(() => messages.id, { onDelete: 'set null' }),

  // Classification results
  intent: text('intent').notNull(), // 'interested' | 'booked' | 'neutral' | 'negative'
  sentiment: text('sentiment').notNull(), // 'positive' | 'neutral' | 'negative'
  confidence: real('confidence').notNull(),
  next_state: text('next_state').notNull(),
  reasoning: text('reasoning'),

  // Metadata
  model_used: text('model_used'),
  prompt_version: text('prompt_version'),

  created_at: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  // Indexes for analytics
  leadIdx: index('classifications_lead_idx').on(table.lead_id),
  intentIdx: index('classifications_intent_idx').on(table.intent),
  createdAtIdx: index('classifications_created_at_idx').on(table.created_at)
}));

/**
 * Research snapshots table
 * Company research data from Perplexity
 */
export const research_snapshots = pgTable('research_snapshots', {
  id: text('id').primaryKey(),
  lead_id: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

  // Research data
  company_name: text('company_name').notNull(),
  company_description: text('company_description'),
  industry: text('industry'),
  recent_news: jsonb('recent_news'), // string[]
  key_products: jsonb('key_products'), // string[]
  challenges: jsonb('challenges'), // string[]
  opportunities: jsonb('opportunities'), // string[]
  funding_info: text('funding_info'),
  employee_count: text('employee_count'),
  sources: jsonb('sources'), // string[]

  // Timestamps
  researched_at: timestamp('researched_at').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  // Index for finding research by lead
  leadIdx: index('research_snapshots_lead_idx').on(table.lead_id),
  researchedAtIdx: index('research_snapshots_researched_at_idx').on(table.researched_at)
}));

/**
 * Type exports for application use
 */
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Classification = typeof classifications.$inferSelect;
export type NewClassification = typeof classifications.$inferInsert;

export type ResearchSnapshot = typeof research_snapshots.$inferSelect;
export type NewResearchSnapshot = typeof research_snapshots.$inferInsert;
