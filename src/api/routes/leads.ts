import { Router } from 'express';
import * as leadController from '../controllers/leadController';

const router = Router();

/**
 * Lead API Routes
 * Thin orchestration layer that wraps stateless tools with state management
 */

// Create a new lead
router.post('/', leadController.createLead);

// Get lead by ID
router.get('/:id', leadController.getLead);

// List leads with filters
router.get('/', leadController.listLeads);

// Orchestration endpoints - each follows the pattern:
// 1. Load Lead + Campaign
// 2. Call stateless tool
// 3. Persist output to Lead
// 4. Advance state

// Normalize lead data
router.post('/:id/normalize', leadController.normalizeLead);

// Score lead
router.post('/:id/score', leadController.scoreLead);

// Generate message for lead
router.post('/:id/generate-message', leadController.generateLeadMessage);

// Classify lead reply
router.post('/:id/classify-reply', leadController.classifyLeadReply);

export default router;
