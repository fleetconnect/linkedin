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

  // Example: Create a new lead
  const lead = await prisma.lead.create({
    data: {
      campaign_id: campaign.campaign_id,
      state: 'NEW',
      raw_input: {
        name: 'John Doe',
        title: 'CTO',
        company: 'Tech Corp',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        email: 'john@techcorp.com'
      }
    }
  });

  console.log('Lead created:', lead);

  // Example: Normalize lead data (tool mutation)
  const normalizedLead = await prisma.lead.update({
    where: { lead_id: lead.lead_id },
    data: {
      state: 'NORMALIZED',
      normalized: {
        full_name: 'John Doe',
        title: 'Chief Technology Officer',
        company: 'Tech Corp',
        industry: 'Technology',
        company_size: '100-500'
      }
    }
  });

  console.log('Lead normalized:', normalizedLead);

  // Example: Score lead (tool mutation)
  const scoredLead = await prisma.lead.update({
    where: { lead_id: lead.lead_id },
    data: {
      state: 'QUALIFIED',
      score: {
        total: 85,
        factors: {
          title_match: 30,
          industry_match: 25,
          company_size_match: 30
        },
        qualified: true
      }
    }
  });

  console.log('Lead scored and qualified:', scoredLead);

  // Example: Track outreach (tool mutation)
  const contactedLead = await prisma.lead.update({
    where: { lead_id: lead.lead_id },
    data: {
      state: 'CONTACTED',
      messages: [
        {
          timestamp: new Date().toISOString(),
          channel: 'linkedin',
          type: 'connection_request',
          content: 'Hi John, I noticed your work in...',
          status: 'sent'
        }
      ],
      last_intent: 'initial_outreach'
    }
  });

  console.log('Lead contacted:', contactedLead);

  // Example: Query leads by state
  const qualifiedLeads = await prisma.lead.findMany({
    where: {
      campaign_id: campaign.campaign_id,
      state: 'QUALIFIED'
    },
    include: {
      campaign: true
    }
  });

  console.log('Qualified leads:', qualifiedLeads);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
