/**
 * Observability Service
 *
 * Structured logging for production visibility.
 * NOT a metrics dashboard. Just enough to answer: "Where does the system fail under load?"
 *
 * Logs:
 * - State transitions
 * - LLM calls (prompt version, latency, success/fail)
 * - Research operations (cache hits vs misses)
 * - Idempotency blocks
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export enum LogCategory {
  STATE_TRANSITION = 'STATE_TRANSITION',
  LLM_CALL = 'LLM_CALL',
  RESEARCH = 'RESEARCH',
  IDEMPOTENCY = 'IDEMPOTENCY',
  API = 'API',
  SYSTEM = 'SYSTEM'
}

interface BaseLogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
}

interface StateTransitionLog extends BaseLogEntry {
  category: LogCategory.STATE_TRANSITION;
  metadata: {
    leadId: string;
    leadName: string;
    fromState: string;
    toState: string;
    success: boolean;
    validationError?: string;
    duration_ms?: number;
  };
}

interface LLMCallLog extends BaseLogEntry {
  category: LogCategory.LLM_CALL;
  metadata: {
    operation: 'classify' | 'generate_message' | 'generate_followup';
    promptId: string;
    promptVersion: string;
    model: string;
    temperature: number;
    success: boolean;
    latency_ms: number;
    tokens_used?: number;
    error?: string;
    leadId?: string;
  };
}

interface ResearchLog extends BaseLogEntry {
  category: LogCategory.RESEARCH;
  metadata: {
    leadId: string;
    companyName: string;
    cacheHit: boolean;
    success: boolean;
    latency_ms?: number;
    error?: string;
    fieldsCollected?: number;
  };
}

interface IdempotencyLog extends BaseLogEntry {
  category: LogCategory.IDEMPOTENCY;
  metadata: {
    leadId: string;
    operation: 'message' | 'classification' | 'followup';
    blocked: boolean;
    reason?: string;
    contentHash?: string;
    timeWindow_ms?: number;
  };
}

type LogEntry = StateTransitionLog | LLMCallLog | ResearchLog | IdempotencyLog | BaseLogEntry;

export class ObservabilityService {
  private static instance: ObservabilityService;
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 10000; // Prevent memory bloat

  private constructor() {}

  static getInstance(): ObservabilityService {
    if (!ObservabilityService.instance) {
      ObservabilityService.instance = new ObservabilityService();
    }
    return ObservabilityService.instance;
  }

  /**
   * Log state transition
   */
  logStateTransition(data: {
    leadId: string;
    leadName: string;
    fromState: string;
    toState: string;
    success: boolean;
    validationError?: string;
    duration_ms?: number;
  }): void {
    const log: StateTransitionLog = {
      timestamp: new Date().toISOString(),
      level: data.success ? LogLevel.INFO : LogLevel.ERROR,
      category: LogCategory.STATE_TRANSITION,
      message: `State transition: ${data.fromState} → ${data.toState} ${data.success ? '✓' : '✗'}`,
      metadata: data
    };

    this.writeLog(log);
  }

  /**
   * Log LLM call
   */
  logLLMCall(data: {
    operation: 'classify' | 'generate_message' | 'generate_followup';
    promptId: string;
    promptVersion: string;
    model: string;
    temperature: number;
    success: boolean;
    latency_ms: number;
    tokens_used?: number;
    error?: string;
    leadId?: string;
  }): void {
    const log: LLMCallLog = {
      timestamp: new Date().toISOString(),
      level: data.success ? LogLevel.INFO : LogLevel.ERROR,
      category: LogCategory.LLM_CALL,
      message: `LLM ${data.operation}: ${data.promptId} (${data.latency_ms}ms) ${data.success ? '✓' : '✗'}`,
      metadata: data
    };

    this.writeLog(log);
  }

  /**
   * Log research operation
   */
  logResearch(data: {
    leadId: string;
    companyName: string;
    cacheHit: boolean;
    success: boolean;
    latency_ms?: number;
    error?: string;
    fieldsCollected?: number;
  }): void {
    const log: ResearchLog = {
      timestamp: new Date().toISOString(),
      level: data.success ? LogLevel.INFO : LogLevel.WARN,
      category: LogCategory.RESEARCH,
      message: `Research ${data.companyName}: ${data.cacheHit ? 'CACHE_HIT' : 'CACHE_MISS'} ${data.success ? '✓' : '✗'}`,
      metadata: data
    };

    this.writeLog(log);
  }

  /**
   * Log idempotency check
   */
  logIdempotency(data: {
    leadId: string;
    operation: 'message' | 'classification' | 'followup';
    blocked: boolean;
    reason?: string;
    contentHash?: string;
    timeWindow_ms?: number;
  }): void {
    const log: IdempotencyLog = {
      timestamp: new Date().toISOString(),
      level: data.blocked ? LogLevel.WARN : LogLevel.DEBUG,
      category: LogCategory.IDEMPOTENCY,
      message: `Idempotency ${data.operation}: ${data.blocked ? 'BLOCKED' : 'ALLOWED'}`,
      metadata: data
    };

    this.writeLog(log);
  }

  /**
   * Generic log method
   */
  log(level: LogLevel, category: LogCategory, message: string, metadata?: Record<string, any>): void {
    const log: BaseLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata
    };

    this.writeLog(log);
  }

  /**
   * Write log entry
   */
  private writeLog(log: LogEntry): void {
    // Console output (structured)
    const consoleMessage = this.formatForConsole(log);

    switch (log.level) {
      case LogLevel.ERROR:
        console.error(consoleMessage);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage);
        break;
      case LogLevel.DEBUG:
        // Only log debug in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(consoleMessage);
        }
        break;
      default:
        console.log(consoleMessage);
    }

    // Store in memory (for querying)
    this.logs.push(log);

    // Prevent memory bloat
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // TODO: In production, also write to:
    // - File (rotating logs)
    // - External service (Datadog, CloudWatch, etc.)
    // - Metrics aggregator
  }

  /**
   * Format log for console output
   */
  private formatForConsole(log: LogEntry): string {
    const timestamp = new Date(log.timestamp).toISOString();
    const level = log.level.padEnd(5);
    const category = log.category.padEnd(18);

    let output = `[${timestamp}] ${level} [${category}] ${log.message}`;

    if (log.metadata) {
      output += ` | ${JSON.stringify(log.metadata)}`;
    }

    return output;
  }

  /**
   * Query logs (for debugging)
   */
  query(filters: {
    category?: LogCategory;
    level?: LogLevel;
    since?: Date;
    leadId?: string;
    limit?: number;
  }): LogEntry[] {
    let results = this.logs;

    if (filters.category) {
      results = results.filter(log => log.category === filters.category);
    }

    if (filters.level) {
      results = results.filter(log => log.level === filters.level);
    }

    if (filters.since) {
      results = results.filter(log => new Date(log.timestamp) >= filters.since!);
    }

    if (filters.leadId) {
      results = results.filter(log => {
        return log.metadata && 'leadId' in log.metadata && log.metadata.leadId === filters.leadId;
      });
    }

    // Most recent first
    results = results.reverse();

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get stats (for health checks)
   */
  getStats(since?: Date): {
    totalLogs: number;
    byCategory: Record<string, number>;
    byLevel: Record<string, number>;
    errorRate: number;
    avgLLMLatency_ms?: number;
    researchCacheHitRate?: number;
    idempotencyBlockRate?: number;
  } {
    let logs = this.logs;

    if (since) {
      logs = logs.filter(log => new Date(log.timestamp) >= since);
    }

    const stats = {
      totalLogs: logs.length,
      byCategory: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      errorRate: 0,
      avgLLMLatency_ms: undefined as number | undefined,
      researchCacheHitRate: undefined as number | undefined,
      idempotencyBlockRate: undefined as number | undefined
    };

    // Count by category and level
    logs.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    // Error rate
    const errorCount = stats.byLevel[LogLevel.ERROR] || 0;
    stats.errorRate = logs.length > 0 ? errorCount / logs.length : 0;

    // LLM latency
    const llmLogs = logs.filter(log => log.category === LogCategory.LLM_CALL) as LLMCallLog[];
    if (llmLogs.length > 0) {
      const totalLatency = llmLogs.reduce((sum, log) => sum + log.metadata.latency_ms, 0);
      stats.avgLLMLatency_ms = Math.round(totalLatency / llmLogs.length);
    }

    // Research cache hit rate
    const researchLogs = logs.filter(log => log.category === LogCategory.RESEARCH) as ResearchLog[];
    if (researchLogs.length > 0) {
      const cacheHits = researchLogs.filter(log => log.metadata.cacheHit).length;
      stats.researchCacheHitRate = cacheHits / researchLogs.length;
    }

    // Idempotency block rate
    const idempotencyLogs = logs.filter(log => log.category === LogCategory.IDEMPOTENCY) as IdempotencyLog[];
    if (idempotencyLogs.length > 0) {
      const blocked = idempotencyLogs.filter(log => log.metadata.blocked).length;
      stats.idempotencyBlockRate = blocked / idempotencyLogs.length;
    }

    return stats;
  }

  /**
   * Clear logs (for testing)
   */
  clear(): void {
    this.logs = [];
  }
}

export default ObservabilityService.getInstance();
