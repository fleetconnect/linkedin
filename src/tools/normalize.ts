/**
 * REAL normalize tool
 * Input: raw_input from Lead
 * Output: normalized fields (title, company size, seniority, industry)
 * Tech: deterministic logic + enrichment ready
 * Writes: lead.normalized, lead.state = "NORMALIZED"
 */

export interface NormalizedLead {
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  title_expanded: string;
  seniority: 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | 'Unknown';
  company: string;
  email: string;
  linkedin_url: string;
  phone: string;
  industry: string;
  company_size: string;
  company_size_category: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'Unknown';
  normalized_at: string;
}

export function normalize(rawInput: any): NormalizedLead | null {
  if (!rawInput) {
    return null;
  }

  // Clean and validate input
  const cleanedInput = cleanInput(rawInput);

  // Parse name
  const { firstName, lastName } = parseName(cleanedInput.name || '');

  // Process title
  const titleData = processTitle(cleanedInput.title || '');

  // Normalize company size
  const companySizeData = normalizeCompanySize(cleanedInput.company_size);

  // Detect industry
  const industry = detectIndustry(cleanedInput);

  return {
    full_name: cleanedInput.name || '',
    first_name: firstName,
    last_name: lastName,
    title: cleanedInput.title || '',
    title_expanded: titleData.expanded,
    seniority: titleData.seniority,
    company: cleanedInput.company || '',
    email: normalizeEmail(cleanedInput.email),
    linkedin_url: normalizeLinkedInUrl(cleanedInput.linkedin_url),
    phone: normalizePhone(cleanedInput.phone),
    industry,
    company_size: cleanedInput.company_size || 'Unknown',
    company_size_category: companySizeData,
    normalized_at: new Date().toISOString(),
  };
}

function cleanInput(input: any): any {
  const cleaned: any = {};

  // Trim all string fields
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      cleaned[key] = value.trim();
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // First word is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

function processTitle(title: string): {
  expanded: string;
  seniority: 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | 'Unknown';
} {
  if (!title) {
    return { expanded: '', seniority: 'Unknown' };
  }

  const titleUpper = title.toUpperCase();
  const titleLower = title.toLowerCase();

  // Expand common abbreviations
  let expanded = title;

  const abbreviations: Record<string, string> = {
    'CEO': 'Chief Executive Officer',
    'CTO': 'Chief Technology Officer',
    'CFO': 'Chief Financial Officer',
    'CMO': 'Chief Marketing Officer',
    'COO': 'Chief Operating Officer',
    'CISO': 'Chief Information Security Officer',
    'CIO': 'Chief Information Officer',
    'CDO': 'Chief Data Officer',
    'CPO': 'Chief Product Officer',
    'VP': 'Vice President',
    'SVP': 'Senior Vice President',
    'EVP': 'Executive Vice President',
    'AVP': 'Assistant Vice President',
    'GM': 'General Manager',
    'DIR': 'Director',
    'MGR': 'Manager',
  };

  // Try to expand abbreviations
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    if (regex.test(title)) {
      expanded = title.replace(regex, full);
      break;
    }
  }

  // Detect seniority
  let seniority: 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | 'Unknown' = 'Unknown';

  if (/(^|\s)(CEO|CTO|CFO|CMO|COO|CISO|CIO|CDO|CPO|Chief|President|Founder|Owner|Partner)(\s|$)/i.test(title)) {
    seniority = 'C-Level';
  } else if (/(^|\s)(VP|Vice President|EVP|SVP|AVP)(\s|$)/i.test(title)) {
    seniority = 'VP';
  } else if (/(^|\s)(Director|Dir|Head of)(\s|$)/i.test(title)) {
    seniority = 'Director';
  } else if (/(^|\s)(Manager|Mgr|Lead|Team Lead|Supervisor)(\s|$)/i.test(title)) {
    seniority = 'Manager';
  } else if (/(^|\s)(Senior|Sr|Junior|Jr|Associate|Specialist|Analyst|Engineer|Developer|Designer|Consultant)(\s|$)/i.test(title)) {
    seniority = 'Individual Contributor';
  }

  return { expanded, seniority };
}

function detectIndustry(rawInput: any): string {
  // First, check if industry is provided
  if (rawInput.industry && rawInput.industry !== 'Unknown') {
    return rawInput.industry;
  }

  // Try to infer from company name or title
  const company = (rawInput.company || '').toLowerCase();
  const title = (rawInput.title || '').toLowerCase();
  const combined = `${company} ${title}`;

  const industryKeywords: Record<string, string[]> = {
    'Technology': ['tech', 'software', 'saas', 'cloud', 'ai', 'data', 'developer', 'engineer'],
    'Healthcare': ['health', 'medical', 'hospital', 'pharma', 'biotech', 'clinical'],
    'Finance': ['bank', 'financial', 'fintech', 'investment', 'capital', 'insurance'],
    'Manufacturing': ['manufacturing', 'factory', 'industrial', 'production'],
    'Retail': ['retail', 'ecommerce', 'e-commerce', 'shop', 'store'],
    'Education': ['education', 'university', 'school', 'learning', 'academic'],
    'Consulting': ['consulting', 'consultant', 'advisory', 'services'],
    'Marketing': ['marketing', 'advertising', 'agency', 'media'],
    'Real Estate': ['real estate', 'property', 'realty'],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        return industry;
      }
    }
  }

  return 'Unknown';
}

function normalizeCompanySize(sizeInput: any): '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'Unknown' {
  if (!sizeInput) {
    return 'Unknown';
  }

  const sizeStr = String(sizeInput).toLowerCase();

  // Parse numeric ranges
  const rangeMatch = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const lower = parseInt(rangeMatch[1]);
    const upper = parseInt(rangeMatch[2]);
    const avg = (lower + upper) / 2;

    if (avg <= 10) return '1-10';
    if (avg <= 50) return '11-50';
    if (avg <= 200) return '51-200';
    if (avg <= 500) return '201-500';
    if (avg <= 1000) return '501-1000';
    return '1000+';
  }

  // Parse single number
  const numMatch = sizeStr.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);

    if (num <= 10) return '1-10';
    if (num <= 50) return '11-50';
    if (num <= 200) return '51-200';
    if (num <= 500) return '201-500';
    if (num <= 1000) return '501-1000';
    return '1000+';
  }

  // Parse descriptive sizes
  if (sizeStr.includes('startup') || sizeStr.includes('small')) return '1-10';
  if (sizeStr.includes('medium')) return '51-200';
  if (sizeStr.includes('large') || sizeStr.includes('enterprise')) return '1000+';

  return 'Unknown';
}

function normalizeEmail(email: any): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.toLowerCase().trim();
}

function normalizeLinkedInUrl(url: any): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Clean up LinkedIn URL
  let cleaned = url.trim();

  // Ensure it starts with https://
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }

  // Ensure it's a linkedin.com URL
  if (!cleaned.includes('linkedin.com')) {
    return url; // Return original if it's not a LinkedIn URL
  }

  return cleaned;
}

function normalizePhone(phone: any): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  return digits;
}
