import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Import services
import { StorageService } from '../src/services/StorageService';
import { LLMService } from '../src/services/LLMService';
import { MessageGenerationService } from '../src/services/MessageGenerationService';
import { PerplexityService } from '../src/services/PerplexityService';

// Import tools
import { ResearchCompanyTool } from '../src/tools/researchCompany';
import { DraftFollowupTool } from '../src/tools/draftFollowup';

// Import controllers
import { ClassificationController } from '../src/controllers/ClassificationController';

// Import types
import { LeadState } from '../src/types';

dotenv.config();

/**
 * Complete Follow-up Loop Demonstration
 *
 * This demonstrates the COMPLETE conversational loop:
 * 1. Lead is qualified & receives initial message
 * 2. Lead replies
 * 3. System classifies reply
 * 4. System auto-generates follow-up (ONLY for interested/neutral)
 * 5. Follow-up is added to lead.messages[]
 */
async function demonstrateCompleteLoop() {
  console.log('🔄 LinkedIn Follow-up Loop - Complete Demo\n');
  console.log('This demo shows how replies are classified and follow-ups');
  console.log('are automatically generated for interested/neutral leads\n');
  console.log('='.repeat(60));

  // Initialize services
  const storageService = new StorageService('./data');
  await storageService.initialize();

  const llmService = new LLMService();
  const perplexityService = new PerplexityService();
  const researchTool = new ResearchCompanyTool(perplexityService, storageService);
  const messageService = new MessageGenerationService(researchTool);

  // Initialize follow-up tool
  const followupTool = new DraftFollowupTool(messageService, storageService);

  // Initialize controller WITH follow-up tool and auto-generation enabled
  const controller = new ClassificationController(
    llmService,
    storageService,
    followupTool,
    {
      autoGenerateFollowups: true  // ⭐ Enable auto follow-ups
    }
  );

  console.log('\n✅ Services initialized\n');

  // ==================== Setup: Create Campaign & Leads ====================
  console.log('📋 Setup: Creating campaign and test leads\n');

  const campaignId = uuidv4();
  await storageService.createCampaign({
    id: campaignId,
    name: 'Q1 Outreach Campaign',
    messaging_rules: {
      personalization: true,
      toneOfVoice: 'professional'
    }
  });

  // Create 4 leads with different response scenarios
  const leads = [
    {
      id: uuidv4(),
      name: 'Sarah Chen',
      company: 'Stripe',
      scenario: 'interested',
      reply: "Thanks for reaching out! I'd love to learn more about this. Can we schedule a call next week?"
    },
    {
      id: uuidv4(),
      name: 'Michael Johnson',
      company: 'Shopify',
      scenario: 'neutral',
      reply: "Thanks for the message. I'll keep this in mind for the future."
    },
    {
      id: uuidv4(),
      name: 'Emily Davis',
      company: 'Square',
      scenario: 'negative',
      reply: "Not interested. Please remove me from your list."
    },
    {
      id: uuidv4(),
      name: 'David Kim',
      company: 'PayPal',
      scenario: 'booked',
      reply: "Yes! Let's do Tuesday at 2pm. I'll send you a calendar invite."
    }
  ];

  for (const leadData of leads) {
    await storageService.createLead({
      id: leadData.id,
      name: leadData.name,
      company: leadData.company,
      campaignId: campaignId
    });
    await storageService.updateLeadState(leadData.id, LeadState.CONTACTED);
  }

  console.log(`✅ Created ${leads.length} test leads\n`);

  // ==================== Process Each Lead's Reply ====================
  console.log('\n' + '='.repeat(60));
  console.log('🔄 PROCESSING REPLIES & GENERATING FOLLOW-UPS');
  console.log('='.repeat(60));

  for (const leadData of leads) {
    console.log(`\n\n📧 Lead: ${leadData.name} (${leadData.company})`);
    console.log(`Expected Intent: ${leadData.scenario}`);
    console.log(`Reply: "${leadData.reply}"\n`);

    // Classify the reply (this will auto-generate follow-up if conditions met)
    const result = await controller.classifyReply(leadData.id, leadData.reply);

    console.log('📊 Classification Results:');
    console.log(`   ├─ Intent: ${result.classification.intent}`);
    console.log(`   ├─ Sentiment: ${result.classification.sentiment}`);
    console.log(`   ├─ Confidence: ${(result.classification.confidence * 100).toFixed(1)}%`);
    console.log(`   ├─ Next State: ${result.classification.next_state}`);
    console.log(`   ├─ State Advanced: ${result.stateAdvanced ? '✓' : '✗'}`);
    console.log(`   └─ Persisted: ${result.persisted ? '✓' : '✗'}`);

    // Show follow-up generation result
    console.log('\n📨 Follow-up Generation:');
    if (result.followupGenerated) {
      console.log(`   ✅ Follow-up AUTO-GENERATED`);
      console.log(`   Message preview:`);
      console.log(`   "${result.followupMessage?.substring(0, 150)}..."\n`);
    } else {
      const intent = result.classification.intent;
      if (intent === 'negative') {
        console.log(`   ❌ SKIPPED - Lead is NEGATIVE (never follow up)`);
      } else if (intent === 'booked') {
        console.log(`   ⏭️  SKIPPED - Lead is BOOKED (already scheduled)`);
      } else {
        console.log(`   ⚠️  Not generated (check configuration)`);
      }
    }

    // Get updated lead to show conversation history
    const updatedLead = await storageService.getLead(leadData.id);
    console.log(`\n💬 Conversation History (${updatedLead!.conversationHistory.length} messages):`);
    updatedLead!.conversationHistory.forEach((msg, idx) => {
      const sender = msg.sender === 'user' ? '👤 You' : '👥 Lead';
      const preview = msg.content.substring(0, 80);
      console.log(`   ${idx + 1}. ${sender}: ${preview}${msg.content.length > 80 ? '...' : ''}`);
    });

    console.log('\n' + '-'.repeat(60));

    // Small delay between leads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ==================== Summary ====================
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const stats = {
    interested: 0,
    neutral: 0,
    negative: 0,
    booked: 0,
    followupsGenerated: 0
  };

  for (const leadData of leads) {
    const lead = await storageService.getLead(leadData.id);
    const intent = lead!.lastClassification?.intent;

    if (intent === 'interested') {
      stats.interested++;
      stats.followupsGenerated++;
    } else if (intent === 'neutral') {
      stats.neutral++;
      stats.followupsGenerated++;
    } else if (intent === 'negative') {
      stats.negative++;
    } else if (intent === 'booked') {
      stats.booked++;
    }
  }

  console.log(`\n📈 Classification Breakdown:`);
  console.log(`   Interested: ${stats.interested} → ✅ Follow-up generated`);
  console.log(`   Neutral: ${stats.neutral} → ✅ Follow-up generated`);
  console.log(`   Negative: ${stats.negative} → ❌ No follow-up (rule: never follow up)`);
  console.log(`   Booked: ${stats.booked} → ⏭️  No follow-up (already scheduled)`);
  console.log(`\n📨 Total Follow-ups Generated: ${stats.followupsGenerated} of ${leads.length}`);

  console.log('\n\n✅ Complete loop demonstration finished!\n');
  console.log('Key Takeaways:');
  console.log('   ✓ Replies are automatically classified');
  console.log('   ✓ Follow-ups generated ONLY for interested/neutral');
  console.log('   ✓ NEVER generate for negative (prevents spam)');
  console.log('   ✓ NEVER generate for booked (already scheduled)');
  console.log('   ✓ Follow-ups added to lead.messages[] (conversationHistory)');
  console.log('   ✓ Complete conversational loop is automated\n');

  // ==================== Manual Follow-up Tool Usage ====================
  console.log('\n' + '='.repeat(60));
  console.log('🔧 BONUS: Manual Follow-up Tool Usage');
  console.log('='.repeat(60));

  console.log('\nYou can also manually generate follow-ups:');

  const interestedLead = leads.find(l => l.scenario === 'interested');
  if (interestedLead) {
    console.log(`\n📧 Generating another follow-up for ${interestedLead.name}...`);

    const manualResult = await followupTool.execute(interestedLead.id);

    if (manualResult.followupGenerated) {
      console.log(`✅ Manual follow-up generated successfully`);
      console.log(`Message: "${manualResult.message?.content.substring(0, 100)}..."`);
    }
  }

  // Show campaign-wide stats
  console.log('\n📊 Campaign-wide Follow-up Eligibility:');
  const eligibleLeads = await followupTool.getLeadsNeedingFollowup(campaignId);
  console.log(`   Leads needing follow-up: ${eligibleLeads.length}`);
  eligibleLeads.forEach(lead => {
    console.log(`   - ${lead.name} (${lead.lastClassification?.intent})`);
  });

  console.log('\n🎉 Demo complete!\n');
}

// Run the demonstration
demonstrateCompleteLoop().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
