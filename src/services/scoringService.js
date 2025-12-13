/**
 * Lead Scoring Service
 * Conservative lead qualification based on explicit rules
 */

/**
 * Get score based on seniority level
 * Conservative approach: higher seniority = higher value
 * @param {string} seniority - Seniority level
 * @returns {number} Base score (1-5)
 */
function getSeniorityScore(seniority) {
  if (!seniority || typeof seniority !== 'string') {
    return 1;
  }

  const seniorityLower = seniority.toLowerCase();

  // C-Level executives: highest value
  if (seniorityLower === 'c-level') {
    return 5;
  }

  // VP level: high value
  if (seniorityLower === 'vp') {
    return 4;
  }

  // Director level: medium-high value
  if (seniorityLower === 'director') {
    return 3;
  }

  // Manager/Senior level: medium value
  if (seniorityLower === 'manager' || seniorityLower === 'senior') {
    return 2;
  }

  // Junior or unknown: low value (conservative)
  return 1;
}

/**
 * Determine tier based on score
 * @param {number} score - Lead score (1-5)
 * @returns {string} Tier: "low", "medium", or "high"
 */
function getTier(score) {
  if (score >= 4) {
    return 'high';
  }
  if (score === 3) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate reason for the score
 * @param {number} score - Lead score
 * @param {string} seniority - Seniority level
 * @param {boolean} hasCompany - Whether company is provided
 * @param {boolean} hasRole - Whether role is provided
 * @param {boolean} hasIndustry - Whether industry is provided
 * @returns {string} One short sentence explaining the score
 */
function generateReason(score, seniority, hasCompany, hasRole, hasIndustry) {
  const seniorityLabel = seniority || 'unknown seniority';

  // High value leads (score 4-5)
  if (score >= 4) {
    if (hasCompany && hasRole && hasIndustry) {
      return `${seniorityLabel} with complete profile data indicates strong qualification.`;
    }
    return `${seniorityLabel} indicates high-value decision-making authority.`;
  }

  // Medium value leads (score 3)
  if (score === 3) {
    if (hasCompany && hasRole) {
      return `${seniorityLabel} with sufficient profile data shows moderate potential.`;
    }
    return `${seniorityLabel} suggests moderate decision-making influence.`;
  }

  // Low value leads (score 1-2)
  if (score === 2) {
    if (!hasCompany || !hasRole) {
      return `${seniorityLabel} with incomplete data suggests limited immediate value.`;
    }
    return `${seniorityLabel} indicates limited decision-making authority.`;
  }

  // Score 1
  if (!seniority && (!hasCompany || !hasRole)) {
    return 'Insufficient data and unclear seniority suggest minimal qualification.';
  }

  if (!seniority) {
    return 'Unknown seniority level indicates uncertain decision-making authority.';
  }

  return `${seniorityLabel} suggests limited qualification for outreach.`;
}

/**
 * Score a lead based on role relevance, seniority, and industry fit
 * Conservative approach: better to under-score than over-score
 * @param {Object} lead - Normalized lead data
 * @returns {Object} Score result with score, tier, and reason
 */
export function scoreLead(lead) {
  // Validate input
  if (!lead || typeof lead !== 'object') {
    return {
      score: 1,
      tier: 'low',
      reason: 'Invalid lead data provided.'
    };
  }

  const {
    full_name = '',
    company = '',
    role = '',
    industry = '',
    seniority = ''
  } = lead;

  // Check if we have minimal data
  const hasCompany = Boolean(company && company.trim());
  const hasRole = Boolean(role && role.trim());
  const hasIndustry = Boolean(industry && industry.trim());
  const hasSeniority = Boolean(seniority && seniority.trim());

  // Calculate base score from seniority (primary factor)
  let score = getSeniorityScore(seniority);

  // Conservative adjustment: reduce score if critical data is missing
  // Only reduce, never increase (conservative approach)
  if (!hasCompany && !hasRole) {
    // Missing both company and role: reduce confidence
    score = Math.max(1, score - 1);
  }

  // Ensure score is within bounds
  score = Math.max(1, Math.min(5, score));

  // Determine tier
  const tier = getTier(score);

  // Generate reason
  const reason = generateReason(score, seniority, hasCompany, hasRole, hasIndustry);

  return {
    score,
    tier,
    reason
  };
}
