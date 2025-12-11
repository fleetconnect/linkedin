# AI Outreach Agent

A comprehensive AI-powered outreach automation system with HeyReach MCP integration, designed to transform cold outreach from rule-based sequences into an intelligent, self-learning system.

## 🌟 Overview

This AI Outreach Agent implements the architecture described in the article "AI outreach agent: From sequences to systems that think". It goes beyond traditional automation by using Claude AI to:

- **Research and validate** leads against ICP criteria
- **Personalize messages** at scale using AI, not templates
- **Orchestrate campaigns** across multiple channels (LinkedIn, Email)
- **Learn from outcomes** and continuously optimize
- **Maintain safety** with intelligent rate limiting and deliverability checks

## 🏗️ Architecture

The system consists of six core components:

1. **MCP Server** - Provides tools for Claude to interact with the outreach system
2. **HeyReach API Client** - Manages all interactions with the HeyReach platform
3. **Lead Manager** - Handles import, validation, and ICP matching
4. **Personalization Engine** - Generates contextual, AI-powered messages
5. **Campaign Orchestrator** - Manages campaign execution and sequencing
6. **Feedback Loop** - Implements continuous learning and optimization
7. **Safety Guard** - Enforces deliverability and rate limiting rules

```
┌─────────────────────────────────────────────────────────────┐
│                        Claude AI                            │
│                  (Decision & Reasoning)                     │
└────────────┬────────────────────────────────────────────────┘
             │ MCP Protocol
┌────────────▼────────────────────────────────────────────────┐
│                      MCP Server                             │
│          (Tools: import, validate, send, tag, etc.)         │
└────┬────────┬─────────┬──────────┬──────────┬──────────────┘
     │        │         │          │          │
     │        │         │          │          │
┌────▼────┐ ┌▼─────┐ ┌─▼──────┐ ┌─▼───────┐ ┌▼──────────┐
│  Lead   │ │Perso-│ │Campaign│ │Feedback │ │  Safety   │
│ Manager │ │naliz-│ │Orches- │ │  Loop   │ │  Guard    │
│         │ │ation │ │trator  │ │         │ │           │
└────┬────┘ └──┬───┘ └───┬────┘ └────┬────┘ └─────┬─────┘
     │         │         │           │            │
     └─────────┴─────────┴───────────┴────────────┘
                         │
                ┌────────▼────────┐
                │  HeyReach API   │
                └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- HeyReach API key
- Anthropic API key (for Claude)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd linkedin

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
# HEYREACH_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
```

### Configuration

1. **Set up your environment variables** in `.env`:
   ```env
   HEYREACH_API_KEY=your_heyreach_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Safety Limits
   MAX_DAILY_LINKEDIN_CONNECTIONS=100
   MAX_DAILY_LINKEDIN_MESSAGES=150
   MAX_DAILY_EMAILS=500

   # Features
   ENABLE_AUTO_SEND=false  # Set to true for automatic sending
   ENABLE_AUTO_FOLLOWUP=true
   ENABLE_AUTO_TAGGING=true
   ```

2. **Customize your campaign** in `config/campaign-example.json`

3. **Prepare your leads** in `data/leads/your-leads.csv`

### Running the MCP Server

The MCP server allows Claude to interact with your outreach system:

```bash
npm run mcp:dev
```

### Using as a Library

```typescript
import { AIOutreachAgent } from './src/index.js';

const agent = new AIOutreachAgent();

// Check system status
const status = await agent.getStatus();
console.log('System Status:', status);

// Run a complete workflow
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
      location: 'San Francisco, CA',
      industry: 'Computer Software',
    },
  ],
  campaignConfig: {
    name: 'Q1 Tech Executive Outreach',
    icpCriteria: {
      titles: ['VP', 'Director', 'Head of'],
      companySize: { min: 50, max: 500 },
    },
    settings: {
      dailyLimit: 50,
      autoSend: false, // Requires manual approval
    },
  },
});

console.log('Campaign created:', campaign.id);
```

## 📋 Core Features

### 1. Lead Management & ICP Validation

Import leads from multiple sources and validate against your ICP:

```typescript
// Import leads
const result = await agent.leads.importLeads('csv', './data/leads/my-leads.csv');

// Validate against ICP
const validationResults = await agent.leads.validateLeads(leadIds, {
  titles: ['VP of Sales', 'Director of Sales'],
  companySize: { min: 50, max: 500 },
  locations: ['United States'],
  excludedCompanies: ['Competitor A'],
});

// Get only valid leads
const validLeads = validationResults.filter(r => r.isValid);
```

### 2. AI-Powered Message Personalization

Generate highly personalized messages using Claude:

```typescript
const message = await agent.personalization.generateMessage({
  leadId: 'lead-123',
  campaignId: 'campaign-456',
  stepNumber: 1,
});

console.log(message.content);
// "Hi Sarah, I noticed DataCompany recently expanded to Boston.
//  As someone focused on scaling sales at growing analytics firms,
//  I thought you'd be interested in..."

console.log(message.personalizationFactors);
// ['company_expansion', 'title_relevance', 'industry_context']
```

### 3. Campaign Orchestration

Create and manage multi-step, multi-channel campaigns:

```typescript
const campaign = await agent.campaigns.createCampaign({
  name: 'Tech Executive Outreach',
  icpCriteria: { /* ... */ },
  sequences: [
    {
      name: 'LinkedIn Sequence',
      channel: 'linkedin_message',
      steps: [
        { stepNumber: 1, channel: 'linkedin_connection', delayHours: 0 },
        { stepNumber: 2, channel: 'linkedin_message', delayHours: 48 },
        { stepNumber: 3, channel: 'linkedin_message', delayHours: 96 },
      ],
    },
  ],
  settings: {
    dailyLimit: 50,
    autoFollowUp: true,
  },
});

await agent.campaigns.startCampaign(campaign.id);
```

### 4. Feedback Loop & Continuous Learning

The system learns from every interaction:

```typescript
// Tag replies automatically
const reply = await agent.feedback.tagReply({
  content: "Sounds interesting! Let's schedule a call.",
  leadId: 'lead-123',
});

console.log(reply.sentiment); // 'positive'
console.log(reply.intent);    // 'book_demo'

// Get insights
const insights = await agent.feedback.getInsights('campaign-456');

console.log(insights);
// [
//   {
//     insight: "Messages with questions perform 23% better",
//     category: "messaging",
//     impact: "high",
//     actionable: true
//   }
// ]
```

### 5. Safety & Deliverability

Built-in protection for your accounts:

```typescript
// Check if action is allowed
const check = await agent.safety.checkAction('linkedin_message');

if (!check.allowed) {
  console.log(`Blocked: ${check.reason}`);
  console.log(`Wait ${check.suggestedDelay} seconds`);
}

// Validate message content
const validation = agent.safety.validateMessage(messageContent);

if (!validation.valid) {
  console.log('Issues:', validation.issues);
  // ['Message contains spam indicators']
}

if (validation.warnings.length > 0) {
  console.log('Warnings:', validation.warnings);
  // ['Message is quite long, consider shortening']
}
```

## 🛠️ MCP Tools Available

When running as an MCP server, Claude has access to these tools:

- `import_leads` - Import and enrich leads from CSV or API
- `validate_leads` - Validate leads against ICP criteria
- `get_campaign_status` - Get current status and metrics
- `generate_message` - Generate personalized message using AI
- `send_message` - Send a message through HeyReach
- `schedule_followup` - Schedule a follow-up message
- `tag_reply` - Classify and tag a reply
- `pause_campaign` - Pause a campaign or specific sequence
- `get_insights` - Get AI-generated insights and recommendations
- `update_lead_status` - Update the status of a lead
- `check_safety_limits` - Check if an action would exceed safety limits

## 📊 Campaign Metrics

Track comprehensive metrics for each campaign:

```typescript
const status = await agent.campaigns.getCampaignStatus('campaign-123');

console.log(status.metrics);
// {
//   totalLeads: 500,
//   contacted: 342,
//   replied: 51,
//   positive: 28,
//   negative: 15,
//   neutral: 8,
//   bounced: 12,
//   replyRate: 14.9,
//   conversionRate: 8.2,
//   averageResponseTimeHours: 36.5
// }
```

## 🔒 Safety Features

### Rate Limiting

- LinkedIn connections: 100/day (configurable)
- LinkedIn messages: 150/day (configurable)
- Emails: 500/day (configurable)
- Minimum 90-120 seconds between actions

### Spam Detection

- Automatic spam indicator detection
- Message content validation
- Subject line checks
- URL and punctuation analysis

### Behavioral Simulation

- Randomized delays between actions
- Human-like timing patterns
- Optimal send time calculation
- Account health monitoring

## 📁 Project Structure

```
linkedin/
├── src/
│   ├── mcp/              # MCP server implementation
│   │   └── server.ts
│   ├── api/              # External API clients
│   │   └── heyreach.ts
│   ├── core/             # Core business logic
│   │   ├── leads/        # Lead management
│   │   ├── personalization/  # Message generation
│   │   ├── campaigns/    # Campaign orchestration
│   │   ├── feedback/     # Learning and optimization
│   │   └── safety/       # Safety and deliverability
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Main entry point
├── config/               # Configuration files
│   └── campaign-example.json
├── data/                 # Data storage
│   ├── leads/
│   ├── campaigns/
│   └── feedback/
├── logs/                 # Application logs
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Development

### Build the project

```bash
npm run build
```

### Run in development mode

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Lint code

```bash
npm run lint
```

## 🤝 Integration with n8n

For workflow automation, integrate with n8n:

1. Set up n8n webhooks to receive HeyReach events
2. Create workflows for:
   - Reply processing
   - CRM synchronization
   - Slack notifications
   - Campaign pause triggers

Example n8n workflow:
```
HeyReach Webhook → Tag Reply (MCP) → Update CRM → Notify Sales Rep
```

## 📈 Performance Tips

1. **Start Conservative**: Begin with `ENABLE_AUTO_SEND=false` to review messages
2. **Monitor Metrics**: Watch reply rates and adjust ICP criteria
3. **A/B Test Messages**: Use `generateVariations()` to test different approaches
4. **Respect Limits**: Don't override safety settings without good reason
5. **Review Insights**: Check `getInsights()` regularly to optimize campaigns

## 🐛 Troubleshooting

### "Failed to connect to HeyReach"
- Check your API key in `.env`
- Verify HeyReach API is accessible
- Check network/firewall settings

### "Daily limit reached"
- Limits reset at midnight UTC
- Adjust limits in `.env` if needed
- Check account health: `agent.safety.getAccountHealth()`

### "Message validation failed"
- Review spam indicators in message content
- Check message length
- Avoid excessive capitalization/punctuation

## 📝 License

MIT

## 🙏 Acknowledgments

Based on the article "AI outreach agent: From sequences to systems that think" and powered by:
- [HeyReach](https://heyreach.io) - LinkedIn automation platform
- [Anthropic Claude](https://anthropic.com) - AI reasoning and personalization
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) - Agent integration

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review example configurations in `config/`
- Open an issue on GitHub

---

**Note**: This is a powerful automation tool. Always follow LinkedIn's terms of service and best practices for cold outreach. Use responsibly.
