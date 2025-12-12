/**
 * Research Caching and Reuse
 * Treat research as an asset that gets smarter over time
 */

import { logger } from '../../utils/logger.js';

export interface CachedResearch {
  company: string;
  data: {
    signals: string[];
    funding?: any;
    tech_stack?: string[];
    recent_news?: string[];
    hiring_trends?: any;
  };
  enriched_at: Date;
  last_updated: Date;
  quality_score: number;
  reuse_count: number;
}

export class ResearchCache {
  private cache: Map<string, CachedResearch> = new Map();

  /**
   * Get cached research or indicate it needs refresh
   */
  get(company: string): CachedResearch | null {
    const cached = this.cache.get(company.toLowerCase());

    if (!cached) return null;

    // Check if stale (>30 days)
    const daysSince = (Date.now() - cached.last_updated.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince > 30) {
      logger.info('Cached research stale, needs refresh', { company, days: daysSince });
      return null;
    }

    cached.reuse_count++;
    return cached;
  }

  /**
   * Cache research
   */
  set(company: string, data: any, qualityScore: number = 0.8): void {
    const cached: CachedResearch = {
      company,
      data,
      enriched_at: new Date(),
      last_updated: new Date(),
      quality_score: qualityScore,
      reuse_count: 0,
    };

    this.cache.set(company.toLowerCase(), cached);
    logger.info('Research cached', { company, quality: qualityScore });
  }

  /**
   * Enrich existing research with new signals
   */
  enrich(company: string, newData: any): void {
    const cached = this.cache.get(company.toLowerCase());
    if (!cached) return;

    cached.data = { ...cached.data, ...newData };
    cached.last_updated = new Date();
    cached.quality_score = Math.min(1, cached.quality_score + 0.1);

    logger.info('Research enriched', { company });
  }

  /**
   * Re-score when new signals appear
   */
  rescore(company: string, newScore: number): void {
    const cached = this.cache.get(company.toLowerCase());
    if (!cached) return;

    cached.quality_score = newScore;
    cached.last_updated = new Date();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    total_cached: number;
    total_reuses: number;
    avg_quality: number;
    value_generated: string;
  } {
    const cached = Array.from(this.cache.values());
    const totalReuses = cached.reduce((sum, c) => sum + c.reuse_count, 0);
    const avgQuality = cached.reduce((sum, c) => sum + c.quality_score, 0) / cached.length;

    return {
      total_cached: cached.length,
      total_reuses: totalReuses,
      avg_quality: avgQuality,
      value_generated: `Saved ${totalReuses} research cycles`,
    };
  }
}
