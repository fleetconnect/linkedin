# HeyReach + Claude AI Integration

Automate LinkedIn outreach with AI-powered personalization using HeyReach and Claude AI.

## Features

- 🤖 AI-generated personalized LinkedIn messages using Claude
- 📊 Campaign management through HeyReach API
- 🎯 Automated prospect targeting
- 📈 Performance analytics and insights
- ✨ Easy-to-use command-line interface

## Prerequisites

- Node.js 18+ installed
- HeyReach account with API access
- Anthropic API key for Claude AI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
HEYREACH_API_KEY=your_heyreach_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Where to get your API keys:**
- **HeyReach API Key**: Log into your HeyReach dashboard → Settings → API Keys
- **Anthropic API Key**: Visit https://console.anthropic.com/ → Get API Key

### 3. Test with Sample Data

Run the test script to verify everything is working:

```bash
npm test
```

This will:
- Generate personalized messages for sample prospects
- Analyze campaign performance metrics
- Verify API connectivity

### 4. Create Your First Campaign

```bash
npm run create-campaign
```

This will:
- Create a new campaign in HeyReach
- Generate personalized messages for each prospect using Claude AI
- Add prospects to the campaign
- Prepare the campaign for launch

### 5. View Campaigns

```bash
npm start
```

## Project Structure

```
linkedin/
├── src/
│   ├── index.js              # Main entry point
│   ├── heyreach-client.js    # HeyReach API client
│   ├── claude-client.js      # Claude AI client
│   ├── test.js               # Test script
│   └── create-campaign.js    # Campaign creation script
├── data/
│   └── sample-prospects.json # Sample prospect data
├── .env.example              # Environment variables template
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## Usage

### Generate Personalized Messages

```javascript
import ClaudeClient from './src/claude-client.js';

const claude = new ClaudeClient();
const message = await claude.generateOutreachMessage({
  name: "John Doe",
  title: "VP of Engineering",
  company: "Tech Corp",
  industry: "SaaS"
});
```

### Create a Campaign

```javascript
import HeyReachClient from './src/heyreach-client.js';

const heyreach = new HeyReachClient();
const campaign = await heyreach.createCampaign({
  name: "Q4 Outreach Campaign",
  description: "AI-powered outreach for Q4",
  maxConnectionsPerDay: 20
});
```

### Add Prospects

```javascript
await heyreach.addProspectsToCampaign(campaign.id, [
  {
    name: "Jane Smith",
    title: "CTO",
    company: "Innovation Labs",
    linkedin_url: "https://linkedin.com/in/janesmith",
    message: "Personalized message here..."
  }
]);
```

## Configuration

Edit `.env` to customize settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `HEYREACH_API_KEY` | Your HeyReach API key | Required |
| `HEYREACH_API_URL` | HeyReach API endpoint | https://api.heyreach.io/v1 |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `DEFAULT_CAMPAIGN_NAME` | Default campaign name | LinkedIn Outreach Campaign |
| `MAX_CONNECTIONS_PER_DAY` | Daily connection limit | 20 |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | View existing campaigns |
| `npm test` | Test integration with sample data |
| `npm run create-campaign` | Create a new campaign |

## API Clients

### ClaudeClient

Methods:
- `generateOutreachMessage(prospectData)` - Generate personalized connection message
- `generateFollowUpMessage(prospectData, previousMessage)` - Generate follow-up message
- `analyzeCampaignPerformance(campaignStats)` - Analyze campaign metrics

### HeyReachClient

Methods:
- `getCampaigns()` - Fetch all campaigns
- `createCampaign(campaignData)` - Create new campaign
- `addProspectsToCampaign(campaignId, prospects)` - Add prospects to campaign
- `getProspects(campaignId)` - Get campaign prospects
- `startCampaign(campaignId)` - Start campaign

## Best Practices

1. **Personalization**: Always customize messages based on prospect data
2. **Rate Limits**: Stay within LinkedIn's connection request limits (20-30/day)
3. **A/B Testing**: Test different message variations
4. **Follow-ups**: Use Claude to generate natural follow-up sequences
5. **Compliance**: Follow LinkedIn's terms of service and data privacy regulations

## Troubleshooting

### API Key Errors

If you see errors about missing API keys:
1. Ensure `.env` file exists in the project root
2. Verify keys are correctly copied (no extra spaces)
3. Check that `.env` is not in `.gitignore` (it should be for security)

### Connection Errors

If you can't connect to HeyReach or Claude:
1. Check your internet connection
2. Verify API keys are active and valid
3. Check API endpoint URLs in `.env`

### Rate Limiting

If you hit rate limits:
1. Reduce `MAX_CONNECTIONS_PER_DAY` in `.env`
2. Add delays between API calls
3. Contact HeyReach support to increase limits

## Security

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use environment-specific API keys for development/production
- Review HeyReach and Anthropic security best practices

## Support

- HeyReach Documentation: https://docs.heyreach.io
- Anthropic Documentation: https://docs.anthropic.com
- Claude API Reference: https://docs.anthropic.com/claude/reference

## License

MIT
