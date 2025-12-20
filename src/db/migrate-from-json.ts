/**
 * Data Migration: JSON Files → PostgreSQL
 *
 * Migrates existing data from file-based storage to PostgreSQL.
 *
 * Run: npm run db:migrate-data
 */

import fs from 'fs/promises';
import path from 'path';
import { db, testConnection } from './connection';
import * as schema from './schema';
import { v4 as uuidv4 } from 'uuid';

interface JsonLead {
  id: string;
  name: string;
  email?: string;
  company?: string;
  linkedinUrl?: string;
  campaignId?: string;
  state: string;
  conversationHistory: Array<{
    id: string;
    leadId: string;
    content: string;
    sender: 'user' | 'lead';
    timestamp: Date;
    messageType?: 'initial' | 'follow-up' | 'reply';
    variant?: 'A' | 'B';
    classification?: any;
  }>;
  lastClassification?: {
    intent: string;
    sentiment: string;
    confidence: number;
    next_state: string;
  };
  research_snapshot?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface JsonCampaign {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  messaging_rules: any;
  createdAt: Date;
  updatedAt: Date;
}

async function migrateData() {
  console.log('🚀 Starting data migration from JSON to PostgreSQL...\n');

  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Check configuration.');
    process.exit(1);
  }

  try {
    // Read JSON files
    const dataDir = path.join(process.cwd(), 'data');
    const leadsFile = path.join(dataDir, 'leads.json');
    const campaignsFile = path.join(dataDir, 'campaigns.json');
    const classificationsFile = path.join(dataDir, 'classifications.json');

    // Check if files exist
    let leadsExist = false;
    let campaignsExist = false;
    let classificationsExist = false;

    try {
      await fs.access(leadsFile);
      leadsExist = true;
    } catch {
      console.log('ℹ️  No leads.json file found, skipping leads migration');
    }

    try {
      await fs.access(campaignsFile);
      campaignsExist = true;
    } catch {
      console.log('ℹ️  No campaigns.json file found, skipping campaigns migration');
    }

    try {
      await fs.access(classificationsFile);
      classificationsExist = true;
    } catch {
      console.log('ℹ️  No classifications.json file found, skipping classifications migration');
    }

    // Migrate campaigns first (referenced by leads)
    let campaignCount = 0;
    if (campaignsExist) {
      console.log('\n📦 Migrating campaigns...');
      const campaignsData = await fs.readFile(campaignsFile, 'utf-8');
      const campaigns: JsonCampaign[] = JSON.parse(campaignsData);

      for (const campaign of campaigns) {
        await db.insert(schema.campaigns).values({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          active: campaign.active,
          messaging_rules: campaign.messaging_rules,
          created_at: new Date(campaign.createdAt),
          updated_at: new Date(campaign.updatedAt)
        }).onConflictDoNothing();

        campaignCount++;
      }

      console.log(`✅ Migrated ${campaignCount} campaigns`);
    }

    // Migrate leads
    let leadCount = 0;
    let messageCount = 0;
    let researchCount = 0;

    if (leadsExist) {
      console.log('\n📦 Migrating leads...');
      const leadsData = await fs.readFile(leadsFile, 'utf-8');
      const leads: JsonLead[] = JSON.parse(leadsData);

      for (const lead of leads) {
        // Insert lead
        await db.insert(schema.leads).values({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          linkedin_url: lead.linkedinUrl,
          campaign_id: lead.campaignId,
          state: lead.state,
          created_at: new Date(lead.createdAt),
          updated_at: new Date(lead.updatedAt)
        }).onConflictDoNothing();

        leadCount++;

        // Insert messages
        for (const message of lead.conversationHistory || []) {
          await db.insert(schema.messages).values({
            id: message.id,
            lead_id: lead.id,
            content: message.content,
            sender: message.sender,
            timestamp: new Date(message.timestamp),
            message_type: message.messageType,
            variant: message.variant
          }).onConflictDoNothing();

          messageCount++;
        }

        // Insert last classification if exists
        if (lead.lastClassification) {
          await db.insert(schema.classifications).values({
            id: uuidv4(),
            lead_id: lead.id,
            message_id: null, // Don't have message ID from old format
            intent: lead.lastClassification.intent,
            sentiment: lead.lastClassification.sentiment,
            confidence: lead.lastClassification.confidence,
            next_state: lead.lastClassification.next_state
          }).onConflictDoNothing();
        }

        // Insert research snapshot if exists
        if (lead.research_snapshot) {
          await db.insert(schema.research_snapshots).values({
            id: uuidv4(),
            lead_id: lead.id,
            company_name: lead.research_snapshot.companyName,
            company_description: lead.research_snapshot.companyDescription,
            industry: lead.research_snapshot.industry,
            recent_news: lead.research_snapshot.recentNews,
            key_products: lead.research_snapshot.keyProducts,
            challenges: lead.research_snapshot.challenges,
            opportunities: lead.research_snapshot.opportunities,
            funding_info: lead.research_snapshot.fundingInfo,
            employee_count: lead.research_snapshot.employeeCount,
            sources: lead.research_snapshot.sources,
            researched_at: new Date(lead.research_snapshot.researched_at)
          }).onConflictDoNothing();

          researchCount++;
        }
      }

      console.log(`✅ Migrated ${leadCount} leads`);
      console.log(`✅ Migrated ${messageCount} messages`);
      console.log(`✅ Migrated ${researchCount} research snapshots`);
    }

    // Migrate standalone classifications (if any)
    let classificationCount = 0;
    if (classificationsExist) {
      console.log('\n📦 Migrating classifications...');
      const classificationsData = await fs.readFile(classificationsFile, 'utf-8');
      const classifications: any[] = JSON.parse(classificationsData);

      for (const classification of classifications) {
        await db.insert(schema.classifications).values({
          id: uuidv4(),
          lead_id: classification.leadId,
          message_id: classification.messageId,
          intent: classification.classification.intent,
          sentiment: classification.classification.sentiment,
          confidence: classification.classification.confidence,
          next_state: classification.classification.next_state,
          created_at: new Date(classification.timestamp)
        }).onConflictDoNothing();

        classificationCount++;
      }

      console.log(`✅ Migrated ${classificationCount} standalone classifications`);
    }

    console.log('\n🎉 Data migration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Campaigns: ${campaignCount}`);
    console.log(`  - Leads: ${leadCount}`);
    console.log(`  - Messages: ${messageCount}`);
    console.log(`  - Research Snapshots: ${researchCount}`);
    console.log(`  - Classifications: ${classificationCount}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
