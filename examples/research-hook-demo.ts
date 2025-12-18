import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Import services
import { StorageService } from '../src/services/StorageService';
import { PerplexityService } from '../src/services/PerplexityService';
import { LLMService } from '../src/services/LLMService';

// Import tools and hooks
import { ResearchCompanyTool } from '../src/tools/researchCompany';
import { PreMessageHook } from '../src/hooks/PreMessageHook';

// Import controllers
import { MessageGenerationService } from '../src/services/MessageGenerationService';
import { MessagingController } from '../src/controllers/MessagingController';

// Import types
import { LeadState } from '../src/types';

dotenv.config();

/**
 * Research Hook Demonstration
 *
 * This example demonstrates the pre-message research hook:
 * 1. Create a campaign with personalization enabled
 * 2. Create a QUALIFIED lead
 * 3. Prepare a message (automatically triggers research)
 * 4. Show the generated message with research insights
 */
async function demonstrateResearchHook() {
  console.log('🎯 LinkedIn Research Hook - Demonstration\n');
  console.log('This demo shows how company research runs automatically');
  console.log('when lead.state === QUALIFIED and personalization === true\n');
  console.log('='.repeat(60));

  // Initialize services
  const storageService = new StorageService('./data');
  await storageService.initialize();

  const perplexityService = new PerplexityService();
  const llmService = new LLMService();

  // Initialize tools
  const researchTool = new ResearchCompanyTool(perplexityService, storageService);

  // Initialize hooks
  const preMessageHook = new PreMessageHook(researchTool, storageService);

  // Initialize message service
  const messageService = new MessageGenerationService(researchTool);

  // Initialize controller
  const messagingController = new MessagingController(
    preMessageHook,
    messageService,
    storageService
  );

  console.log('\n✅ Services initialized\n');

  // ==================== Step 1: Create Campaign ====================
  console.log('📋 Step 1: Creating campaign with personalization enabled');

  const campaignId = uuidv4();
  const campaign = await storageService.createCampaign({
    id: campaignId,
    name: 'Q1 2024 Outreach - Tech Companies',
    messaging_rules: {
      personalization: true,  // ⭐ This enables research
      researchRequired: true,
      maxMessagesPerDay: 50,
      toneOfVoice: 'professional'
    }
  });

  console.log(`✅ Campaign created: ${campaign.name}`);
  console.log(`   - ID: ${campaign.id}`);
  console.log(`   - Personalization: ${campaign.messaging_rules.personalization ? '✓' : '✗'}`);
  console.log(`   - Tone: ${campaign.messaging_rules.toneOfVoice}`);

  // ==================== Step 2: Create QUALIFIED Lead ====================
  console.log('\n📋 Step 2: Creating a QUALIFIED lead');

  const leadId = uuidv4();
  const lead = await storageService.createLead({
    id: leadId,
    name: 'Sarah Chen',
    company: 'Stripe',  // ⭐ Company name for research
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    email: 'sarah.chen@stripe.com',
    campaignId: campaign.id
  });

  // Update lead to QUALIFIED state
  await storageService.updateLeadState(leadId, LeadState.QUALIFIED);

  console.log(`✅ Lead created and qualified: ${lead.name}`);
  console.log(`   - Company: ${lead.company}`);
  console.log(`   - State: QUALIFIED ⭐`);
  console.log(`   - Campaign: ${campaign.name}`);

  // ==================== Step 3: Preview Hook Execution ====================
  console.log('\n📋 Step 3: Preview hook execution');

  const hookPreview = await messagingController.previewHookExecution(leadId);
  console.log(hookPreview);

  // ==================== Step 4: Prepare Message (Triggers Research) ====================
  console.log('\n📋 Step 4: Prepare message (this will trigger research hook)\n');
  console.log('⏳ This may take 10-20 seconds as it performs live company research...\n');

  const result = await messagingController.prepareMessage(leadId, 'initial');

  if (!result.success) {
    console.error(`❌ Failed to prepare message: ${result.error}`);
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));

  console.log(`\n✅ Hooks Executed: ${result.hooksExecuted ? 'Yes' : 'No'}`);
  console.log(`✅ Research Performed: ${result.researchPerformed ? 'Yes' : 'No'}`);

  // ==================== Step 5: Show Research Snapshot ====================
  console.log('\n📋 Step 5: Research Snapshot');

  const updatedLead = await storageService.getLead(leadId);
  if (updatedLead?.research_snapshot) {
    const snapshot = updatedLead.research_snapshot;

    console.log('\n🔍 Company Research Results:');
    console.log(`   Company: ${snapshot.companyName}`);
    console.log(`   Industry: ${snapshot.industry}`);
    console.log(`   Description: ${snapshot.companyDescription?.substring(0, 150)}...`);

    if (snapshot.recentNews && snapshot.recentNews.length > 0) {
      console.log(`\n   Recent News:`);
      snapshot.recentNews.forEach((news, i) => {
        console.log(`   ${i + 1}. ${news}`);
      });
    }

    if (snapshot.challenges && snapshot.challenges.length > 0) {
      console.log(`\n   Identified Challenges:`);
      snapshot.challenges.forEach((challenge, i) => {
        console.log(`   ${i + 1}. ${challenge}`);
      });
    }

    if (snapshot.opportunities && snapshot.opportunities.length > 0) {
      console.log(`\n   Growth Opportunities:`);
      snapshot.opportunities.forEach((opp, i) => {
        console.log(`   ${i + 1}. ${opp}`);
      });
    }
  }

  // ==================== Step 6: Show Generated Message ====================
  console.log('\n📋 Step 6: Generated Personalized Message\n');
  console.log('='.repeat(60));
  console.log(result.message);
  console.log('='.repeat(60));

  // ==================== Step 7: Demonstrate Hook Conditions ====================
  console.log('\n\n📋 Step 7: Demonstrating conditional logic\n');

  console.log('🧪 Test 1: Try with non-QUALIFIED lead (should skip research)');
  const leadId2 = uuidv4();
  await storageService.createLead({
    id: leadId2,
    name: 'John Doe',
    company: 'Example Corp',
    campaignId: campaign.id
  });
  // Leave as NEW state

  const result2 = await messagingController.prepareMessage(leadId2, 'initial');
  console.log(`   Research performed: ${result2.researchPerformed ? 'Yes' : 'No (as expected)'}`);

  console.log('\n🧪 Test 2: Try with personalization disabled (should skip research)');
  const campaignId2 = uuidv4();
  const campaign2 = await storageService.createCampaign({
    id: campaignId2,
    name: 'Generic Campaign',
    messaging_rules: {
      personalization: false  // ⭐ Disabled
    }
  });

  const leadId3 = uuidv4();
  await storageService.createLead({
    id: leadId3,
    name: 'Jane Smith',
    company: 'Another Corp',
    campaignId: campaign2.id
  });
  await storageService.updateLeadState(leadId3, LeadState.QUALIFIED);

  const result3 = await messagingController.prepareMessage(leadId3, 'initial');
  console.log(`   Research performed: ${result3.researchPerformed ? 'Yes' : 'No (as expected)'}`);

  console.log('\n\n✅ Research hook demonstration completed!\n');
  console.log('Key Takeaways:');
  console.log('   ✓ Research runs automatically when conditions are met');
  console.log('   ✓ lead.state === QUALIFIED is required');
  console.log('   ✓ campaign.messaging_rules.personalization === true is required');
  console.log('   ✓ Research is persisted to lead.research_snapshot');
  console.log('   ✓ Generated messages use research for personalization');
}

// Run the demonstration
demonstrateResearchHook().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
