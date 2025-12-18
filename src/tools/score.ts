/**
 * Stateless scoring tool
 * Takes normalized data and campaign scoring rules, returns score
 *
 * This is a placeholder - replace with your actual scoring logic
 */
export function score(normalized: any, scoringRules: any): any {
  // Placeholder implementation
  // In production, this would:
  // - Apply scoring rules from campaign
  // - Check against disqualifiers
  // - Calculate match scores for title, industry, company size
  // - Return comprehensive scoring breakdown

  if (!normalized || !scoringRules) {
    return {
      total: 0,
      qualified: false,
      factors: {},
    };
  }

  const factors: Record<string, number> = {};
  let total = 0;

  // Title matching
  const titleScore = calculateTitleScore(
    normalized.title,
    scoringRules.title_targets || []
  );
  factors.title_match = titleScore;
  total += titleScore;

  // Industry matching
  const industryScore = calculateIndustryScore(
    normalized.industry,
    scoringRules.industry_targets || []
  );
  factors.industry_match = industryScore;
  total += industryScore;

  // Company size matching
  const sizeScore = calculateSizeScore(
    normalized.company_size,
    scoringRules.size_targets || []
  );
  factors.company_size_match = sizeScore;
  total += sizeScore;

  // Check disqualifiers
  const disqualified = checkDisqualifiers(
    normalized,
    scoringRules.disqualifiers || []
  );

  // Apply threshold
  const threshold = scoringRules.thresholds?.min_score || 70;
  const qualified = !disqualified && total >= threshold;

  return {
    total,
    qualified,
    disqualified,
    factors,
    threshold,
    scored_at: new Date().toISOString(),
  };
}

function calculateTitleScore(title: string, targets: string[]): number {
  // Placeholder - in production, use fuzzy matching, seniority detection, etc.
  if (!title || targets.length === 0) return 0;

  const titleLower = title.toLowerCase();
  for (const target of targets) {
    if (titleLower.includes(target.toLowerCase())) {
      return 30; // Max points for title match
    }
  }
  return 0;
}

function calculateIndustryScore(industry: string, targets: string[]): number {
  // Placeholder
  if (!industry || targets.length === 0) return 0;

  const industryLower = industry.toLowerCase();
  for (const target of targets) {
    if (industryLower.includes(target.toLowerCase())) {
      return 25; // Max points for industry match
    }
  }
  return 0;
}

function calculateSizeScore(size: string, targets: string[]): number {
  // Placeholder
  if (!size || targets.length === 0) return 0;

  for (const target of targets) {
    if (size === target) {
      return 30; // Max points for size match
    }
  }
  return 0;
}

function checkDisqualifiers(normalized: any, disqualifiers: string[]): boolean {
  // Placeholder - check if lead matches any disqualification criteria
  if (!disqualifiers || disqualifiers.length === 0) return false;

  const checkFields = [
    normalized.title?.toLowerCase() || '',
    normalized.company?.toLowerCase() || '',
    normalized.industry?.toLowerCase() || '',
  ].join(' ');

  for (const disqualifier of disqualifiers) {
    if (checkFields.includes(disqualifier.toLowerCase())) {
      return true;
    }
  }

  return false;
}
