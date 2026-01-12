import axios, { AxiosInstance } from 'axios';

/**
 * HeyReach Service
 * 
 * Handles interaction with HeyReach API for lead management and campaign automation
 * API Docs: https://api.heyreach.io/docs
 */
export class HeyReachService {
    private apiKey: string;
    private baseUrl: string;
    private client: AxiosInstance;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.HEYREACH_API_KEY || '';
        this.baseUrl = 'https://api.heyreach.io';

        if (!this.apiKey) {
            console.warn('HEYREACH_API_KEY is not set. HeyReach integration will not function.');
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-API-KEY': this.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Create a lead in HeyReach
     * Used to sync local leads to HeyReach before adding to a campaign
     * 
     * @param leadData Lead information including custom fields for personalization
     */
    async createLead(leadData: {
        linkedinProfileUrl: string;
        firstName?: string;
        lastName?: string;
        company?: string;
        email?: string;
        customFields?: Record<string, any>;
    }): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            // Map to HeyReach expected format
            // Note: HeyReach might expect 'linkedinUrl' or 'linkedinProfileUrl'. 
            // Based on user snippet: "linkedinProfileUrl"

            const payload = {
                linkedinProfileUrl: leadData.linkedinProfileUrl,
                firstName: leadData.firstName,
                lastName: leadData.lastName,
                company: leadData.company,
                email: leadData.email,
                customFields: leadData.customFields
            };

            console.log('[HeyReachService] Creating lead:', { ...payload, customFields: '...' });

            const response = await this.client.post('/api/leads', payload);

            return {
                success: true,
                id: response.data.id || response.data.data?.id
            };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('[HeyReachService] Create lead error:', error.response?.data || error.message);
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
            return { success: false, error: 'Unknown error creating HeyReach lead' };
        }
    }

    /**
     * Add a lead to a campaign
     * This triggers the connection request and/or message sequence
     */
    async addLeadToCampaign(campaignId: string, leadId: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`[HeyReachService] Adding lead ${leadId} to campaign ${campaignId}`);

            await this.client.post(`/api/campaigns/${campaignId}/leads`, {
                leadIds: [leadId]
            });

            return { success: true };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('[HeyReachService] Add to campaign error:', error.response?.data || error.message);
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
            return { success: false, error: 'Unknown error adding lead to campaign' };
        }
    }

    /**
     * Get all campaigns
     * Useful for selecting which campaign to add a lead to
     */
    async getCampaigns(): Promise<any[]> {
        try {
            const response = await this.client.get('/api/campaigns');
            // Adjust based on actual API response structure (array or { data: [] })
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        } catch (error) {
            console.error('[HeyReachService] Get campaigns error:', error);
            return [];
        }
    }
}
