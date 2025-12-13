/**
 * Follow-up Generation Service
 * Generate safe, professional follow-up responses
 */

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate positive follow-up
 * @param {string} firstName - Lead's first name
 * @param {string} replyText - Original reply text
 * @returns {string} Follow-up message
 */
function generatePositiveFollowup(firstName, replyText) {
  const greeting = firstName ? `Thanks ${firstName}` : 'Thanks for getting back to me';

  // Detect if they mentioned specific timing or scheduling
  const hasTimingMention = /\b(when|time|schedule|calendar|available|week|monday|tuesday|wednesday|thursday|friday)\b/i.test(replyText);

  if (hasTimingMention) {
    return `${greeting}. I appreciate your interest. I'll send over a few time options that might work. Looking forward to connecting.`;
  }

  // General positive response
  return `${greeting}. I'm glad this resonates. I'll follow up with some details that might be helpful. Feel free to reach out if you have any questions in the meantime.`;
}

/**
 * Generate neutral follow-up
 * @param {string} firstName - Lead's first name
 * @param {string} replyText - Original reply text
 * @returns {string} Follow-up message
 */
function generateNeutralFollowup(firstName, replyText) {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi';

  // Detect if they're asking for information
  const askingForInfo = /\b(more|information|details|explain|clarify|tell me|what|how)\b/i.test(replyText);

  if (askingForInfo) {
    return `${greeting}, happy to share more context. I'll send over some information that addresses what you mentioned. Let me know if you'd like to discuss further.`;
  }

  // General neutral response - keeping it open
  return `${greeting}, thanks for the response. No pressure at all. I'll share a bit more background in case it's helpful. Feel free to reach out if you'd like to explore this.`;
}

/**
 * Draft a follow-up message
 * @param {Object} lead - Lead data
 * @param {string} intent - Classified intent
 * @param {string} replyText - Original reply text
 * @returns {Object} Follow-up message result
 */
export function draftFollowup(lead, intent, replyText) {
  // Validate inputs
  if (!intent || typeof intent !== 'string') {
    return {
      message: {
        body: ''
      }
    };
  }

  // Only respond to positive or neutral intents
  const intentLower = intent.toLowerCase();
  if (intentLower !== 'positive' && intentLower !== 'neutral') {
    return {
      message: {
        body: ''
      }
    };
  }

  // Extract first name
  const firstName = lead && lead.first_name ? lead.first_name.trim() : '';

  // Get reply text
  const reply = replyText || '';

  // Generate follow-up based on intent
  let body = '';
  if (intentLower === 'positive') {
    body = generatePositiveFollowup(firstName, reply);
  } else {
    body = generateNeutralFollowup(firstName, reply);
  }

  // Ensure body is under 60 words
  const wordCount = countWords(body);
  if (wordCount > 60) {
    console.warn(`Follow-up message exceeded 60 words (${wordCount} words). Review templates.`);
  }

  return {
    message: {
      body
    }
  };
}
