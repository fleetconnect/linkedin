/**
 * Simple Campaign Example
 *
 * A minimal example showing how to create and run a campaign
 */

import { AIOutreachAgent } from '../src/index.js';

async function main() {
  const agent = new AIOutreachAgent();

  // Create a campaign with your leads
  const campaign = await agent.runWorkflow({
    leads: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        linkedInUrl: 'https://linkedin.com/in/johndoe',
        title: 'VP of Sales',
        company: 'TechCorp',
        companySize: 250,
      },
    ],
    campaignConfig: {
      name: 'My First Campaign',
      icpCriteria: {
        titles: ['VP', 'Director', 'Head of'],
        companySize: { min: 50, max: 500 },
      },
      settings: {
        dailyLimit: 50,
        autoSend: false, // Set to true for automatic sending
      },
    },
  });

  console.log('Campaign created:', campaign.id);
  console.log('Status:', campaign.status);
}

main().catch(console.error);
