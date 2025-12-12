/**
 * Perplexity Response Extractors
 * Parse unstructured research into structured signals
 */

import { logger } from '../utils/logger.js';

export interface StructuredResearch {
  company_signals: string[];
  market_signals: string[];
  role_pains: string[];
  buying_triggers: string[];
  sources: string[];
  confidence: number;
}

/**
 * Extract structured data from Perplexity response
 */
export function extractStructuredResearch(rawResponse: string): StructuredResearch {
  logger.info('Extracting structured research', {
    response_length: rawResponse.length,
  });

  const result: StructuredResearch = {
    company_signals: extractSection(rawResponse, 'COMPANY SIGNALS'),
    market_signals: extractSection(rawResponse, 'MARKET SIGNALS'),
    role_pains: extractSection(rawResponse, 'ROLE PAINS'),
    buying_triggers: extractSection(rawResponse, 'BUYING TRIGGERS'),
    sources: extractSources(rawResponse),
    confidence: calculateConfidence(rawResponse),
  };

  logger.info('Structured research extracted', {
    company_signals: result.company_signals.length,
    market_signals: result.market_signals.length,
    role_pains: result.role_pains.length,
    buying_triggers: result.buying_triggers.length,
    sources: result.sources.length,
    confidence: result.confidence,
  });

  return result;
}

/**
 * Extract a specific section from the response
 */
function extractSection(text: string, sectionName: string): string[] {
  const signals: string[] = [];

  // Try to find the section with various formatting
  const patterns = [
    new RegExp(`\\*\\*${sectionName}:?\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, 'i'),
    new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i'),
    new RegExp(`## ${sectionName}([\\s\\S]*?)(?=##|$)`, 'i'),
  ];

  let sectionText = '';
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      sectionText = match[1];
      break;
    }
  }

  if (!sectionText) {
    logger.warn('Section not found', { section: sectionName });
    return signals;
  }

  // Extract bullet points or numbered items
  const lines = sectionText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and section headers
    if (!trimmed || trimmed.startsWith('**') || trimmed.startsWith('#')) {
      continue;
    }

    // Check if it's a bullet point or numbered item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    const numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch) {
      signals.push(cleanSignal(bulletMatch[1]));
    } else if (numberMatch) {
      signals.push(cleanSignal(numberMatch[1]));
    } else if (trimmed.length > 10 && !trimmed.endsWith(':')) {
      // Include standalone lines that look like signals
      signals.push(cleanSignal(trimmed));
    }
  }

  // Filter out "no data" responses
  return signals.filter(
    (s) =>
      !s.toLowerCase().includes('no recent data') &&
      !s.toLowerCase().includes('not available') &&
      !s.toLowerCase().includes('no information')
  );
}

/**
 * Clean up a signal string
 */
function cleanSignal(signal: string): string {
  return (
    signal
      // Remove markdown formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
      // Clean up whitespace
      .trim()
  );
}

/**
 * Extract source URLs from the response
 */
function extractSources(text: string): string[] {
  const sources: string[] = [];
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const matches = text.match(urlRegex);

  if (matches) {
    // Deduplicate and clean URLs
    const uniqueUrls = [...new Set(matches)];
    sources.push(...uniqueUrls.slice(0, 10)); // Limit to 10 sources
  }

  // Also look for explicit source sections
  const sourcePatterns = [
    /Sources?:([^\n]+)/gi,
    /References?:([^\n]+)/gi,
    /Citations?:([^\n]+)/gi,
  ];

  for (const pattern of sourcePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const urls = match[1].match(urlRegex);
      if (urls) {
        sources.push(...urls);
      }
    }
  }

  return [...new Set(sources)]; // Deduplicate
}

/**
 * Calculate confidence score based on response quality
 */
function calculateConfidence(text: string): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence for specific indicators
  if (text.includes('http')) confidence += 0.1; // Has sources
  if (text.length > 500) confidence += 0.1; // Substantial response
  if (text.match(/\d{4}/)) confidence += 0.05; // Has dates (year)
  if (text.match(/\$\d+[MBK]/i)) confidence += 0.05; // Has funding amounts
  if (text.match(/\d+%/)) confidence += 0.05; // Has percentages
  if (text.match(/\d+\s+(employees|people|team)/i)) confidence += 0.05; // Has headcount

  // Decrease confidence for negative indicators
  if (text.includes('No recent data')) confidence -= 0.15;
  if (text.includes('not available')) confidence -= 0.1;
  if (text.includes('limited information')) confidence -= 0.1;
  if (text.length < 200) confidence -= 0.2; // Very short response

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Fallback: Create minimal research structure
 */
export function createFallbackResearch(
  company: string,
  reason: string
): StructuredResearch {
  logger.warn('Creating fallback research', { company, reason });

  return {
    company_signals: [`Unable to research ${company}: ${reason}`],
    market_signals: [],
    role_pains: [],
    buying_triggers: [],
    sources: [],
    confidence: 0.1,
  };
}
