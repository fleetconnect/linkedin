# Quick Start Guide

Get up and running with the AI Outreach Agent in 5 minutes.

## Prerequisites

- Node.js >= 18.0.0
- HeyReach API key ([Get one here](https://heyreach.io))
- Anthropic API key ([Get one here](https://console.anthropic.com))

## Step 1: Installation

Dependencies are already installed! ✅

```bash
# If you need to reinstall:
npm install
```

## Step 2: Configure API Keys

Edit the `.env` file and add your API keys:

```bash
# Open .env file
nano .env  # or use your preferred editor

# Add your keys:
HEYREACH_API_KEY=your_heyreach_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Important**: Keep these keys secure and never commit them to version control.

## Step 3: Test the Components

Run the component test to verify everything is working:

```bash
npm run demo:test
```

This will test:
- ✅ Lead Manager (import, validation)
- ✅ Safety Guard (rate limiting, spam detection)
- ⚠️  Personalization Engine (requires Anthropic API key)
- ⚠️  Feedback Loop (requires Anthropic API key)

## Step 4: Run the Demo Workflow

```bash
npm run demo
```

This demonstrates:
1. Importing leads
2. ICP validation
3. Campaign creation
4. AI message generation
5. Safety checks
6. Reply classification

## Step 5: Create Your First Campaign

### Option A: Use the Simple Example

```bash
npm run demo:simple
```

### Option B: Use the Full Workflow

Create a file `my-campaign.ts`:

```typescript
import { AIOutreachAgent } from './src/index.js';

const agent = new AIOutreachAgent();

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
      autoSend: false, // Keep false until you're ready
    },
  },
});

console.log('Campaign created:', campaign.id);
```

Run it:
```bash
tsx my-campaign.ts
```

## Step 6: Import Your Leads

### From CSV

Prepare a CSV file with your leads:

```csv
firstName,lastName,email,linkedInUrl,title,company,companySize,location,industry
John,Doe,john@example.com,https://linkedin.com/in/johndoe,VP of Sales,TechCorp,250,San Francisco CA,Software
```

Then import:

```typescript
const result = await agent.leads.importLeads(
  'csv',
  './data/leads/my-leads.csv'
);
```

### From API/Object Array

```typescript
const result = await agent.leads.importLeads('api', [
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@company.com',
    // ... more fields
  },
]);
```

## Step 7: Run the MCP Server (For Claude Integration)

```bash
npm run mcp:dev
```

This starts the MCP server that allows Claude to interact with your outreach system through 11 powerful tools.

## Common Tasks

### Check System Status

```typescript
const status = await agent.getStatus();
console.log(status);
```

### Generate a Message

```typescript
const message = await agent.personalization.generateMessage({
  leadId: 'lead-123',
  campaignId: 'campaign-456',
});

console.log(message.content);
```

### Check Safety Limits

```typescript
const check = await agent.safety.checkAction('linkedin_message');

if (!check.allowed) {
  console.log('Blocked:', check.reason);
  console.log('Wait:', check.suggestedDelay, 'seconds');
}
```

### Classify a Reply

```typescript
const reply = await agent.feedback.tagReply({
  content: "Sounds interesting! Let's talk.",
  leadId: 'lead-123',
});

console.log('Sentiment:', reply.sentiment);
console.log('Intent:', reply.intent);
```

### Get Campaign Insights

```typescript
const insights = await agent.feedback.getInsights('campaign-123');

insights.forEach(insight => {
  console.log(`${insight.category}: ${insight.insight}`);
});
```

## Safety Settings

By default, `autoSend` is **disabled**. This means:
- Messages are generated but NOT sent automatically
- You can review all messages before sending
- Perfect for testing and getting comfortable

To enable automatic sending:

```bash
# In .env
ENABLE_AUTO_SEND=true
```

⚠️ **Warning**: Only enable auto-send when you're confident in your:
- ICP criteria
- Message quality
- Safety limits
- Campaign settings

## Rate Limits

Default limits (configurable in `.env`):
- LinkedIn Connections: 100/day
- LinkedIn Messages: 150/day
- Emails: 500/day
- Minimum delay between actions: 90-120 seconds

## Troubleshooting

### "Missing API key" Error

Make sure you've added your keys to `.env`:
```bash
HEYREACH_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

### "Daily limit reached"

Limits reset at midnight UTC. Check current usage:
```typescript
const health = agent.safety.getAccountHealth('account-id');
console.log(health.usageToday);
```

### Messages fail spam check

Review the spam detection rules in `src/core/safety/guard.ts` and ensure your messages:
- Don't use excessive caps or punctuation
- Avoid spam trigger words
- Stay within length limits

## Next Steps

1. ✅ Configure your ICP criteria in `config/campaign-example.json`
2. ✅ Import your real leads
3. ✅ Test message generation with a few leads
4. ✅ Review and refine your messaging approach
5. ✅ Start your first campaign with `autoSend=false`
6. ✅ Monitor results and iterate
7. ✅ Enable `autoSend` when ready

## Resources

- [Full Documentation](./README.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Example Configurations](./config/)
- [Example Scripts](./examples/)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review example scripts in `examples/`
3. Check logs in `logs/agent.log`
4. Open an issue on GitHub

---

Happy outreaching! 🚀
