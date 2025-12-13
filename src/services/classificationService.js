/**
 * Reply Classification Service
 * Classify reply intent based on explicit meaning
 */

/**
 * Detect out of office replies
 * @param {string} text - Reply text (lowercase)
 * @returns {Object} {isMatch: boolean, confidence: number}
 */
function detectOutOfOffice(text) {
  const strongPatterns = [
    /out of office/i,
    /automatic reply/i,
    /auto-reply/i,
    /automated response/i,
    /currently unavailable/i,
    /away from (my |the )?office/i,
    /will respond when I return/i,
    /limited access to email/i
  ];

  const mediumPatterns = [
    /on vacation/i,
    /on leave/i,
    /away until/i,
    /back on/i,
    /returning on/i
  ];

  // Check strong patterns
  for (const pattern of strongPatterns) {
    if (pattern.test(text)) {
      return { isMatch: true, confidence: 0.95 };
    }
  }

  // Check medium patterns
  for (const pattern of mediumPatterns) {
    if (pattern.test(text)) {
      return { isMatch: true, confidence: 0.75 };
    }
  }

  return { isMatch: false, confidence: 0 };
}

/**
 * Detect positive intent
 * @param {string} text - Reply text (lowercase)
 * @returns {Object} {score: number, confidence: number}
 */
function detectPositive(text) {
  const strongPositive = [
    /\b(yes|yeah|yep|sure|absolutely|definitely)\b/i,
    /sounds good/i,
    /sounds great/i,
    /interested/i,
    /would love to/i,
    /happy to/i,
    /glad to/i,
    /let'?s (talk|chat|connect|discuss|schedule)/i,
    /when (are you|can we|would|could)/i,
    /what time/i,
    /send (me |over )?calendar/i,
    /book a (time|call|meeting)/i,
    /available/i
  ];

  const mediumPositive = [
    /thank you/i,
    /thanks/i,
    /appreciate/i,
    /tell me more/i,
    /more information/i,
    /curious/i,
    /intrigued/i
  ];

  let score = 0;
  let matches = 0;

  // Strong positive signals
  for (const pattern of strongPositive) {
    if (pattern.test(text)) {
      score += 3;
      matches++;
    }
  }

  // Medium positive signals
  for (const pattern of mediumPositive) {
    if (pattern.test(text)) {
      score += 1;
      matches++;
    }
  }

  const confidence = matches > 0 ? Math.min(0.6 + (matches * 0.1), 0.95) : 0;
  return { score, confidence };
}

/**
 * Detect negative intent
 * @param {string} text - Reply text (lowercase)
 * @returns {Object} {score: number, confidence: number}
 */
function detectNegative(text) {
  const strongNegative = [
    /\b(no|nope|nah)\b/i,
    /not interested/i,
    /don'?t (contact|email|reach out)/i,
    /stop (emailing|contacting|reaching)/i,
    /remove me/i,
    /unsubscribe/i,
    /never/i,
    /do not (contact|email|call)/i,
    /leave me alone/i
  ];

  const mediumNegative = [
    /not a (good )?fit/i,
    /not relevant/i,
    /not applicable/i,
    /wrong person/i,
    /not the right/i
  ];

  let score = 0;
  let matches = 0;

  // Strong negative signals
  for (const pattern of strongNegative) {
    if (pattern.test(text)) {
      score += 3;
      matches++;
    }
  }

  // Medium negative signals
  for (const pattern of mediumNegative) {
    if (pattern.test(text)) {
      score += 1;
      matches++;
    }
  }

  const confidence = matches > 0 ? Math.min(0.7 + (matches * 0.1), 0.95) : 0;
  return { score, confidence };
}

/**
 * Detect objection intent
 * @param {string} text - Reply text (lowercase)
 * @returns {Object} {score: number, confidence: number}
 */
function detectObjection(text) {
  const objectionPatterns = [
    /already (have|using|working with)/i,
    /timing (isn'?t|is not) right/i,
    /not (a )?priority right now/i,
    /maybe (later|next)/i,
    /in the future/i,
    /not (right )?now/i,
    /too (busy|expensive)/i,
    /budget/i,
    /check back/i,
    /circle back/i,
    /revisit (this |in )/i,
    /\bhowever\b/i,
    /\bbut\b/i
  ];

  let score = 0;
  let matches = 0;

  for (const pattern of objectionPatterns) {
    if (pattern.test(text)) {
      score += 2;
      matches++;
    }
  }

  const confidence = matches > 0 ? Math.min(0.6 + (matches * 0.08), 0.9) : 0;
  return { score, confidence };
}

/**
 * Detect neutral intent
 * @param {string} text - Reply text (lowercase)
 * @returns {Object} {score: number, confidence: number}
 */
function detectNeutral(text) {
  const neutralPatterns = [
    /can you (explain|clarify|elaborate)/i,
    /what (is|does|do|would)/i,
    /how (does|do|would)/i,
    /tell me more/i,
    /more (details|info|information)/i,
    /not sure/i,
    /maybe/i,
    /possibly/i,
    /need to (think|consider|discuss)/i,
    /forward this/i,
    /send (me |this to)/i
  ];

  let score = 0;
  let matches = 0;

  for (const pattern of neutralPatterns) {
    if (pattern.test(text)) {
      score += 1;
      matches++;
    }
  }

  const confidence = matches > 0 ? Math.min(0.5 + (matches * 0.08), 0.8) : 0;
  return { score, confidence };
}

/**
 * Classify reply intent
 * @param {string} replyText - The reply text to classify
 * @returns {Object} Classification result with intent and confidence
 */
export function classifyReply(replyText) {
  // Validate input
  if (!replyText || typeof replyText !== 'string') {
    return {
      intent: 'neutral',
      confidence: 0.1
    };
  }

  const text = replyText.trim();

  // Empty or very short text
  if (text.length < 2) {
    return {
      intent: 'neutral',
      confidence: 0.1
    };
  }

  // Check for out of office first (highest priority)
  const oooResult = detectOutOfOffice(text);
  if (oooResult.isMatch) {
    return {
      intent: 'out_of_office',
      confidence: oooResult.confidence
    };
  }

  // Detect all intents
  const positive = detectPositive(text);
  const negative = detectNegative(text);
  const objection = detectObjection(text);
  const neutral = detectNeutral(text);

  // Create array of results
  const results = [
    { intent: 'positive', score: positive.score, confidence: positive.confidence },
    { intent: 'negative', score: negative.score, confidence: negative.confidence },
    { intent: 'objection', score: objection.score, confidence: objection.confidence },
    { intent: 'neutral', score: neutral.score, confidence: neutral.confidence }
  ];

  // Sort by score first, then by confidence
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.confidence - a.confidence;
  });

  // Get the top result
  const topResult = results[0];

  // If no clear signals, default to neutral with low confidence
  if (topResult.score === 0) {
    return {
      intent: 'neutral',
      confidence: 0.3
    };
  }

  // Return the top intent
  return {
    intent: topResult.intent,
    confidence: Math.min(Math.max(topResult.confidence, 0), 1)
  };
}
