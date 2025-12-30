/**
 * Message Validation Utility
 * Enforces strict quality gates for generated messages
 *
 * CRITICAL: Messages must PASS all validations before setting READY_TO_SEND
 */

export interface ValidationRules {
  minWords: number;
  maxWords: number;
  allowDashes: boolean;
  allowLineBreaks: boolean;
  requiresCTA: boolean;
  allowedCTAPatterns?: string[];
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  message: string;
}

export interface ValidationError {
  rule: string;
  actual: any;
  expected: any;
  severity: 'error' | 'warning';
}

/**
 * Default validation rules for initial messages
 */
export const INITIAL_MESSAGE_RULES: ValidationRules = {
  minWords: 20,
  maxWords: 40,
  allowDashes: false,        // ❌ NO DASHES (canonical rule)
  allowLineBreaks: false,    // ❌ NO LINE BREAKS
  requiresCTA: false         // Icebreakers have NO CTA
};

/**
 * Default validation rules for follow-up messages
 */
export const FOLLOWUP_MESSAGE_RULES: ValidationRules = {
  minWords: 60,
  maxWords: 100,
  allowDashes: false,        // ❌ NO DASHES (canonical rule)
  allowLineBreaks: false,    // ❌ NO LINE BREAKS
  requiresCTA: true,         // Follow-ups require permission-based CTA
  allowedCTAPatterns: [
    'would you be open to',
    'would you be interested in',
    'open to exploring',
    'worth a quick call',
    'worth connecting'
  ]
};

/**
 * Validate message against rules
 */
export function validateMessage(
  message: string,
  rules: ValidationRules,
  messageType: 'initial' | 'follow-up' = 'initial'
): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Check for dashes (CRITICAL - canonical no-dashes rule)
  if (!rules.allowDashes) {
    const dashTypes = [
      { char: '—', name: 'em dash' },
      { char: '–', name: 'en dash' },
      { char: '-', name: 'hyphen' }
    ];

    for (const dash of dashTypes) {
      if (message.includes(dash.char)) {
        errors.push({
          rule: 'noDashes',
          actual: `Contains ${dash.name} (${dash.char})`,
          expected: 'Zero dashes of any kind',
          severity: 'error'
        });
      }
    }
  }

  // 2. Check for line breaks
  if (!rules.allowLineBreaks) {
    if (message.includes('\n') || message.includes('\r')) {
      errors.push({
        rule: 'noLineBreaks',
        actual: 'Contains line breaks',
        expected: 'Single paragraph, no line breaks',
        severity: 'error'
      });
    }
  }

  // 3. Check word count
  const wordCount = countWords(message);
  if (wordCount < rules.minWords) {
    errors.push({
      rule: 'wordCount',
      actual: `${wordCount} words`,
      expected: `${rules.minWords}-${rules.maxWords} words`,
      severity: 'error'
    });
  }

  if (wordCount > rules.maxWords) {
    errors.push({
      rule: 'wordCount',
      actual: `${wordCount} words`,
      expected: `${rules.minWords}-${rules.maxWords} words`,
      severity: 'error'
    });
  }

  // 4. Check CTA rules
  if (rules.requiresCTA) {
    const hasCTA = checkCTA(message, rules.allowedCTAPatterns);
    if (!hasCTA) {
      errors.push({
        rule: 'ctaRequired',
        actual: 'No permission-based CTA found',
        expected: `One of: ${rules.allowedCTAPatterns?.join(', ')}`,
        severity: 'error'
      });
    }
  }

  // 5. Check for forbidden CTA in initial messages
  if (messageType === 'initial' && !rules.requiresCTA) {
    const forbiddenCTAs = [
      'let me know',
      'worth a call',
      'interested in',
      'open to',
      'would you',
      '?'  // Questions are CTAs
    ];

    for (const cta of forbiddenCTAs) {
      if (message.toLowerCase().includes(cta)) {
        errors.push({
          rule: 'noCTAInInitial',
          actual: `Contains CTA phrase: "${cta}"`,
          expected: 'Observational only, no CTA',
          severity: 'error'
        });
      }
    }
  }

  // 6. Check for salesy language (anti-patterns)
  const salesyPhrases = [
    'excited to',
    'thrilled to',
    'love to',
    'amazing',
    'awesome',
    'perfect for',
    'ideal for'
  ];

  for (const phrase of salesyPhrases) {
    if (message.toLowerCase().includes(phrase)) {
      errors.push({
        rule: 'noSalesyLanguage',
        actual: `Contains salesy phrase: "${phrase}"`,
        expected: 'Peer tone, not sales pitch',
        severity: 'warning'
      });
    }
  }

  return {
    passed: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    message
  };
}

/**
 * Count words in message
 */
function countWords(message: string): number {
  return message.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if message contains acceptable CTA
 */
function checkCTA(message: string, allowedPatterns?: string[]): boolean {
  if (!allowedPatterns || allowedPatterns.length === 0) {
    return false;
  }

  const lowerMessage = message.toLowerCase();
  return allowedPatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()));
}

/**
 * Format validation errors for logging/display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'All validations passed';
  }

  return errors
    .map(err => `[${err.severity.toUpperCase()}] ${err.rule}: ${err.actual} (expected: ${err.expected})`)
    .join('\n');
}

/**
 * Get validation summary for logging
 */
export function getValidationSummary(result: ValidationResult): {
  status: 'PASS' | 'FAIL';
  errorCount: number;
  warningCount: number;
  failureReason?: string;
} {
  const errorCount = result.errors.filter(e => e.severity === 'error').length;
  const warningCount = result.errors.filter(e => e.severity === 'warning').length;

  return {
    status: result.passed ? 'PASS' : 'FAIL',
    errorCount,
    warningCount,
    failureReason: result.passed ? undefined : formatValidationErrors(result.errors.filter(e => e.severity === 'error'))
  };
}
