/**
 * Retry Utility with Exponential Backoff
 *
 * Handles transient failures in LLM and external API calls.
 * Does NOT retry permanent failures (400 errors, auth failures).
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration_ms: number;
}

/**
 * Check if error is retryable (transient failure)
 */
function isRetryableError(error: Error, retryablePatterns?: string[]): boolean {
  const errorMessage = error.message.toLowerCase();

  // Default retryable patterns (network/timeout issues)
  const defaultRetryable = [
    'timeout',
    'econnreset',
    'econnrefused',
    'etimedout',
    'network',
    'socket hang up',
    'rate limit',
    '429', // Rate limit HTTP code
    '500', // Server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ];

  const patterns = retryablePatterns || defaultRetryable;

  return patterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
}

/**
 * Check if error is permanent (don't retry)
 */
function isPermanentError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();

  const permanentPatterns = [
    '400', // Bad request
    '401', // Unauthorized
    '403', // Forbidden
    '404', // Not found
    'invalid api key',
    'authentication failed',
    'malformed',
    'invalid request'
  ];

  return permanentPatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    retryableErrors,
    onRetry
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;
  let attempt = 0;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt,
        totalDuration_ms: Date.now() - startTime
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is permanent (don't retry)
      if (isPermanentError(lastError)) {
        console.error(`❌ Permanent error detected, not retrying: ${lastError.message}`);
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDuration_ms: Date.now() - startTime
        };
      }

      // Check if error is retryable
      if (!isRetryableError(lastError, retryableErrors)) {
        console.error(`❌ Non-retryable error: ${lastError.message}`);
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDuration_ms: Date.now() - startTime
        };
      }

      // Last attempt - don't wait
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate backoff delay
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );

      console.warn(
        `⚠️  Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}. ` +
        `Retrying in ${delay}ms...`
      );

      // Notify retry callback
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  return {
    success: false,
    error: lastError,
    attempts: attempt,
    totalDuration_ms: Date.now() - startTime
  };
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<RetryResult<T>> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  const fnWithTimeout = () => Promise.race([fn(), timeoutPromise]);

  return retryWithBackoff(fnWithTimeout, retryOptions);
}

export default retryWithBackoff;
