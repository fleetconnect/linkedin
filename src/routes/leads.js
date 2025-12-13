/**
 * Lead Routes
 */

import express from 'express';
import { normalizeLead } from '../services/leadService.js';
import { scoreLead } from '../services/scoringService.js';
import { generateMessage } from '../services/messageService.js';
import { validateRawLead, validateLead, validateMessageInput } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /normalize-lead
 * Normalize raw lead data into structured format
 */
router.post('/normalize-lead', validateRawLead, (req, res) => {
  try {
    const { raw_lead } = req.body;

    // Normalize the lead data
    const result = normalizeLead(raw_lead);

    // Return JSON response
    res.json(result);
  } catch (error) {
    console.error('Error normalizing lead:', error);
    res.status(500).json({
      error: 'Internal server error during lead normalization'
    });
  }
});

/**
 * POST /score-lead
 * Score and qualify a normalized lead
 */
router.post('/score-lead', validateLead, (req, res) => {
  try {
    const { lead } = req.body;

    // Score the lead
    const result = scoreLead(lead);

    // Return JSON response
    res.json(result);
  } catch (error) {
    console.error('Error scoring lead:', error);
    res.status(500).json({
      error: 'Internal server error during lead scoring'
    });
  }
});

/**
 * POST /generate-message
 * Generate B2B outreach message for a lead
 */
router.post('/generate-message', validateMessageInput, (req, res) => {
  try {
    const { lead, score, context } = req.body;

    // Generate the message
    const result = generateMessage(lead, score, context);

    // Return JSON response
    res.json(result);
  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({
      error: 'Internal server error during message generation'
    });
  }
});

export default router;
