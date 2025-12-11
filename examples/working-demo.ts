#!/usr/bin/env tsx

/**
 * Quick Demo - Working Features
 * This demonstrates all the features that are currently working
 */

import { AIOutreachAgent } from '../src/index.js';
import type { Lead } from '../src/types/index.js';

async function quickDemo() {
  console.log('\n🎯 AI Outreach Agent - Working Features Demo\n');
  console.log('='.repeat(60));

  const agent = new AIOutreachAgent();

  // 1. Import Leads
  console.log('\n📥 1. IMPORTING LEADS');
  console.log('-'.repeat(60));

  const leads: Partial<Lead>[] = [
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
      email: 'michael@startup.io',
      linkedInUrl: 'https://linkedin.com/in/michaelchen',
      title: 'Head of Marketing',
      company: 'StartupXYZ',
      companySize: 45,
      location: 'Austin, TX',
      industry: 'SaaS',
    },
    {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@enterprise.com',
      linkedInUrl: 'https://linkedin.com/in/emilyrodriguez',
      title: 'Director of Business Development',
      company: 'Enterprise Solutions',
      companySize: 800,
      location: 'New York, NY',
      industry: 'Enterprise Software',
    },
  ];

  const importResult = await agent.leads.importLeads('api', leads);
  console.log(`✅ Imported: ${importResult.imported} leads`);
  if (importResult.failed > 0) {
    console.log(`❌ Failed: ${importResult.failed}`);
  }

  // 2. Define ICP and Validate
  console.log('\n🎯 2. ICP VALIDATION');
  console.log('-'.repeat(60));

  const icpCriteria = {
    titles: ['VP', 'Director', 'Head of', 'Chief'],
    companySize: { min: 50, max: 500 },
    locations: ['United States'],
    industries: ['Software', 'SaaS', 'Technology'],
  };

  const allLeads = agent.leads.getAllLeads();
  const validationResults = await agent.leads.validateLeads(
    allLeads.map(l => l.id),
    icpCriteria
  );

  validationResults.forEach(result => {
    const emoji = result.isValid ? '✅' : '❌';
    const lead = result.lead;
    console.log(`${emoji} ${lead.firstName} ${lead.lastName}`);
    console.log(`   ${lead.title} at ${lead.company}`);
    console.log(`   Company Size: ${lead.companySize || 'Unknown'}`);

    if (!result.isValid && result.errors.length > 0) {
      console.log(`   ❌ Errors: ${result.errors.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
    }
    console.log();
  });

  const validLeads = validationResults.filter(r => r.isValid);
  console.log(`📊 Result: ${validLeads.length} of ${validationResults.length} leads match ICP`);

  // 3. Safety Checks
  console.log('\n🛡️  3. SAFETY CHECKS');
  console.log('-'.repeat(60));

  const checks = [
    { action: 'linkedin_connection', label: 'LinkedIn Connection' },
    { action: 'linkedin_message', label: 'LinkedIn Message' },
    { action: 'email', label: 'Email' },
  ];

  for (const { action, label } of checks) {
    const check = await agent.safety.checkAction(action as any);
    const status = check.allowed ? '✅ Allowed' : '❌ Blocked';
    console.log(`${label}: ${status}`);
    if (!check.allowed) {
      console.log(`   Reason: ${check.reason}`);
    }
  }

  // Get recommended delay
  const delay = agent.safety.getRandomDelay(120);
  console.log(`\n⏱️  Recommended delay: ${delay} seconds (base: 120s)`);

  // 4. Message Validation
  console.log('\n✉️  4. MESSAGE VALIDATION');
  console.log('-'.repeat(60));

  const messages = [
    {
      text: 'Hi Sarah, noticed your work at TechCorp. Would love to connect!',
      label: 'Good message',
    },
    {
      text: 'CLICK HERE NOW!!! FREE MONEY!!! ACT FAST!!!',
      label: 'Spam message',
    },
    {
      text: 'Hey! This is a very short message.',
      label: 'Short message',
    },
  ];

  messages.forEach(({ text, label }) => {
    const validation = agent.safety.validateMessage(text);
    const status = validation.valid ? '✅ Valid' : '❌ Invalid';

    console.log(`\n${label}:`);
    console.log(`Status: ${status}`);
    console.log(`Preview: "${text.substring(0, 50)}..."`);

    if (!validation.valid) {
      console.log(`Issues: ${validation.issues.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`Warnings: ${validation.warnings.join(', ')}`);
    }
  });

  // 5. Reply Classification (Rule-Based)
  console.log('\n💬 5. REPLY CLASSIFICATION (Rule-Based)');
  console.log('-'.repeat(60));

  const sampleReplies = [
    "Sounds interesting! Let's schedule a call next week.",
    "Not interested, please remove me from your list.",
    "I'm out of office until January. Please reach out then.",
    "Thanks for reaching out! Can you send me more info?",
    "Wrong person - I don't handle sales decisions.",
  ];

  for (const replyText of sampleReplies) {
    const reply = await agent.feedback.tagReply({
      content: replyText,
      leadId: validLeads[0]?.lead.id || 'demo',
    });

    console.log(`\nReply: "${replyText}"`);
    console.log(`  📊 Sentiment: ${reply.sentiment}`);
    console.log(`  🎯 Intent: ${reply.intent}`);
    console.log(`  🏷️  Tags: ${reply.tags.join(', ')}`);
  }

  // 6. Account Health
  console.log('\n🏥 6. ACCOUNT HEALTH');
  console.log('-'.repeat(60));

  const health = agent.safety.getAccountHealth('default');
  console.log(`Status: ${health.status.toUpperCase()}`);
  console.log(`Warnings: ${health.warnings.length}`);
  console.log('\nUsage Today:');
  console.log(`  LinkedIn Connections: ${health.usageToday.linkedInConnections}`);
  console.log(`  LinkedIn Messages: ${health.usageToday.linkedInMessages}`);
  console.log(`  Emails: ${health.usageToday.emails}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ DEMO COMPLETE!');
  console.log('\n📊 What\'s Working:');
  console.log('  ✅ Lead import from CSV/API');
  console.log('  ✅ ICP validation with configurable criteria');
  console.log('  ✅ Safety checks and rate limiting');
  console.log('  ✅ Message validation (spam detection)');
  console.log('  ✅ Reply classification (rule-based)');
  console.log('  ✅ Account health monitoring');
  console.log('  ✅ Behavioral simulation (randomized delays)');

  console.log('\n⚠️  Requires Valid Anthropic API Key:');
  console.log('  ⏸️  AI message generation');
  console.log('  ⏸️  AI reply classification');
  console.log('  ⏸️  Campaign insights generation');

  console.log('\n💡 Next Steps:');
  console.log('  1. Get a valid Anthropic API key for full AI features');
  console.log('  2. Configure your HeyReach API for campaign execution');
  console.log('  3. Import your real leads');
  console.log('  4. Create and run your first campaign!');

  console.log('\n🎯 You can still use the system effectively with:');
  console.log('  • Manual message writing');
  console.log('  • Rule-based reply classification');
  console.log('  • All safety and validation features');
  console.log();
}

quickDemo().catch(console.error);
