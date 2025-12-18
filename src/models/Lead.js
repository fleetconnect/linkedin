/**
 * Lead Model
 * CRUD operations for lead management
 */

import { getDatabase } from '../db/database.js';
import { randomUUID } from 'crypto';

/**
 * Valid lead states
 */
const VALID_STATES = ['new', 'normalized', 'scored', 'qualified', 'active', 'paused', 'booked', 'disqualified', 'archived'];

/**
 * Valid state transitions
 * Maps current state to allowed next states
 */
const STATE_TRANSITIONS = {
  'new': ['normalized', 'disqualified', 'archived'],
  'normalized': ['scored', 'disqualified', 'archived'],
  'scored': ['qualified', 'disqualified', 'archived'],
  'qualified': ['active', 'disqualified', 'archived'],
  'active': ['paused', 'booked', 'disqualified', 'archived'],
  'paused': ['active', 'disqualified', 'archived'],
  'booked': ['archived'],
  'disqualified': ['archived'],
  'archived': [] // Terminal state
};

/**
 * Create a new lead
 * @param {Object} data - Lead data
 * @returns {Object} Created lead
 */
export function createLead(data) {
  const db = getDatabase();

  const leadId = data.lead_id || `lead_${randomUUID()}`;
  const state = data.state || 'new';
  const campaignId = data.campaign_id || null;

  // Validate state
  if (!VALID_STATES.includes(state)) {
    throw new Error(`Invalid state: ${state}. Must be one of: ${VALID_STATES.join(', ')}`);
  }

  // Serialize JSON fields
  const rawInput = data.raw_input ? JSON.stringify(data.raw_input) : null;
  const normalized = data.normalized ? JSON.stringify(data.normalized) : null;
  const score = data.score ? JSON.stringify(data.score) : null;
  const messages = data.messages ? JSON.stringify(data.messages) : '[]';
  const conversation = data.conversation ? JSON.stringify(data.conversation) : '[]';
  const outcomes = data.outcomes ? JSON.stringify(data.outcomes) : '{}';
  const memoryRefs = data.memory_refs ? JSON.stringify(data.memory_refs) : '[]';

  const stmt = db.prepare(`
    INSERT INTO leads (
      lead_id, state, campaign_id, raw_input, normalized, score,
      messages, conversation, outcomes, memory_refs
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    leadId, state, campaignId, rawInput, normalized, score,
    messages, conversation, outcomes, memoryRefs
  );

  // Return the created lead
  return getLeadById(leadId);
}

/**
 * Get lead by ID
 * @param {string} leadId - Lead ID
 * @returns {Object|null} Lead data or null if not found
 */
export function getLeadById(leadId) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM leads WHERE lead_id = ?
  `);

  const row = stmt.get(leadId);

  if (!row) {
    return null;
  }

  // Parse JSON fields
  return deserializeLead(row);
}

/**
 * Get all leads for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Array} Array of leads
 */
export function getLeadsByCampaign(campaignId) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM leads WHERE campaign_id = ? ORDER BY created_at DESC
  `);

  const rows = stmt.all(campaignId);

  return rows.map(row => deserializeLead(row));
}

/**
 * Get leads by state
 * @param {string} state - State to filter by
 * @param {string} campaignId - Optional campaign ID filter
 * @returns {Array} Array of leads
 */
export function getLeadsByState(state, campaignId = null) {
  const db = getDatabase();

  let sql = 'SELECT * FROM leads WHERE state = ?';
  const params = [state];

  if (campaignId) {
    sql += ' AND campaign_id = ?';
    params.push(campaignId);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);

  return rows.map(row => deserializeLead(row));
}

/**
 * Update lead state
 * @param {string} leadId - Lead ID
 * @param {string} newState - New state
 * @returns {Object} Updated lead
 */
export function updateLeadState(leadId, newState) {
  const db = getDatabase();

  // Validate state
  if (!VALID_STATES.includes(newState)) {
    throw new Error(`Invalid state: ${newState}. Must be one of: ${VALID_STATES.join(', ')}`);
  }

  // Get current lead
  const currentLead = getLeadById(leadId);
  if (!currentLead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Validate state transition
  const allowedTransitions = STATE_TRANSITIONS[currentLead.state];
  if (!allowedTransitions.includes(newState)) {
    throw new Error(
      `Invalid state transition from ${currentLead.state} to ${newState}. ` +
      `Allowed transitions: ${allowedTransitions.join(', ')}`
    );
  }

  const stmt = db.prepare(`
    UPDATE leads
    SET state = ?, updated_at = CURRENT_TIMESTAMP
    WHERE lead_id = ?
  `);

  stmt.run(newState, leadId);

  return getLeadById(leadId);
}

/**
 * Update lead data
 * @param {string} leadId - Lead ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated lead
 */
export function updateLead(leadId, updates) {
  const db = getDatabase();

  // Get current lead
  const currentLead = getLeadById(leadId);
  if (!currentLead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Build update statement dynamically
  const allowedFields = ['raw_input', 'normalized', 'score', 'messages', 'conversation', 'outcomes', 'memory_refs', 'campaign_id'];
  const updateFields = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);

      // Serialize if it's a JSON field
      if (['raw_input', 'normalized', 'score', 'messages', 'conversation', 'outcomes', 'memory_refs'].includes(field)) {
        values.push(JSON.stringify(updates[field]));
      } else {
        values.push(updates[field]);
      }
    }
  }

  if (updateFields.length === 0) {
    return currentLead; // No updates
  }

  // Add updated_at
  updateFields.push('updated_at = CURRENT_TIMESTAMP');

  const stmt = db.prepare(`
    UPDATE leads
    SET ${updateFields.join(', ')}
    WHERE lead_id = ?
  `);

  values.push(leadId);
  stmt.run(...values);

  return getLeadById(leadId);
}

/**
 * Delete lead
 * @param {string} leadId - Lead ID
 * @returns {boolean} True if deleted
 */
export function deleteLead(leadId) {
  const db = getDatabase();

  const stmt = db.prepare('DELETE FROM leads WHERE lead_id = ?');
  const result = stmt.run(leadId);

  return result.changes > 0;
}

/**
 * Deserialize lead row from database
 * @param {Object} row - Database row
 * @returns {Object} Deserialized lead
 */
function deserializeLead(row) {
  return {
    lead_id: row.lead_id,
    state: row.state,
    campaign_id: row.campaign_id,
    raw_input: row.raw_input ? JSON.parse(row.raw_input) : null,
    normalized: row.normalized ? JSON.parse(row.normalized) : null,
    score: row.score ? JSON.parse(row.score) : null,
    messages: JSON.parse(row.messages),
    conversation: JSON.parse(row.conversation),
    outcomes: JSON.parse(row.outcomes),
    memory_refs: JSON.parse(row.memory_refs),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Export all functions
export default {
  create: createLead,
  getById: getLeadById,
  getByCampaign: getLeadsByCampaign,
  getByState: getLeadsByState,
  updateState: updateLeadState,
  update: updateLead,
  delete: deleteLead,
  VALID_STATES,
  STATE_TRANSITIONS
};
