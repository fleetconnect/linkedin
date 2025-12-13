/**
 * Request Validation Middleware
 */

/**
 * Validate the raw_lead input for the /normalize-lead endpoint
 */
export function validateRawLead(req, res, next) {
  const { raw_lead } = req.body;

  // Check if raw_lead exists
  if (!raw_lead) {
    return res.status(400).json({
      error: 'Missing required field: raw_lead'
    });
  }

  // Check if raw_lead is an object
  if (typeof raw_lead !== 'object' || Array.isArray(raw_lead)) {
    return res.status(400).json({
      error: 'raw_lead must be an object'
    });
  }

  // Optional: validate expected fields (but don't require them)
  const validFields = ['name', 'company', 'title', 'linkedin_url', 'source'];
  const providedFields = Object.keys(raw_lead);

  // Check for unexpected fields (optional validation)
  const unexpectedFields = providedFields.filter(field => !validFields.includes(field));
  if (unexpectedFields.length > 0) {
    // Log warning but don't reject (be lenient)
    console.warn('Unexpected fields in raw_lead:', unexpectedFields);
  }

  // Continue to the next middleware
  next();
}

/**
 * Validate the lead input for the /score-lead endpoint
 */
export function validateLead(req, res, next) {
  const { lead } = req.body;

  // Check if lead exists
  if (!lead) {
    return res.status(400).json({
      error: 'Missing required field: lead'
    });
  }

  // Check if lead is an object
  if (typeof lead !== 'object' || Array.isArray(lead)) {
    return res.status(400).json({
      error: 'lead must be an object'
    });
  }

  // Optional: validate expected fields (but don't require them)
  const validFields = ['full_name', 'first_name', 'company', 'role', 'industry', 'seniority', 'clean_linkedin'];
  const providedFields = Object.keys(lead);

  // Check for unexpected fields (optional validation)
  const unexpectedFields = providedFields.filter(field => !validFields.includes(field));
  if (unexpectedFields.length > 0) {
    // Log warning but don't reject (be lenient)
    console.warn('Unexpected fields in lead:', unexpectedFields);
  }

  // Continue to the next middleware
  next();
}

/**
 * Validate the input for the /generate-message endpoint
 */
export function validateMessageInput(req, res, next) {
  const { lead, score, context } = req.body;

  // Check if lead exists
  if (!lead) {
    return res.status(400).json({
      error: 'Missing required field: lead'
    });
  }

  // Check if lead is an object
  if (typeof lead !== 'object' || Array.isArray(lead)) {
    return res.status(400).json({
      error: 'lead must be an object'
    });
  }

  // Check if context exists
  if (!context) {
    return res.status(400).json({
      error: 'Missing required field: context'
    });
  }

  // Check if context is an object
  if (typeof context !== 'object' || Array.isArray(context)) {
    return res.status(400).json({
      error: 'context must be an object'
    });
  }

  // Validate context.channel if provided
  if (context.channel) {
    const validChannels = ['linkedin', 'email'];
    if (!validChannels.includes(context.channel.toLowerCase())) {
      return res.status(400).json({
        error: 'context.channel must be either "linkedin" or "email"'
      });
    }
  }

  // Validate context.tone if provided
  if (context.tone) {
    const validTones = ['direct', 'neutral'];
    if (!validTones.includes(context.tone.toLowerCase())) {
      return res.status(400).json({
        error: 'context.tone must be either "direct" or "neutral"'
      });
    }
  }

  // Score is optional, but if provided, validate it
  if (score) {
    if (typeof score !== 'object' || Array.isArray(score)) {
      return res.status(400).json({
        error: 'score must be an object'
      });
    }

    // Validate tier if provided
    if (score.tier) {
      const validTiers = ['low', 'medium', 'high'];
      if (!validTiers.includes(score.tier.toLowerCase())) {
        return res.status(400).json({
          error: 'score.tier must be "low", "medium", or "high"'
        });
      }
    }
  }

  // Continue to the next middleware
  next();
}

/**
 * Validate the input for the /classify-reply endpoint
 */
export function validateReplyText(req, res, next) {
  const { reply_text } = req.body;

  // Check if reply_text exists
  if (reply_text === undefined || reply_text === null) {
    return res.status(400).json({
      error: 'Missing required field: reply_text'
    });
  }

  // Check if reply_text is a string
  if (typeof reply_text !== 'string') {
    return res.status(400).json({
      error: 'reply_text must be a string'
    });
  }

  // Continue to the next middleware
  next();
}

/**
 * Validate the input for the /draft-followup endpoint
 */
export function validateFollowupInput(req, res, next) {
  const { lead, intent, reply_text } = req.body;

  // Check if lead exists
  if (!lead) {
    return res.status(400).json({
      error: 'Missing required field: lead'
    });
  }

  // Check if lead is an object
  if (typeof lead !== 'object' || Array.isArray(lead)) {
    return res.status(400).json({
      error: 'lead must be an object'
    });
  }

  // Check if intent exists
  if (!intent) {
    return res.status(400).json({
      error: 'Missing required field: intent'
    });
  }

  // Check if intent is a string
  if (typeof intent !== 'string') {
    return res.status(400).json({
      error: 'intent must be a string'
    });
  }

  // Validate intent value
  const validIntents = ['positive', 'neutral', 'objection', 'negative', 'out_of_office'];
  if (!validIntents.includes(intent.toLowerCase())) {
    return res.status(400).json({
      error: 'intent must be one of: positive, neutral, objection, negative, out_of_office'
    });
  }

  // reply_text is optional, but if provided, must be a string
  if (reply_text !== undefined && reply_text !== null && typeof reply_text !== 'string') {
    return res.status(400).json({
      error: 'reply_text must be a string'
    });
  }

  // Continue to the next middleware
  next();
}
