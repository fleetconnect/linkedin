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
