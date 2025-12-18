/**
 * REAL scoring tool with rules engine
 * Input: normalized lead + campaign scoring rules
 * Output: score + qualified boolean
 * Tech: rules engine (deterministic, no LLM needed)
 * Writes: lead.score, lead.state = QUALIFIED|DISQUALIFIED
 */

export interface ScoringRules {
  // ICP configuration from campaign
  titles?: string[];
  seniority_levels?: ('C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor')[];
  industries?: string[];
  company_sizes?: string[];

  // Scoring weights
  weights?: {
    title?: number;
    seniority?: number;
    industry?: number;
    company_size?: number;
  };

  // Threshold
  thresholds?: {
    min_score: number;
  };

  // Disqualifiers
  disqualifiers?: string[];
}

export interface ScoreResult {
  total: number;
  qualified: boolean;
  disqualified: boolean;
  disqualification_reason?: string;
  factors: {
    title_match: number;
    seniority_match: number;
    industry_match: number;
    company_size_match: number;
  };
  threshold: number;
  scored_at: string;
}

export function score(normalized: any, scoringRules: ScoringRules): ScoreResult {
  if (!normalized) {
    return {
      total: 0,
      qualified: false,
      disqualified: true,
      disqualification_reason: 'No normalized data',
      factors: {
        title_match: 0,
        seniority_match: 0,
        industry_match: 0,
        company_size_match: 0,
      },
      threshold: 0,
      scored_at: new Date().toISOString(),
    };
  }

  // Default scoring rules if none provided
  const rules: ScoringRules = {
    titles: scoringRules?.titles || [],
    seniority_levels: scoringRules?.seniority_levels || [],
    industries: scoringRules?.industries || [],
    company_sizes: scoringRules?.company_sizes || [],
    weights: {
      title: 30,
      seniority: 25,
      industry: 25,
      company_size: 20,
      ...scoringRules?.weights,
    },
    thresholds: {
      min_score: 70,
      ...scoringRules?.thresholds,
    },
    disqualifiers: scoringRules?.disqualifiers || [],
  };

  // 1. Check disqualifiers first
  const disqualificationCheck = checkDisqualifiers(normalized, rules.disqualifiers);

  if (disqualificationCheck.disqualified) {
    return {
      total: 0,
      qualified: false,
      disqualified: true,
      disqualification_reason: disqualificationCheck.reason,
      factors: {
        title_match: 0,
        seniority_match: 0,
        industry_match: 0,
        company_size_match: 0,
      },
      threshold: rules.thresholds.min_score,
      scored_at: new Date().toISOString(),
    };
  }

  // 2. Calculate scores for each factor
  const titleScore = calculateTitleScore(
    normalized.title_expanded || normalized.title,
    rules.titles,
    rules.weights.title!
  );

  const seniorityScore = calculateSeniorityScore(
    normalized.seniority,
    rules.seniority_levels,
    rules.weights.seniority!
  );

  const industryScore = calculateIndustryScore(
    normalized.industry,
    rules.industries,
    rules.weights.industry!
  );

  const companySizeScore = calculateCompanySizeScore(
    normalized.company_size_category || normalized.company_size,
    rules.company_sizes,
    rules.weights.company_size!
  );

  // 3. Calculate total
  const total = titleScore + seniorityScore + industryScore + companySizeScore;

  // 4. Determine if qualified
  const qualified = total >= rules.thresholds.min_score;

  return {
    total,
    qualified,
    disqualified: false,
    factors: {
      title_match: titleScore,
      seniority_match: seniorityScore,
      industry_match: industryScore,
      company_size_match: companySizeScore,
    },
    threshold: rules.thresholds.min_score,
    scored_at: new Date().toISOString(),
  };
}

function calculateTitleScore(title: string, targets: string[], maxPoints: number): number {
  if (!title || !targets || targets.length === 0) {
    return 0;
  }

  const titleLower = title.toLowerCase();

  // Exact match gets full points
  for (const target of targets) {
    if (titleLower === target.toLowerCase()) {
      return maxPoints;
    }
  }

  // Partial match gets partial points
  for (const target of targets) {
    if (titleLower.includes(target.toLowerCase()) || target.toLowerCase().includes(titleLower)) {
      return Math.floor(maxPoints * 0.7); // 70% for partial match
    }
  }

  return 0;
}

function calculateSeniorityScore(
  seniority: string,
  targets: string[],
  maxPoints: number
): number {
  if (!seniority || !targets || targets.length === 0) {
    return 0;
  }

  // Exact match
  if (targets.includes(seniority)) {
    return maxPoints;
  }

  // Partial credit for adjacent seniority levels
  const seniorityHierarchy = [
    'C-Level',
    'VP',
    'Director',
    'Manager',
    'Individual Contributor',
  ];

  const currentIndex = seniorityHierarchy.indexOf(seniority);
  if (currentIndex === -1) {
    return 0;
  }

  // Check if any target is adjacent
  for (const target of targets) {
    const targetIndex = seniorityHierarchy.indexOf(target);
    if (targetIndex !== -1) {
      const distance = Math.abs(currentIndex - targetIndex);
      if (distance === 1) {
        return Math.floor(maxPoints * 0.5); // 50% for adjacent level
      }
      if (distance === 2) {
        return Math.floor(maxPoints * 0.25); // 25% for 2 levels away
      }
    }
  }

  return 0;
}

function calculateIndustryScore(industry: string, targets: string[], maxPoints: number): number {
  if (!industry || !targets || targets.length === 0) {
    return 0;
  }

  const industryLower = industry.toLowerCase();

  // Exact match
  for (const target of targets) {
    if (industryLower === target.toLowerCase()) {
      return maxPoints;
    }
  }

  // Partial match
  for (const target of targets) {
    if (industryLower.includes(target.toLowerCase()) || target.toLowerCase().includes(industryLower)) {
      return Math.floor(maxPoints * 0.7);
    }
  }

  return 0;
}

function calculateCompanySizeScore(size: string, targets: string[], maxPoints: number): number {
  if (!size || !targets || targets.length === 0) {
    return 0;
  }

  // Exact match
  if (targets.includes(size)) {
    return maxPoints;
  }

  // Normalize and check for partial matches
  const sizeLower = size.toLowerCase();
  for (const target of targets) {
    if (sizeLower.includes(target.toLowerCase()) || target.toLowerCase().includes(sizeLower)) {
      return Math.floor(maxPoints * 0.8);
    }
  }

  return 0;
}

function checkDisqualifiers(
  normalized: any,
  disqualifiers: string[]
): { disqualified: boolean; reason?: string } {
  if (!disqualifiers || disqualifiers.length === 0) {
    return { disqualified: false };
  }

  // Concatenate all relevant fields for checking
  const checkFields = [
    normalized.title?.toLowerCase() || '',
    normalized.title_expanded?.toLowerCase() || '',
    normalized.company?.toLowerCase() || '',
    normalized.industry?.toLowerCase() || '',
    normalized.seniority?.toLowerCase() || '',
  ].join(' ');

  for (const disqualifier of disqualifiers) {
    const disqualifierLower = disqualifier.toLowerCase();
    if (checkFields.includes(disqualifierLower)) {
      return {
        disqualified: true,
        reason: `Matched disqualifier: "${disqualifier}"`,
      };
    }
  }

  return { disqualified: false };
}
