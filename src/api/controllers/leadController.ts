import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { normalize } from '../../tools/normalize';
import { score } from '../../tools/score';
import { generateMessage } from '../../tools/generateMessage';
import { classifyReply } from '../../tools/classifyReply';

/**
 * Thin orchestration layer for leads
 * Each method follows the pattern:
 * 1. Load Lead + Campaign
 * 2. Call stateless tool
 * 3. Persist output to Lead
 * 4. Advance state
 * 5. Return updated lead
 */

// POST /leads - Create a new lead
export async function createLead(req: Request, res: Response) {
  try {
    const { campaign_id, raw_input } = req.body;

    if (!campaign_id || !raw_input) {
      return res.status(400).json({
        error: 'campaign_id and raw_input are required',
      });
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { campaign_id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Create lead with NEW state
    const lead = await prisma.lead.create({
      data: {
        campaign_id,
        state: 'NEW',
        raw_input,
      },
      include: {
        campaign: true,
      },
    });

    return res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /leads/:id/normalize - Normalize lead data
export async function normalizeLead(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 1. Load Lead + Campaign
    const lead = await prisma.lead.findUnique({
      where: { lead_id: id },
      include: { campaign: true },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // 2. Call stateless tool
    const normalizedData = normalize(lead.raw_input);

    // 3. Persist output to Lead
    // 4. Advance state
    const updatedLead = await prisma.lead.update({
      where: { lead_id: id },
      data: {
        normalized: normalizedData,
        state: 'NORMALIZED',
      },
      include: {
        campaign: true,
      },
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error('Error normalizing lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /leads/:id/score - Score lead
export async function scoreLead(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 1. Load Lead + Campaign
    const lead = await prisma.lead.findUnique({
      where: { lead_id: id },
      include: { campaign: true },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (!lead.normalized) {
      return res.status(400).json({
        error: 'Lead must be normalized before scoring',
      });
    }

    // 2. Call stateless tool
    const scoreData = score(lead.normalized, lead.campaign.scoring_rules);

    // 3. Persist output to Lead
    // 4. Advance state (QUALIFIED or DISQUALIFIED based on score)
    const newState = scoreData.qualified ? 'QUALIFIED' : 'DISQUALIFIED';

    const updatedLead = await prisma.lead.update({
      where: { lead_id: id },
      data: {
        score: scoreData,
        state: newState,
      },
      include: {
        campaign: true,
      },
    });

    return res.json(updatedLead);
  } catch (error) {
    console.error('Error scoring lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /leads/:id/generate-message - Generate message for lead
export async function generateLeadMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { intent = 'initial_outreach' } = req.body;

    // 1. Load Lead + Campaign
    const lead = await prisma.lead.findUnique({
      where: { lead_id: id },
      include: { campaign: true },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (!lead.normalized) {
      return res.status(400).json({
        error: 'Lead must be normalized before generating messages',
      });
    }

    // 2. Call stateless tool (now async with LLM)
    const messageData = await generateMessage(
      lead.normalized,
      lead.campaign.messaging_rules,
      intent
    );

    if (!messageData) {
      return res.status(500).json({ error: 'Failed to generate message' });
    }

    // 3. Persist output to Lead
    // 4. Advance state to CONTACTED
    const existingMessages = (lead.messages as any[]) || [];
    const updatedMessages = [
      ...existingMessages,
      {
        ...messageData,
        sent_at: new Date().toISOString(),
        status: 'generated', // Will be 'sent' when actually sent
      },
    ];

    const updatedLead = await prisma.lead.update({
      where: { lead_id: id },
      data: {
        messages: updatedMessages,
        last_intent: intent,
        // Only advance to CONTACTED if message is actually sent
        // state: 'CONTACTED',
      },
      include: {
        campaign: true,
      },
    });

    return res.json({
      lead: updatedLead,
      message: messageData,
    });
  } catch (error) {
    console.error('Error generating message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /leads/:id/classify-reply - Classify lead reply
export async function classifyLeadReply(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reply_text } = req.body;

    if (!reply_text) {
      return res.status(400).json({ error: 'reply_text is required' });
    }

    // 1. Load Lead + Campaign
    const lead = await prisma.lead.findUnique({
      where: { lead_id: id },
      include: { campaign: true },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // 2. Call stateless tool
    const classification = classifyReply(reply_text, {
      lead_data: lead.normalized,
      previous_messages: lead.messages,
    });

    // 3. Persist output to Lead
    // 4. Advance state based on classification
    let newState = lead.state;

    // Determine state transition based on intent
    if (classification.next_action === 'book_meeting') {
      newState = 'BOOKED';
    } else if (classification.next_action === 'mark_closed') {
      newState = 'CLOSED';
    } else if (lead.state === 'CONTACTED') {
      newState = 'REPLIED';
    }

    // Add reply to messages
    const existingMessages = (lead.messages as any[]) || [];
    const updatedMessages = [
      ...existingMessages,
      {
        direction: 'inbound',
        text: reply_text,
        classification,
        received_at: new Date().toISOString(),
      },
    ];

    const updatedLead = await prisma.lead.update({
      where: { lead_id: id },
      data: {
        messages: updatedMessages,
        state: newState,
        last_intent: classification.intent,
      },
      include: {
        campaign: true,
      },
    });

    return res.json({
      lead: updatedLead,
      classification,
      suggested_action: classification.next_action,
    });
  } catch (error) {
    console.error('Error classifying reply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /leads/:id - Get lead by ID
export async function getLead(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { lead_id: id },
      include: { campaign: true },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    return res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /leads - List leads with filters
export async function listLeads(req: Request, res: Response) {
  try {
    const { campaign_id, state, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    if (campaign_id) {
      where.campaign_id = campaign_id as string;
    }

    if (state) {
      where.state = state as string;
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { campaign: true },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { created_at: 'desc' },
    });

    const total = await prisma.lead.count({ where });

    return res.json({
      leads,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error listing leads:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
