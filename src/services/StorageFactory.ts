/**
 * Storage Factory
 *
 * Creates storage service based on configuration.
 * Supports both file-based (JSON) and PostgreSQL storage.
 *
 * Usage:
 *   const storage = await createStorageService();
 *
 * Configuration (via .env):
 *   STORAGE_TYPE=file   # Use file-based storage (default)
 *   STORAGE_TYPE=postgres  # Use PostgreSQL
 */

import { StorageService } from './StorageService';
import { DatabaseService } from '../db/DatabaseService';
import { testConnection } from '../db/connection';

export type StorageType = 'file' | 'postgres';

export interface IStorageService {
  initialize(): Promise<void>;
  getLeads(): Promise<any[]>;
  getLead(leadId: string): Promise<any | null>;
  saveLead(lead: any, options?: any): Promise<any>;
  updateLeadState(leadId: string, newState: string, options?: any): Promise<any | null>;
  addMessage(leadId: string, message: any, options?: any): Promise<any | null>;
  saveClassification(leadId: string, messageId: string, classification: any): Promise<void>;
  getLeadClassifications(leadId: string): Promise<any[]>;
  createLead(data: any): Promise<any>;
  saveResearchSnapshot(leadId: string, snapshot: any): Promise<any | null>;
  getResearchSnapshot(leadId: string): Promise<any | null>;
  getCampaigns(): Promise<any[]>;
  getCampaign(campaignId: string): Promise<any | null>;
  saveCampaign(campaign: any): Promise<any>;
  createCampaign(data: any): Promise<any>;
  getLeadsByCampaign(campaignId: string): Promise<any[]>;
}

/**
 * Get storage type from environment
 */
function getStorageType(): StorageType {
  const storageType = process.env.STORAGE_TYPE?.toLowerCase();

  if (storageType === 'postgres' || storageType === 'postgresql' || storageType === 'database') {
    return 'postgres';
  }

  return 'file';  // Default to file-based
}

/**
 * Create storage service based on configuration
 */
export async function createStorageService(): Promise<IStorageService> {
  const storageType = getStorageType();

  console.log(`📦 Initializing ${storageType} storage...`);

  if (storageType === 'postgres') {
    // Test PostgreSQL connection first
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ PostgreSQL connection failed. Falling back to file-based storage.');
      console.error('   Check your database configuration in .env (DB_HOST, DB_USER, DB_PASSWORD, etc.)');

      // Fallback to file-based storage
      const fileStorage = new StorageService();
      await fileStorage.initialize();
      return fileStorage;
    }

    // Use PostgreSQL
    const dbStorage = new DatabaseService();
    await dbStorage.initialize();
    console.log('✅ PostgreSQL storage initialized');
    return dbStorage;

  } else {
    // Use file-based storage
    const fileStorage = new StorageService();
    await fileStorage.initialize();
    console.log('✅ File-based storage initialized');
    return fileStorage;
  }
}

/**
 * Export for backward compatibility
 */
export { StorageService, DatabaseService };
