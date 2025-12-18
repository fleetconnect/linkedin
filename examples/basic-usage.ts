import { v4 as uuidv4 } from 'uuid';
import { LLMService } from '../src/services/LLMService';
import { StorageService } from '../src/services/StorageService';
import { ClassificationController } from '../src/controllers/ClassificationController';
import { LeadState } from '../src/types';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Example usage of the Intent Classification System
 */
async function demonstrateClassification() {
  console.log('🎯 LinkedIn Intent Classifier - Example Usage\n');

  // Initialize services
  const storageService = new StorageService('./data');
  await storageService.initialize();

  const llmService = new LLMService();
  const controller = new ClassificationController(llmService, storageService);

  // Create a test lead
  const leadId = uuidv4();
  await storageService.createLead({
    id: leadId,
    name: 'John Doe',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    email: 'john@example.com'
  });

  console.log(`✓ Created lead: ${leadId}\n`);

  // Example messages to classify
  const testMessages = [
    {
      description: 'Interested response',
      content: "Thanks for reaching out! I'd love to learn more about your product. Can we schedule a call next week?"
    },
    {
      description: 'Booked meeting',
      content: "Yes, let's do Tuesday at 2pm. I'll send you a calendar invite."
    },
    {
      description: 'Neutral response',
      content: "Thanks for the message. I'll keep this in mind."
    },
    {
      description: 'Negative response',
      content: "Not interested, please remove me from your list."
    }
  ];

  // Process each message
  for (const { description, content } of testMessages) {
    console.log(`\n📧 Processing: ${description}`);
    console.log(`   Message: "${content}"\n`);

    try {
      const result = await controller.classifyReply(leadId, content);

      console.log('   Results:');
      console.log(`   ├─ Intent: ${result.classification.intent}`);
      console.log(`   ├─ Sentiment: ${result.classification.sentiment}`);
      console.log(`   ├─ Confidence: ${(result.classification.confidence * 100).toFixed(1)}%`);
      console.log(`   ├─ Next State: ${result.classification.next_state}`);
      console.log(`   ├─ Meets Threshold: ${result.meetsThreshold ? '✓' : '✗'}`);
      console.log(`   ├─ State Advanced: ${result.stateAdvanced ? '✓' : '✗'}`);
      console.log(`   └─ Persisted: ${result.persisted ? '✓' : '✗'}`);

      if (result.reasoning) {
        console.log(`\n   💡 Reasoning: ${result.reasoning}`);
      }

    } catch (error) {
      console.error(`   ✗ Error: ${error}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Get final statistics
  console.log('\n\n📊 Final Lead Statistics:');
  const stats = await controller.getLeadStats(leadId);
  console.log(`   Total Classifications: ${stats.totalClassifications}`);
  console.log(`   Current State: ${stats.currentState}`);
  console.log(`   Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
  console.log('\n   Intent Breakdown:');
  Object.entries(stats.intentBreakdown).forEach(([intent, count]) => {
    console.log(`   ├─ ${intent}: ${count}`);
  });

  console.log('\n✅ Example completed successfully!\n');
}

// Run the example
demonstrateClassification().catch(error => {
  console.error('Example failed:', error);
  process.exit(1);
});
