import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class HeyReachClient {
  constructor() {
    this.apiKey = process.env.HEYREACH_API_KEY;
    this.apiUrl = process.env.HEYREACH_API_URL || 'https://api.heyreach.io/v1';

    if (!this.apiKey) {
      throw new Error('HEYREACH_API_KEY is not set in .env file');
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getCampaigns() {
    try {
      const response = await this.client.get('/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error fetching campaigns:', error.message);
      throw error;
    }
  }

  async createCampaign(campaignData) {
    try {
      const response = await this.client.post('/campaigns', campaignData);
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error.message);
      throw error;
    }
  }

  async addProspectsToCampaign(campaignId, prospects) {
    try {
      const response = await this.client.post(`/campaigns/${campaignId}/prospects`, {
        prospects
      });
      return response.data;
    } catch (error) {
      console.error('Error adding prospects:', error.message);
      throw error;
    }
  }

  async getProspects(campaignId) {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}/prospects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prospects:', error.message);
      throw error;
    }
  }

  async startCampaign(campaignId) {
    try {
      const response = await this.client.post(`/campaigns/${campaignId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting campaign:', error.message);
      throw error;
    }
  }
}

export default HeyReachClient;
