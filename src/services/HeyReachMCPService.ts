import axios, { AxiosInstance } from 'axios';

/**
 * HeyReach MCP (Model Context Protocol) Service
 * 
 * Connects to HeyReach's MCP server for AI-powered lead management
 * MCP provides a standardized interface for AI tools to interact with external services
 * 
 * @see https://mcp.heyreach.io
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}

export interface MCPToolCall {
    name: string;
    arguments: Record<string, any>;
}

export interface MCPToolResult {
    content: Array<{
        type: string;
        text?: string;
        data?: any;
    }>;
    isError?: boolean;
}

export interface MCPServerInfo {
    status: string;
    server: string;
    mode: string;
    time: string;
    protocolVersion?: string;
    capabilities?: Record<string, any>;
}

export class HeyReachMCPService {
    private mcpUrl: string;
    private client: AxiosInstance;
    private tools: MCPTool[] = [];
    private initialized: boolean = false;

    constructor(mcpUrl?: string) {
        this.mcpUrl = mcpUrl || process.env.HEYREACH_MCP_URL || '';

        if (!this.mcpUrl) {
            console.warn('HEYREACH_MCP_URL is not set. HeyReach MCP integration will not function.');
        }

        this.client = axios.create({
            baseURL: this.mcpUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 second timeout for MCP calls
        });
    }

    /**
     * Get server info/status
     */
    async getServerInfo(): Promise<MCPServerInfo> {
        try {
            const response = await this.client.get('');
            return response.data;
        } catch (error) {
            console.error('[HeyReachMCPService] Server info error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Initialize connection and discover available tools
     */
    async initialize(): Promise<MCPTool[]> {
        try {
            console.log('[HeyReachMCPService] Initializing MCP connection...');
            
            // First check server status
            const serverInfo = await this.getServerInfo();
            console.log('[HeyReachMCPService] Server info:', serverInfo);

            // List available tools using MCP protocol
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/list',
                params: {}
            });

            if (response.data.result?.tools) {
                this.tools = response.data.result.tools;
            } else if (response.data.tools) {
                this.tools = response.data.tools;
            } else if (Array.isArray(response.data)) {
                this.tools = response.data;
            }

            this.initialized = true;
            console.log(`[HeyReachMCPService] Discovered ${this.tools.length} tools`);
            return this.tools;

        } catch (error) {
            console.error('[HeyReachMCPService] Initialize error:', error);
            // Return empty tools array if initialization fails
            this.tools = [];
            this.initialized = true;
            return this.tools;
        }
    }

    /**
     * Get list of available MCP tools
     */
    async listTools(): Promise<MCPTool[]> {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.tools;
    }

    /**
     * Call an MCP tool
     */
    async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
        try {
            console.log(`[HeyReachMCPService] Calling tool: ${toolName}`, args);

            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                }
            });

            if (response.data.error) {
                return {
                    content: [{
                        type: 'text',
                        text: response.data.error.message || 'Tool call failed'
                    }],
                    isError: true
                };
            }

            return response.data.result || response.data;

        } catch (error) {
            console.error(`[HeyReachMCPService] Tool call error (${toolName}):`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Execute a raw MCP request (for advanced usage)
     */
    async rawRequest(method: string, params: Record<string, any> = {}): Promise<any> {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params
            });

            if (response.data.error) {
                throw new Error(response.data.error.message || 'MCP request failed');
            }

            return response.data.result || response.data;

        } catch (error) {
            console.error(`[HeyReachMCPService] Raw request error (${method}):`, error);
            throw this.handleError(error);
        }
    }

    /**
     * List available resources (if MCP server supports resources)
     */
    async listResources(): Promise<any[]> {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'resources/list',
                params: {}
            });

            return response.data.result?.resources || [];

        } catch (error) {
            console.error('[HeyReachMCPService] List resources error:', error);
            return [];
        }
    }

    /**
     * Read a resource by URI (if MCP server supports resources)
     */
    async readResource(uri: string): Promise<any> {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'resources/read',
                params: { uri }
            });

            return response.data.result || response.data;

        } catch (error) {
            console.error(`[HeyReachMCPService] Read resource error (${uri}):`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Check if the MCP service is configured and working
     */
    async healthCheck(): Promise<{ healthy: boolean; message: string; serverInfo?: MCPServerInfo }> {
        if (!this.mcpUrl) {
            return { 
                healthy: false, 
                message: 'HEYREACH_MCP_URL not configured' 
            };
        }

        try {
            const serverInfo = await this.getServerInfo();
            return { 
                healthy: serverInfo.status === 'ok', 
                message: serverInfo.status === 'ok' ? 'Connected to HeyReach MCP' : 'Server returned non-ok status',
                serverInfo 
            };
        } catch (error) {
            return { 
                healthy: false, 
                message: error instanceof Error ? error.message : 'Failed to connect to MCP server' 
            };
        }
    }

    private handleError(error: any): Error {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message 
                || error.response?.data?.error 
                || error.message;
            return new Error(`HeyReach MCP Error: ${message}`);
        }
        return error instanceof Error ? error : new Error('Unknown MCP error');
    }
}

