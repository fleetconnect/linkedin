import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

class ClaudeClient {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in .env file');
    }

    this.client = new Anthropic({
      apiKey: this.apiKey
    });
  }

  async generateOutreachMessage(prospectData) {
    const prompt = `Generate a personalized LinkedIn connection message for the following prospect:

Name: ${prospectData.name}
Title: ${prospectData.title}
Company: ${prospectData.company}
Industry: ${prospectData.industry || 'Not specified'}

Requirements:
- Keep it under 300 characters (LinkedIn limit)
- Be professional and friendly
- Mention something specific about their role or company
- Include a clear value proposition
- Don't be overly salesy

Generate only the message text, no additional commentary.`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Error generating message with Claude:', error.message);
      throw error;
    }
  }

  async generateFollowUpMessage(prospectData, previousMessage) {
    const prompt = `Generate a follow-up LinkedIn message for this prospect:

Name: ${prospectData.name}
Title: ${prospectData.title}
Company: ${prospectData.company}
Previous message: ${previousMessage}

Requirements:
- Keep it under 300 characters
- Be polite and add value
- Reference the previous message naturally
- Include a soft call to action

Generate only the message text, no additional commentary.`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Error generating follow-up message with Claude:', error.message);
      throw error;
    }
  }

  async analyzeCampaignPerformance(campaignStats) {
    const prompt = `Analyze this LinkedIn outreach campaign performance and provide insights:

Campaign Statistics:
- Total prospects: ${campaignStats.totalProspects}
- Connection requests sent: ${campaignStats.requestsSent}
- Connections accepted: ${campaignStats.connectionsAccepted}
- Response rate: ${campaignStats.responseRate}%
- Meeting bookings: ${campaignStats.meetingsBooked || 0}

Provide:
1. Key insights (2-3 bullet points)
2. Recommendations for improvement (2-3 suggestions)
3. Overall assessment

Keep the response concise and actionable.`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Error analyzing campaign with Claude:', error.message);
      throw error;
    }
  }
}

export default ClaudeClient;
