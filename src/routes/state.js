/**
 * Stateful Lead and Campaign Routes
 * CRUD operations for lead and campaign management
 */

import express from 'express';
import Lead from '../models/Lead.js';
import Campaign from '../models/Campaign.js';

const router = express.Router();

// ==================== LEAD ROUTES ====================

/**
 * POST /leads
 * Create a new lead
 */
router.post('/leads', (req, res) => {
  try {
    const lead = Lead.create(req.body);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /leads/:id
 * Get lead by ID
 */
router.get('/leads/:id', (req, res) => {
  try {
    const lead = Lead.getById(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /leads
 * Get leads by campaign or state
 * Query params: campaign_id, state
 */
router.get('/leads', (req, res) => {
  try {
    const { campaign_id, state } = req.query;

    let leads;

    if (state) {
      leads = Lead.getByState(state, campaign_id);
    } else if (campaign_id) {
      leads = Lead.getByCampaign(campaign_id);
    } else {
      return res.status(400).json({ error: 'Must provide campaign_id or state query parameter' });
    }

    res.json({ leads, count: leads.length });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /leads/:id/state
 * Update lead state
 */
router.patch('/leads/:id/state', (req, res) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ error: 'Missing required field: state' });
    }

    const lead = Lead.updateState(req.params.id, state);
    res.json(lead);
  } catch (error) {
    console.error('Error updating lead state:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /leads/:id
 * Update lead data
 */
router.patch('/leads/:id', (req, res) => {
  try {
    const lead = Lead.update(req.params.id, req.body);
    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /leads/:id
 * Delete lead
 */
router.delete('/leads/:id', (req, res) => {
  try {
    const deleted = Lead.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CAMPAIGN ROUTES ====================

/**
 * POST /campaigns
 * Create a new campaign
 */
router.post('/campaigns', (req, res) => {
  try {
    const campaign = Campaign.create(req.body);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /campaigns/:id
 * Get campaign by ID
 */
router.get('/campaigns/:id', (req, res) => {
  try {
    const campaign = Campaign.getById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /campaigns
 * Get campaigns by client or status
 * Query params: client_id, status
 */
router.get('/campaigns', (req, res) => {
  try {
    const { client_id, status } = req.query;

    let campaigns;

    if (client_id) {
      campaigns = Campaign.getByClient(client_id);
    } else if (status) {
      campaigns = Campaign.getByStatus(status);
    } else {
      return res.status(400).json({ error: 'Must provide client_id or status query parameter' });
    }

    res.json({ campaigns, count: campaigns.length });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /campaigns/:id
 * Update campaign
 */
router.patch('/campaigns/:id', (req, res) => {
  try {
    const campaign = Campaign.update(req.params.id, req.body);
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /campaigns/:id
 * Delete campaign
 */
router.delete('/campaigns/:id', (req, res) => {
  try {
    const deleted = Campaign.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
