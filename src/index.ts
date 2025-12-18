import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Example: Create a new campaign
  const campaign = await prisma.campaign.create({
    data: {
      client_id: 'client_123',
      name: 'Q1 2024 Lead Generation',
      status: 'active',
      icp_config: {
        titles: ['CEO', 'CTO', 'VP of Engineering'],
        industries: ['Technology', 'Software'],
        size: '50-200'
      },
      scoring_rules: {
        thresholds: { min_score: 70 },
        disqualifiers: ['competitor', 'student']
      },
      messaging_rules: {
        tone: 'professional',
        cta_constraints: ['book_demo', 'schedule_call']
      },
      license_tier: 'partner'
    }
  });

  console.log('Campaign created:', campaign);

  // Example: Query campaigns
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'active'
    }
  });

  console.log('Active campaigns:', campaigns);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
