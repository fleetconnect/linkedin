import ClaudeClient from './claude-client.js';
import fs from 'fs';

console.log('🧪 Testing HeyReach + Claude Integration\n');

async function testClaudeIntegration() {
  try {
    console.log('✓ Loading sample prospect data...');
    const sampleProspects = JSON.parse(
      fs.readFileSync('./data/sample-prospects.json', 'utf8')
    );

    const claudeClient = new ClaudeClient();
    console.log('✓ Claude client initialized\n');

    console.log('📝 Generating personalized outreach messages:\n');

    for (const prospect of sampleProspects) {
      console.log(`Prospect: ${prospect.name} - ${prospect.title} at ${prospect.company}`);

      const message = await claudeClient.generateOutreachMessage(prospect);
      console.log(`Message: ${message}\n`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Testing campaign performance analysis:\n');

    const sampleStats = {
      totalProspects: 100,
      requestsSent: 95,
      connectionsAccepted: 42,
      responseRate: 15.5,
      meetingsBooked: 8
    };

    const analysis = await claudeClient.analyzeCampaignPerformance(sampleStats);
    console.log('Campaign Analysis:');
    console.log(analysis);

    console.log('\n\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.message.includes('ANTHROPIC_API_KEY')) {
      console.log('\n💡 Tip: Make sure you have created a .env file with your ANTHROPIC_API_KEY');
      console.log('   Copy .env.example to .env and add your API keys');
    }

    process.exit(1);
  }
}

testClaudeIntegration();
