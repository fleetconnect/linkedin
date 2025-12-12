/**
 * Client Configuration Manager
 * Manages multi-client configurations for agency install model
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger.js';
import type {
  ClientConfig,
  ClientConfigValidationResult,
  ClientICP,
  ClientOffer,
} from '../../types/client-config.js';
import {
  DEFAULT_CONSTRAINTS,
  DEFAULT_PREFERENCES,
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_THRESHOLDS,
} from '../../types/client-config.js';

export class ClientConfigManager {
  private configs: Map<string, ClientConfig> = new Map();
  private configDir: string;

  constructor(configDir: string = './config/clients') {
    this.configDir = configDir;
  }

  /**
   * Load all client configurations from disk
   */
  async loadConfigs(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      const files = await fs.readdir(this.configDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.configDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const config = JSON.parse(content) as ClientConfig;

          this.configs.set(config.client_id, config);
          logger.info('Client config loaded', {
            client_id: config.client_id,
            status: config.status,
          });
        }
      }

      logger.info('All client configs loaded', { count: this.configs.size });
    } catch (error) {
      logger.error('Failed to load client configs', { error });
      throw error;
    }
  }

  /**
   * Get configuration for a specific client
   */
  getConfig(clientId: string): ClientConfig | undefined {
    return this.configs.get(clientId);
  }

  /**
   * Get all active client configurations
   */
  getActiveConfigs(): ClientConfig[] {
    return Array.from(this.configs.values()).filter(
      (config) => config.status === 'active'
    );
  }

  /**
   * Save client configuration
   */
  async saveConfig(config: ClientConfig): Promise<void> {
    try {
      const filePath = path.join(this.configDir, `${config.client_id}.json`);
      await fs.writeFile(filePath, JSON.stringify(config, null, 2));

      this.configs.set(config.client_id, config);

      logger.info('Client config saved', { client_id: config.client_id });
    } catch (error) {
      logger.error('Failed to save client config', {
        client_id: config.client_id,
        error,
      });
      throw error;
    }
  }

  /**
   * Validate client configuration
   */
  validateConfig(input: Partial<ClientConfig>): ClientConfigValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Required fields
    if (!input.client_id) {
      errors.push('client_id is required');
    }
    if (!input.client_name) {
      errors.push('client_name is required');
    }
    if (!input.icp) {
      errors.push('icp is required');
    }
    if (!input.offer) {
      errors.push('offer is required');
    }
    if (!input.heyreach?.api_key) {
      errors.push('heyreach.api_key is required');
    }

    // ICP validation
    if (input.icp) {
      if (
        !input.icp.titles?.length &&
        !input.icp.seniority_levels?.length &&
        !input.icp.departments?.length
      ) {
        warnings.push(
          'ICP persona criteria is empty - may result in poor targeting'
        );
      }

      if (
        !input.icp.industries?.length &&
        !input.icp.company_size &&
        !input.icp.geographies?.length
      ) {
        warnings.push(
          'ICP firmographic criteria is very broad - consider adding filters'
        );
      }
    }

    // Offer validation
    if (input.offer) {
      if (!input.offer.value_proposition || input.offer.value_proposition.length < 10) {
        warnings.push('Offer value proposition is weak or missing');
      }
      if (!input.offer.target_outcome) {
        warnings.push('Offer target outcome is missing');
      }
    }

    // Build normalized config if valid
    let normalized: ClientConfig | undefined;
    if (errors.length === 0) {
      normalized = {
        client_id: input.client_id!,
        client_name: input.client_name!,
        installed_at: input.installed_at || new Date().toISOString(),
        status: input.status || 'active',
        icp: input.icp!,
        offer: input.offer!,
        preferences: { ...DEFAULT_PREFERENCES, ...input.preferences },
        constraints: { ...DEFAULT_CONSTRAINTS, ...input.constraints },
        scoring_weights: {
          ...DEFAULT_SCORING_WEIGHTS,
          ...input.scoring_weights,
        },
        thresholds: { ...DEFAULT_THRESHOLDS, ...input.thresholds },
        heyreach: input.heyreach!,
        metadata: input.metadata,
      };
    }

    return {
      ok: errors.length === 0,
      warnings,
      errors,
      normalized_config: normalized,
    };
  }

  /**
   * Create a new client configuration from onboarding data
   */
  async createFromOnboarding(data: {
    client_id: string;
    client_name: string;
    icp: ClientICP;
    offer: ClientOffer;
    heyreach_api_key: string;
    preferences?: Partial<ClientConfig['preferences']>;
    constraints?: Partial<ClientConfig['constraints']>;
  }): Promise<ClientConfigValidationResult> {
    const config: Partial<ClientConfig> = {
      client_id: data.client_id,
      client_name: data.client_name,
      installed_at: new Date().toISOString(),
      status: 'active',
      icp: data.icp,
      offer: data.offer,
      preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
      constraints: { ...DEFAULT_CONSTRAINTS, ...data.constraints },
      scoring_weights: DEFAULT_SCORING_WEIGHTS,
      thresholds: DEFAULT_THRESHOLDS,
      heyreach: {
        api_key: data.heyreach_api_key,
      },
    };

    const validation = this.validateConfig(config);

    if (validation.ok && validation.normalized_config) {
      await this.saveConfig(validation.normalized_config);
    }

    return validation;
  }

  /**
   * Update client status
   */
  async updateStatus(
    clientId: string,
    status: 'active' | 'paused' | 'archived'
  ): Promise<void> {
    const config = this.getConfig(clientId);
    if (!config) {
      throw new Error(`Client ${clientId} not found`);
    }

    config.status = status;
    await this.saveConfig(config);

    logger.info('Client status updated', { client_id: clientId, status });
  }

  /**
   * List all clients
   */
  listClients(): Array<{
    client_id: string;
    client_name: string;
    status: string;
    installed_at: string;
  }> {
    return Array.from(this.configs.values()).map((config) => ({
      client_id: config.client_id,
      client_name: config.client_name,
      status: config.status,
      installed_at: config.installed_at,
    }));
  }
}
