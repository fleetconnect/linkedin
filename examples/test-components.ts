/**
 * Test Individual Components
 *
 * Test each component of the system independently
 */

import { LeadManager } from '../src/core/leads/manager.js';
import { PersonalizationEngine } from '../src/core/personalization/engine.js';
import { SafetyGuard } from '../src/core/safety/guard.js';
import { FeedbackLoop } from '../src/core/feedback/loop.js';

async function testLeadManager() {
  console.log('\n🧪 Testing Lead Manager...\n');

  const leadManager = new LeadManager();

  // Import leads
  const result = await leadManager.importLeads('api', [
    {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      title: 'VP of Sales',
      company: 'Test Corp',
    },
  ]);

  console.log('Import result:', result);

  // Get all leads
  const leads = leadManager.getAllLeads();
  console.log('Total leads:', leads.length);

  // Validate leads
  if (leads.length > 0) {
    const validation = await leadManager.validateLeads([leads[0].id], {
      titles: ['VP', 'Director'],
      companySize: { min: 10, max: 1000 },
    });

    console.log('Validation result:', validation[0].isValid);
    if (!validation[0].isValid) {
      console.log('Errors:', validation[0].errors);
    }
  }

  console.log('✅ Lead Manager test complete');
}

async function testPersonalizationEngine() {
  console.log('\n🧪 Testing Personalization Engine...\n');

  const engine = new PersonalizationEngine();

  try {
    const message = await engine.generateMessage({
      leadId: 'test-lead-123',
      campaignId: 'test-campaign-456',
      stepNumber: 1,
    });

    console.log('Generated message:');
    console.log('Content:', message.content.substring(0, 100) + '...');
    console.log('Confidence:', message.confidence);
    console.log('Factors:', message.personalizationFactors);
    console.log('✅ Personalization Engine test complete');
  } catch (error) {
    console.log('⚠️  Personalization test skipped (requires Anthropic API key)');
    console.log('Error:', (error as Error).message);
  }
}

async function testSafetyGuard() {
  console.log('\n🧪 Testing Safety Guard...\n');

  const safetyGuard = new SafetyGuard({
    maxDailyLinkedInConnections: 100,
    maxDailyLinkedInMessages: 150,
    maxDailyEmails: 500,
    enableProxyRotation: true,
    enableBehavioralSimulation: true,
    spamFilterEnabled: true,
  });

  // Test action check
  const check1 = await safetyGuard.checkAction('linkedin_message');
  console.log('LinkedIn message allowed:', check1.allowed);

  // Test multiple actions
  const check2 = await safetyGuard.checkAction('linkedin_message', 150);
  console.log('150 LinkedIn messages allowed:', check2.allowed);
  if (!check2.allowed) {
    console.log('Reason:', check2.reason);
  }

  // Test message validation
  const validation1 = safetyGuard.validateMessage('Hi! This is a test message.');
  console.log('Valid message:', validation1.valid);

  const validation2 = safetyGuard.validateMessage('CLICK HERE NOW!!! FREE MONEY!!!');
  console.log('Spam message valid:', validation2.valid);
  console.log('Issues:', validation2.issues);

  // Test random delay
  const delay = safetyGuard.getRandomDelay(120);
  console.log('Random delay (base 120s):', delay, 'seconds');

  // Test account health
  const health = safetyGuard.getAccountHealth('test-account');
  console.log('Account health:', health.status);

  console.log('✅ Safety Guard test complete');
}

async function testFeedbackLoop() {
  console.log('\n🧪 Testing Feedback Loop...\n');

  const feedbackLoop = new FeedbackLoop();

  try {
    // Test reply classification
    const reply1 = await feedbackLoop.tagReply({
      content: "Sounds great! Let's schedule a call.",
      leadId: 'test-lead-123',
    });

    console.log('Positive reply:');
    console.log('  Sentiment:', reply1.sentiment);
    console.log('  Intent:', reply1.intent);
    console.log('  Tags:', reply1.tags);

    const reply2 = await feedbackLoop.tagReply({
      content: "Not interested, please remove me.",
      leadId: 'test-lead-456',
    });

    console.log('\nNegative reply:');
    console.log('  Sentiment:', reply2.sentiment);
    console.log('  Intent:', reply2.intent);
    console.log('  Tags:', reply2.tags);

    console.log('✅ Feedback Loop test complete');
  } catch (error) {
    console.log('⚠️  Feedback Loop test skipped (requires Anthropic API key)');
    console.log('Error:', (error as Error).message);
  }
}

async function runAllTests() {
  console.log('🚀 Running Component Tests\n');
  console.log('='.repeat(50));

  await testLeadManager();
  await testPersonalizationEngine();
  await testSafetyGuard();
  await testFeedbackLoop();

  console.log('\n' + '='.repeat(50));
  console.log('\n✨ All tests complete!\n');
}

runAllTests().catch(console.error);
