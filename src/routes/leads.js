/**
 * Lead Routes
 */

import express from 'express';
import { normalizeLead } from '../services/leadService.js';
import { validateRawLead } from '../middleware/validation.js';

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

export default router;
