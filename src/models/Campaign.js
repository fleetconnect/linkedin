/**
 * Campaign Model
 * CRUD operations for campaign management
 */

import { getDatabase } from '../db/database.js';

/**
 * Valid campaign statuses
 */
const VALID_STATUSES = ['active', 'paused', 'archived'];

/**
 * Valid license tiers
 */
const VALID_LICENSE_TIERS = ['operator', 'partner', 'enterprise'];

/**
 * Create a new campaign
 * @param {Object} data - Campaign data
 * @returns {Object} Created campaign
 */
export function createCampaign(data) {
  const db = getDatabase();

  // Validate required fields
  if (!data.campaign_id) {
    throw new Error('campaign_id is required');
  }

  if (!data.client_id) {
    throw new Error('client_id is required');
  }

  // Validate status
  const status = data.status || 'active';
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Validate license tier
  const licenseTier = data.license_tier || 'operator';
  if (!VALID_LICENSE_TIERS.includes(licenseTier)) {
    throw new Error(`Invalid license_tier: ${licenseTier}. Must be one of: ${VALID_LICENSE_TIERS.join(', ')}`);
  }

  // Serialize JSON fields
  const icpConfig = data.icp_config ? JSON.stringify(data.icp_config) : null;
  const scoringRules = data.scoring_rules ? JSON.stringify(data.scoring_rules) : null;
  const messagingRules = data.messaging_rules ? JSON.stringify(data.messaging_rules) : null;

  const stmt = db.prepare(`
    INSERT INTO campaigns (
      campaign_id, client_id, name, status,
      icp_config, scoring_rules, messaging_rules, license_tier
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    data.campaign_id,
    data.client_id,
    data.name || null,
    status,
    icpConfig,
    scoringRules,
    messagingRules,
    licenseTier
  );

  // Return the created campaign
  return getCampaignById(data.campaign_id);
}

/**
 * Get campaign by ID
 * @param {string} campaignId - Campaign ID
 * @returns {Object|null} Campaign data or null if not found
 */
export function getCampaignById(campaignId) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM campaigns WHERE campaign_id = ?
  `);

  const row = stmt.get(campaignId);

  if (!row) {
    return null;
  }

  // Parse JSON fields
  return deserializeCampaign(row);
}

/**
 * Get all campaigns for a client
 * @param {string} clientId - Client ID
 * @returns {Array} Array of campaigns
 */
export function getCampaignsByClient(clientId) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM campaigns WHERE client_id = ? ORDER BY created_at DESC
  `);

  const rows = stmt.all(clientId);

  return rows.map(row => deserializeCampaign(row));
}

/**
 * Get campaigns by status
 * @param {string} status - Status to filter by
 * @returns {Array} Array of campaigns
 */
export function getCampaignsByStatus(status) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC
  `);

  const rows = stmt.all(status);

  return rows.map(row => deserializeCampaign(row));
}

/**
 * Update campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated campaign
 */
export function updateCampaign(campaignId, updates) {
  const db = getDatabase();

  // Get current campaign
  const currentCampaign = getCampaignById(campaignId);
  if (!currentCampaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Validate status if being updated
  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    throw new Error(`Invalid status: ${updates.status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Validate license tier if being updated
  if (updates.license_tier && !VALID_LICENSE_TIERS.includes(updates.license_tier)) {
    throw new Error(`Invalid license_tier: ${updates.license_tier}. Must be one of: ${VALID_LICENSE_TIERS.join(', ')}`);
  }

  // Build update statement dynamically
  const allowedFields = ['name', 'status', 'icp_config', 'scoring_rules', 'messaging_rules', 'license_tier'];
  const updateFields = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);

      // Serialize if it's a JSON field
      if (['icp_config', 'scoring_rules', 'messaging_rules'].includes(field)) {
        values.push(JSON.stringify(updates[field]));
      } else {
        values.push(updates[field]);
      }
    }
  }

  if (updateFields.length === 0) {
    return currentCampaign; // No updates
  }

  // Add updated_at
  updateFields.push('updated_at = CURRENT_TIMESTAMP');

  const stmt = db.prepare(`
    UPDATE campaigns
    SET ${updateFields.join(', ')}
    WHERE campaign_id = ?
  `);

  values.push(campaignId);
  stmt.run(...values);

  return getCampaignById(campaignId);
}

/**
 * Delete campaign
 * @param {string} campaignId - Campaign ID
 * @returns {boolean} True if deleted
 */
export function deleteCampaign(campaignId) {
  const db = getDatabase();

  const stmt = db.prepare('DELETE FROM campaigns WHERE campaign_id = ?');
  const result = stmt.run(campaignId);

  return result.changes > 0;
}

/**
 * Deserialize campaign row from database
 * @param {Object} row - Database row
 * @returns {Object} Deserialized campaign
 */
function deserializeCampaign(row) {
  return {
    campaign_id: row.campaign_id,
    client_id: row.client_id,
    name: row.name,
    status: row.status,
    icp_config: row.icp_config ? JSON.parse(row.icp_config) : null,
    scoring_rules: row.scoring_rules ? JSON.parse(row.scoring_rules) : null,
    messaging_rules: row.messaging_rules ? JSON.parse(row.messaging_rules) : null,
    license_tier: row.license_tier,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Export all functions
export default {
  create: createCampaign,
  getById: getCampaignById,
  getByClient: getCampaignsByClient,
  getByStatus: getCampaignsByStatus,
  update: updateCampaign,
  delete: deleteCampaign,
  VALID_STATUSES,
  VALID_LICENSE_TIERS
};
