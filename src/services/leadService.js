/**
 * Lead Normalization Service
 * Deterministic data normalization for raw lead data
 */

/**
 * Normalize a LinkedIn URL
 * @param {string} url - Raw LinkedIn URL
 * @returns {string} Cleaned LinkedIn URL or empty string
 */
function normalizeLinkedInUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    // Remove whitespace
    let cleaned = url.trim();

    // Handle various LinkedIn URL formats
    if (cleaned.includes('linkedin.com')) {
      // Extract the path after linkedin.com
      const match = cleaned.match(/linkedin\.com\/(in|company)\/([^/?#]+)/i);
      if (match) {
        const type = match[1].toLowerCase();
        const username = match[2];
        return `https://www.linkedin.com/${type}/${username}`;
      }
    }

    return '';
  } catch (error) {
    return '';
  }
}

/**
 * Extract first name from full name
 * @param {string} fullName - Full name
 * @returns {string} First name (first token only)
 */
function extractFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    return '';
  }

  // First token only
  const tokens = trimmed.split(/\s+/);
  return tokens[0] || '';
}

/**
 * Determine seniority level from title
 * Conservative approach - only classify if clear indicators present
 * @param {string} title - Job title
 * @returns {string} Seniority level or empty string
 */
function determineSeniority(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  const lowerTitle = title.toLowerCase();

  // C-level executives
  if (/\b(ceo|cto|cfo|coo|cmo|cio|chief)\b/.test(lowerTitle)) {
    return 'C-Level';
  }

  // VP level
  if (/\b(vp|vice president)\b/.test(lowerTitle)) {
    return 'VP';
  }

  // Director level
  if (/\b(director|head of)\b/.test(lowerTitle)) {
    return 'Director';
  }

  // Manager level
  if (/\b(manager|lead|principal)\b/.test(lowerTitle)) {
    return 'Manager';
  }

  // Senior level
  if (/\b(senior|sr\.?)\b/.test(lowerTitle)) {
    return 'Senior';
  }

  // Junior level
  if (/\b(junior|jr\.?|associate|intern)\b/.test(lowerTitle)) {
    return 'Junior';
  }

  // If no clear indicator, return empty string (conservative)
  return '';
}

/**
 * Determine industry from company and title
 * Conservative approach - only classify if clear indicators present
 * @param {string} company - Company name
 * @param {string} title - Job title
 * @returns {string} Industry or empty string
 */
function determineIndustry(company, title) {
  const companyLower = (company || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();
  const combined = `${companyLower} ${titleLower}`;

  // Technology
  if (/\b(software|tech|developer|engineer|programmer|data|cloud|saas|it\b|ai\b|ml\b)/.test(combined)) {
    return 'Technology';
  }

  // Finance
  if (/\b(bank|finance|financial|investment|trading|accounting|insurance)/.test(combined)) {
    return 'Finance';
  }

  // Healthcare
  if (/\b(health|medical|hospital|pharma|clinical|doctor|nurse)/.test(combined)) {
    return 'Healthcare';
  }

  // Marketing
  if (/\b(marketing|advertis|brand|seo|content|digital marketing)/.test(combined)) {
    return 'Marketing';
  }

  // Sales
  if (/\b(sales|business development|account executive|revenue)/.test(combined)) {
    return 'Sales';
  }

  // Education
  if (/\b(education|university|school|teacher|professor|academic)/.test(combined)) {
    return 'Education';
  }

  // Retail
  if (/\b(retail|store|shop|ecommerce|e-commerce)/.test(combined)) {
    return 'Retail';
  }

  // Manufacturing
  if (/\b(manufacturing|production|factory|industrial)/.test(combined)) {
    return 'Manufacturing';
  }

  // Consulting
  if (/\b(consult|advisory|strategy)/.test(combined)) {
    return 'Consulting';
  }

  // Real Estate
  if (/\b(real estate|property|realtor)/.test(combined)) {
    return 'Real Estate';
  }

  // Conservative: return empty string if no clear match
  return '';
}

/**
 * Normalize role (clean up the title)
 * @param {string} title - Raw job title
 * @returns {string} Normalized role
 */
function normalizeRole(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  // Just trim and preserve the title as-is
  return title.trim();
}

/**
 * Normalize raw lead data into structured format
 * @param {Object} rawLead - Raw lead data
 * @returns {Object} Normalized lead object
 */
export function normalizeLead(rawLead) {
  // Validate input
  if (!rawLead || typeof rawLead !== 'object') {
    return {
      lead: {
        full_name: '',
        first_name: '',
        company: '',
        role: '',
        industry: '',
        seniority: '',
        clean_linkedin: ''
      }
    };
  }

  const {
    name = '',
    company = '',
    title = '',
    linkedin_url = '',
    source = ''
  } = rawLead;

  // Normalize full_name
  const fullName = (name || '').trim();

  // Extract first_name (first token only)
  const firstName = extractFirstName(fullName);

  // Normalize company
  const normalizedCompany = (company || '').trim();

  // Normalize role
  const role = normalizeRole(title);

  // Determine industry (conservative)
  const industry = determineIndustry(normalizedCompany, title);

  // Determine seniority (conservative)
  const seniority = determineSeniority(title);

  // Normalize LinkedIn URL
  const cleanLinkedin = normalizeLinkedInUrl(linkedin_url);

  return {
    lead: {
      full_name: fullName,
      first_name: firstName,
      company: normalizedCompany,
      role: role,
      industry: industry,
      seniority: seniority,
      clean_linkedin: cleanLinkedin
    }
  };
}
