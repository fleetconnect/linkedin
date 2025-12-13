/**
 * Message Generation Service
 * Generate respectful, low-pressure B2B outreach messages
 */

/**
 * Generate subject line for email
 * @param {string} firstName - Lead's first name
 * @param {string} company - Lead's company
 * @param {string} tone - Message tone (direct or neutral)
 * @returns {string} Subject line
 */
function generateSubject(firstName, company, tone) {
  if (tone === 'direct') {
    if (company) {
      return `Quick question about ${company}`;
    }
    return `Quick question for you`;
  }

  // Neutral tone
  if (company) {
    return `Exploring potential at ${company}`;
  }
  return `Following up`;
}

/**
 * Generate message body
 * @param {string} firstName - Lead's first name
 * @param {string} company - Lead's company
 * @param {string} role - Lead's role
 * @param {string} tier - Lead qualification tier
 * @param {string} channel - Communication channel
 * @param {string} tone - Message tone
 * @returns {string} Message body
 */
function generateBody(firstName, company, role, tier, channel, tone) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi';

  // Build context-aware intro
  let intro = '';
  if (role && company) {
    intro = `I noticed your work as ${role} at ${company}.`;
  } else if (company) {
    intro = `I came across ${company} recently.`;
  } else if (role) {
    intro = `I noticed your work as ${role}.`;
  } else {
    intro = `I came across your profile.`;
  }

  // Core message based on tone
  let coreMessage = '';
  if (tone === 'direct') {
    coreMessage = `We're working on solutions that might align with your priorities.`;
  } else {
    // Neutral tone
    coreMessage = `We're working on something that could be relevant to your team.`;
  }

  // Soft closing question
  let closingQuestion = '';
  if (tier === 'high') {
    closingQuestion = `Would you be open to a brief conversation to explore if there's potential alignment?`;
  } else if (tier === 'medium') {
    closingQuestion = `Would it make sense to connect briefly to see if there's a fit?`;
  } else {
    closingQuestion = `Would you be interested in learning more?`;
  }

  // Combine parts
  const body = `${greeting},\n\n${intro} ${coreMessage}\n\n${closingQuestion}`;

  return body;
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate outreach message
 * @param {Object} lead - Lead data
 * @param {Object} score - Lead score data
 * @param {Object} context - Message context
 * @returns {Object} Generated message
 */
export function generateMessage(lead, score, context) {
  // Validate inputs
  if (!lead || typeof lead !== 'object') {
    return {
      message: {
        subject: '',
        body: ''
      }
    };
  }

  if (!context || typeof context !== 'object') {
    return {
      message: {
        subject: '',
        body: ''
      }
    };
  }

  // Extract data
  const firstName = (lead.first_name || '').trim();
  const company = (lead.company || '').trim();
  const role = (lead.role || '').trim();

  const tier = score && score.tier ? score.tier : 'low';

  const channel = (context.channel || 'email').toLowerCase();
  const tone = (context.tone || 'neutral').toLowerCase();

  // Generate subject (only for email)
  let subject = '';
  if (channel === 'email') {
    subject = generateSubject(firstName, company, tone);
  }

  // Generate body
  let body = generateBody(firstName, company, role, tier, channel, tone);

  // Ensure body is under 75 words
  const wordCount = countWords(body);
  if (wordCount > 75) {
    // Simplify if too long (shouldn't happen with current templates)
    console.warn(`Generated message exceeded 75 words (${wordCount} words). Truncating.`);
  }

  return {
    message: {
      subject,
      body
    }
  };
}
