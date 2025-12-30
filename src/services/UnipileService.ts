import axios, { AxiosInstance } from 'axios';

/**
 * Unipile Service
 * 
 * Handles LinkedIn message sending via Unipile API
 * Documentation: https://docs.unipile.com
 */
export class UnipileService {
    private apiKey: string;
    private baseUrl: string;
    private client: AxiosInstance;

    constructor(apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey || process.env.UNIPILE_API_KEY || '';
        this.baseUrl = baseUrl || process.env.UNIPILE_BASE_URL || 'https://api23.unipile.com:15387';

        if (!this.apiKey) {
            throw new Error('Unipile API key is required. Set UNIPILE_API_KEY in environment variables.');
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-API-KEY': this.apiKey,
                'accept': 'application/json',
                'content-type': 'application/json'
            }
        });
    }

    /**
     * Get all connected LinkedIn accounts
     */
    async getAccounts(): Promise<any[]> {
        try {
            const response = await this.client.get('/api/v1/accounts');
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get Unipile accounts: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Get a specific account by ID
     */
    async getAccount(accountId: string): Promise<any> {
        try {
            const response = await this.client.get(`/api/v1/accounts/${accountId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get Unipile account: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Send a LinkedIn message
     * 
     * @param accountId - The Unipile account ID to send from
     * @param recipientLinkedInUrl - LinkedIn profile URL of the recipient
     * @param message - Message content to send
     * @returns Response from Unipile API
     */
    async sendMessage(
        accountId: string,
        recipientLinkedInUrlOrOptions: string | { recipientLinkedInUrl?: string; chatId?: string },
        message: string
    ): Promise<{
        success: boolean;
        chatId?: string;
        messageId?: string;
        error?: string;
    }> {
        try {
            console.log('[UnipileService.sendMessage] start', {
                accountId,
                recipientType: typeof recipientLinkedInUrlOrOptions,
                hasMessage: Boolean(message),
                messageLength: typeof message === 'string' ? message.length : undefined
            });

            const options =
                typeof recipientLinkedInUrlOrOptions === 'string'
                    ? { recipientLinkedInUrl: recipientLinkedInUrlOrOptions }
                    : recipientLinkedInUrlOrOptions;

            console.log('[UnipileService.sendMessage] normalized options', {
                hasRecipientLinkedInUrl: Boolean(options.recipientLinkedInUrl),
                recipientLinkedInUrl: options.recipientLinkedInUrl,
                hasChatId: Boolean(options.chatId),
                chatId: options.chatId
            });

            let chatId = options.chatId;

            if (!chatId) {
                if (!options.recipientLinkedInUrl) {
                    console.error('[UnipileService.sendMessage] missing recipient', {
                        accountId,
                        options
                    });
                    throw new Error('Either chatId or recipientLinkedInUrl is required');
                }

                console.log('[UnipileService.sendMessage] creating/getting chat', {
                    endpoint: `${this.baseUrl}/api/v1/chats`,
                    accountId,
                    recipientLinkedInUrl: options.recipientLinkedInUrl
                });

                const chatResponse = await this.client.post('/api/v1/chats', {
                    account_id: accountId,
                    attendees: [
                        {
                            linkedin_url: options.recipientLinkedInUrl
                        }
                    ]
                });

                console.log('[UnipileService.sendMessage] chat response received', {
                    status: chatResponse.status,
                    data: chatResponse.data
                });

                chatId =
                    chatResponse.data?.id ||
                    chatResponse.data?.chat_id ||
                    chatResponse.data?.chatId ||
                    chatResponse.data?.data?.id ||
                    chatResponse.data?.data?.chat_id;

                console.log('[UnipileService.sendMessage] extracted chatId', { chatId });
            }

            if (!chatId) {
                console.error('[UnipileService.sendMessage] chatId missing after chat resolution', {
                    accountId,
                    options
                });
                throw new Error('Failed to create or retrieve chat');
            }

            console.log('[UnipileService.sendMessage] sending message', {
                endpoint: `${this.baseUrl}/api/v1/chats/${chatId}/messages`,
                accountId,
                chatId,
                messagePreview: typeof message === 'string' ? message.slice(0, 80) : undefined
            });

            // Now send the message to the chat
            const messageResponse = await this.client.post(
                `/api/v1/chats/${chatId}/messages`,
                {
                    account_id: accountId,
                    text: message
                }
            );

            console.log('[UnipileService.sendMessage] message response received', {
                status: messageResponse.status,
                data: messageResponse.data
            });

            const messageId =
                messageResponse.data?.id ||
                messageResponse.data?.message_id ||
                messageResponse.data?.messageId ||
                messageResponse.data?.data?.id ||
                messageResponse.data?.data?.message_id;

            console.log('[UnipileService.sendMessage] extracted messageId', { messageId });

            return {
                success: true,
                chatId,
                messageId
            };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || error.message;
                console.error('[UnipileService.sendMessage] axios error', {
                    message: errorMessage,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    responseData: error.response?.data,
                    method: error.config?.method,
                    url: error.config?.url,
                    baseURL: error.config?.baseURL
                });
                return {
                    success: false,
                    error: errorMessage
                };
            }

            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('[UnipileService.sendMessage] non-axios error', errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Get chat messages
     */
    async getChatMessages(chatId: string, limit: number = 50): Promise<any[]> {
        try {
            const response = await this.client.get(`/api/v1/chats/${chatId}/messages`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get chat messages: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Get all chats for an account
     */
    async getChats(accountId: string): Promise<any[]> {
        try {
            const response = await this.client.get('/api/v1/chats', {
                params: { account_id: accountId }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get chats: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Search for a LinkedIn user to get their profile info
     */
    async searchLinkedInUser(accountId: string, query: string): Promise<any> {
        try {
            const response = await this.client.get('/api/v1/users/search', {
                params: {
                    account_id: accountId,
                    q: query
                }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to search LinkedIn user: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
}

export default UnipileService;
