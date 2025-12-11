/**
 * Demo Workflow - Shows how to use the AI Outreach Agent
 *
 * This script demonstrates a complete outreach workflow:
 * 1. Initialize the agent
 * 2. Import leads
 * 3. Validate against ICP
 * 4. Create a campaign
 * 5. Generate personalized messages
 * 6. Send messages (with safety checks)
 */

import { AIOutreachAgent } from '../src/index.js';
import type { Lead } from '../src/types/index.js';

async function runDemoWorkflow() {
  console.log('🚀 Starting AI Outreach Agent Demo\n');

  // Step 1: Initialize the agent
  console.log('Step 1: Initializing AI Outreach Agent...');
  const agent = new AIOutreachAgent();

  // Check system status
  const status = await agent.getStatus();
  console.log('System Status:', JSON.stringify(status, null, 2));
  console.log('✅ Agent initialized\n');

  // Step 2: Import leads
  console.log('Step 2: Importing leads...');
  const sampleLeads: Partial<Lead>[] = [
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@techcorp.com',
      linkedInUrl: 'https://linkedin.com/in/sarahjohnson',
      title: 'VP of Sales',
      company: 'TechCorp Inc',
      companySize: 250,
      location: 'San Francisco, CA',
      industry: 'Computer Software',
    },
    {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael@innovate.io',
      linkedInUrl: 'https://linkedin.com/in/michaelchen',
      title: 'Director of Sales',
      company: 'Innovate.io',
      companySize: 120,
      location: 'New York, NY',
      industry: 'SaaS',
    },
    {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@cloudtech.com',
      linkedInUrl: 'https://linkedin.com/in/emilyrodriguez',
      title: 'Head of Business Development',
      company: 'CloudTech Solutions',
      companySize: 180,
      location: 'Austin, TX',
      industry: 'Cloud Computing',
    },
  ];

  const importResult = await agent.leads.importLeads('api', sampleLeads);
  console.log(`✅ Imported ${importResult.imported} leads`);
  if (importResult.failed > 0) {
    console.log(`⚠️  Failed: ${importResult.failed}`);
    console.log('Errors:', importResult.errors);
  }
  console.log();

  // Step 3: Validate against ICP
  console.log('Step 3: Validating leads against ICP...');
  const allLeads = agent.leads.getAllLeads();
  const leadIds = allLeads.map(l => l.id);

  const icpCriteria = {
    titles: ['VP', 'Director', 'Head of', 'Chief'],
    companySize: { min: 50, max: 500 },
    locations: ['United States', 'San Francisco', 'New York', 'Austin'],
    industries: ['Software', 'SaaS', 'Cloud', 'Technology'],
  };

  const validationResults = await agent.leads.validateLeads(leadIds, icpCriteria);
  const validLeads = validationResults.filter(r => r.isValid);

  console.log(`✅ ${validLeads.length} of ${leadIds.length} leads validated`);
  validationResults.forEach(result => {
    const status = result.isValid ? '✓' : '✗';
    console.log(`  ${status} ${result.lead.firstName} ${result.lead.lastName} - ${result.lead.title} at ${result.lead.company}`);
    if (!result.isValid && result.errors.length > 0) {
      console.log(`    Errors: ${result.errors.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      console.log(`    Warnings: ${result.warnings.join(', ')}`);
    }
  });
  console.log();

  // Step 4: Create a campaign
  console.log('Step 4: Creating campaign...');
  const campaign = await agent.campaigns.createCampaign({
    name: 'Q1 2025 Tech Executive Demo',
    icpCriteria,
    sequences: [
      {
        name: 'LinkedIn Connection Sequence',
        channel: 'linkedin_message' as any,
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            channel: 'linkedin_connection' as any,
            delayHours: 0,
            messageTemplate: 'Hi {firstName}, noticed your work at {company}!',
            aiGenerated: false,
          },
          {
            id: 'step-2',
            stepNumber: 2,
            channel: 'linkedin_message' as any,
            delayHours: 48,
            aiGenerated: true,
          },
        ],
      },
    ],
    settings: {
      dailyLimit: 50,
      messageDelaySeconds: 120,
      autoFollowUp: true,
      autoTagging: true,
      autoSend: false, // Manual approval for demo
      safeguards: {
        maxDailyLinkedInConnections: 50,
        maxDailyLinkedInMessages: 100,
        maxDailyEmails: 200,
        enableProxyRotation: true,
        enableBehavioralSimulation: true,
        spamFilterEnabled: true,
      },
    },
  });

  console.log(`✅ Campaign created: ${campaign.id}`);
  console.log(`   Name: ${campaign.name}`);
  console.log(`   Status: ${campaign.status}`);
  console.log();

  // Step 5: Generate personalized messages
  console.log('Step 5: Generating personalized messages...');

  for (const validationResult of validLeads.slice(0, 3)) {
    const lead = validationResult.lead;

    console.log(`\nGenerating message for ${lead.firstName} ${lead.lastName}...`);

    try {
      const message = await agent.personalization.generateMessage({
        leadId: lead.id,
        campaignId: campaign.id,
        stepNumber: 1,
      });

      console.log(`✅ Generated (confidence: ${(message.confidence * 100).toFixed(0)}%)`);
      console.log(`   Personalization factors: ${message.personalizationFactors.join(', ')}`);
      console.log(`   Message preview:`);
      console.log(`   "${message.content.substring(0, 150)}..."`);

      // Validate message
      const validation = agent.safety.validateMessage(message.content);
      if (validation.valid) {
        console.log(`   ✓ Message passed validation`);
      } else {
        console.log(`   ✗ Validation issues: ${validation.issues.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate message: ${error}`);
    }
  }
  console.log();

  // Step 6: Safety checks
  console.log('Step 6: Running safety checks...');

  const linkedInCheck = await agent.safety.checkAction('linkedin_message');
  console.log(`LinkedIn messages: ${linkedInCheck.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  if (!linkedInCheck.allowed) {
    console.log(`   Reason: ${linkedInCheck.reason}`);
    if (linkedInCheck.suggestedDelay) {
      console.log(`   Suggested delay: ${linkedInCheck.suggestedDelay}s`);
    }
  }

  const emailCheck = await agent.safety.checkAction('email');
  console.log(`Email: ${emailCheck.allowed ? '✅ Allowed' : '❌ Blocked'}`);

  console.log();

  // Step 7: Demo reply classification
  console.log('Step 7: Demo reply classification...');

  const sampleReplies = [
    "Sounds interesting! Let's schedule a call next week.",
    "Not interested, please remove me from your list.",
    "I'm out of office until next month.",
    "Thanks for reaching out! Can you send me more information?",
  ];

  for (const replyContent of sampleReplies) {
    const reply = await agent.feedback.tagReply({
      content: replyContent,
      leadId: validLeads[0]?.lead.id || 'demo-lead',
    });

    console.log(`\nReply: "${replyContent}"`);
    console.log(`  Sentiment: ${reply.sentiment}`);
    console.log(`  Intent: ${reply.intent}`);
    console.log(`  Tags: ${reply.tags.join(', ')}`);
  }
  console.log();

  // Final summary
  console.log('📊 Demo Summary:');
  console.log(`  Leads imported: ${importResult.imported}`);
  console.log(`  Leads validated: ${validLeads.length}`);
  console.log(`  Campaign created: ${campaign.id}`);
  console.log(`  Messages generated: ${validLeads.length}`);
  console.log('\n✨ Demo completed successfully!\n');

  console.log('Next steps:');
  console.log('  1. Add your API keys to .env file');
  console.log('  2. Customize campaign configuration in config/campaign-example.json');
  console.log('  3. Import your real leads');
  console.log('  4. Set ENABLE_AUTO_SEND=true to send messages automatically');
}

// Run the demo
runDemoWorkflow().catch(error => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
