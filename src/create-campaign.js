import HeyReachClient from './heyreach-client.js';
import ClaudeClient from './claude-client.js';
import fs from 'fs';

console.log('🚀 Creating LinkedIn Outreach Campaign\n');

async function createCampaign() {
  try {
    // Initialize clients
    const heyReachClient = new HeyReachClient();
    const claudeClient = new ClaudeClient();

    console.log('✓ Clients initialized\n');

    // Load sample prospects
    console.log('📋 Loading prospects...');
    const prospects = JSON.parse(
      fs.readFileSync('./data/sample-prospects.json', 'utf8')
    );
    console.log(`✓ Loaded ${prospects.length} prospects\n`);

    // Create campaign
    console.log('📝 Creating campaign in HeyReach...');
    const campaignData = {
      name: process.env.DEFAULT_CAMPAIGN_NAME || 'AI-Powered LinkedIn Outreach',
      description: 'Automated outreach campaign with Claude AI-generated messages',
      maxConnectionsPerDay: parseInt(process.env.MAX_CONNECTIONS_PER_DAY) || 20,
      timezone: 'UTC'
    };

    const campaign = await heyReachClient.createCampaign(campaignData);
    console.log(`✓ Campaign created: ${campaign.name} (ID: ${campaign.id})\n`);

    // Generate personalized messages for each prospect
    console.log('🤖 Generating personalized messages with Claude AI...\n');

    const prospectsWithMessages = [];
    for (const prospect of prospects) {
      console.log(`Processing: ${prospect.name}`);

      const message = await claudeClient.generateOutreachMessage(prospect);
      prospectsWithMessages.push({
        ...prospect,
        message: message
      });

      console.log(`  Message: ${message.substring(0, 100)}...\n`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Add prospects to campaign
    console.log('➕ Adding prospects to campaign...');
    await heyReachClient.addProspectsToCampaign(campaign.id, prospectsWithMessages);
    console.log(`✓ Added ${prospectsWithMessages.length} prospects\n`);

    console.log('✅ Campaign setup complete!\n');
    console.log('Campaign Details:');
    console.log(`  Name: ${campaign.name}`);
    console.log(`  ID: ${campaign.id}`);
    console.log(`  Prospects: ${prospectsWithMessages.length}`);
    console.log(`  Max daily connections: ${campaignData.maxConnectionsPerDay}`);
    console.log('\n💡 To start the campaign, run:');
    console.log(`   await heyReachClient.startCampaign('${campaign.id}')`);

  } catch (error) {
    console.error('❌ Error creating campaign:', error.message);

    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Tip: Make sure you have created a .env file with your API keys');
      console.log('   Copy .env.example to .env and add:');
      console.log('   - HEYREACH_API_KEY');
      console.log('   - ANTHROPIC_API_KEY');
    }

    process.exit(1);
  }
}

createCampaign();
