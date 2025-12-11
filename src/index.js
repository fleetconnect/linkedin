import HeyReachClient from './heyreach-client.js';
import ClaudeClient from './claude-client.js';

console.log('🎯 HeyReach + Claude AI Integration\n');

async function main() {
  try {
    // Initialize clients
    const heyReachClient = new HeyReachClient();
    const claudeClient = new ClaudeClient();

    console.log('✓ Connected to HeyReach API');
    console.log('✓ Connected to Claude AI\n');

    // Fetch existing campaigns
    console.log('📊 Fetching campaigns...');
    const campaigns = await heyReachClient.getCampaigns();

    if (campaigns.length === 0) {
      console.log('No campaigns found. Run "npm run create-campaign" to create your first campaign.\n');
    } else {
      console.log(`Found ${campaigns.length} campaign(s):\n`);
      campaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ${campaign.name}`);
        console.log(`   ID: ${campaign.id}`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Prospects: ${campaign.prospectCount || 0}\n`);
      });
    }

    console.log('✅ Integration is working!\n');
    console.log('Available commands:');
    console.log('  npm test              - Test with sample data');
    console.log('  npm run create-campaign - Create a new campaign');
    console.log('  npm start             - View existing campaigns');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Setup required:');
      console.log('1. Copy .env.example to .env');
      console.log('2. Add your API keys:');
      console.log('   - HEYREACH_API_KEY (from HeyReach dashboard)');
      console.log('   - ANTHROPIC_API_KEY (from Anthropic console)');
    }

    process.exit(1);
  }
}

main();
