/**
 * API Client with Retry Logic and Error Handling
 * Centralized API client untuk Supabase dengan retry mechanism
 */

import { supabase } from '@/integrations/supabase/client';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
  retryableErrors?: string[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
  retryableErrors: ['NetworkError', 'Failed to fetch', 'Network request failed'],
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableStatuses: number[], retryableErrors: string[]): boolean {
  // Check status code
  if (error?.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  // Check error message
  const errorMessage = error?.message || String(error);
  if (retryableErrors.some(retryableError => errorMessage.includes(retryableError))) {
    return true;
  }

  // Network errors are always retryable
  if (error?.name === 'NetworkError' || errorMessage.includes('network')) {
    return true;
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute Supabase query with retry logic
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await queryFn();

      // If no error, return immediately
      if (!result.error) {
        return result;
      }

      // Check if error is retryable
      if (attempt < config.maxRetries && isRetryableError(result.error, config.retryableStatuses, config.retryableErrors)) {
        lastError = result.error;
        
        // Calculate backoff delay
        const delay = calculateBackoffDelay(attempt, config.retryDelay);
        
        // Log retry attempt (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[API Retry] Attempt ${attempt + 1}/${config.maxRetries + 1} failed. Retrying in ${delay}ms...`, result.error);
        }

        // Wait before retrying
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (attempt < config.maxRetries && isRetryableError(error, config.retryableStatuses, config.retryableErrors)) {
        const delay = calculateBackoffDelay(attempt, config.retryDelay);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[API Retry] Attempt ${attempt + 1}/${config.maxRetries + 1} failed. Retrying in ${delay}ms...`, error);
        }

        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      return { data: null, error };
    }
  }

  // All retries exhausted
  return { data: null, error: lastError };
}

/**
 * Request deduplication cache
 * Prevents duplicate requests within a short time window
 */
const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = 1000; // 1 second

function getCacheKey(method: string, url: string, params?: any): string {
  return `${method}:${url}:${JSON.stringify(params || {})}`;
}

/**
 * Execute query with request deduplication
 */
export async function executeWithDeduplication<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  ttl: number = CACHE_TTL
): Promise<{ data: T | null; error: any }> {
  // Check if there's an ongoing request with the same key
  const existingRequest = requestCache.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const request = queryFn()
    .finally(() => {
      // Remove from cache after TTL
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, ttl);
    });

  // Store in cache
  requestCache.set(cacheKey, request);

  return request;
}

/**
 * Enhanced Supabase query with retry and deduplication
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: RetryOptions & { deduplicate?: boolean; cacheKey?: string }
): Promise<{ data: T | null; error: any }> {
  const { deduplicate = false, cacheKey, ...retryOptions } = options || {};

  if (deduplicate && cacheKey) {
    return executeWithDeduplication(
      () => executeWithRetry(queryFn, retryOptions),
      cacheKey
    );
  }

  return executeWithRetry(queryFn, retryOptions);
}

/**
 * Helper untuk Supabase queries dengan retry
 */
export const apiClient = {
  /**
   * Select with retry
   */
  async select<T>(
    table: string,
    query: (q: any) => any,
    options?: RetryOptions & { deduplicate?: boolean }
  ) {
    const cacheKey = options?.deduplicate ? `select:${table}` : undefined;
    
    return queryWithRetry(
      async () => {
        const q = supabase.from(table).select('*');
        const result = query(q);
        return await result;
      },
      { ...options, cacheKey }
    );
  },

  /**
   * Insert with retry
   */
  async insert<T>(
    table: string,
    data: any,
    options?: RetryOptions
  ) {
    return executeWithRetry(
      async () => await supabase.from(table).insert(data).select().single()
    );
  },

  /**
   * Update with retry
   */
  async update<T>(
    table: string,
    id: string | number,
    data: any,
    options?: RetryOptions
  ) {
    return executeWithRetry(
      async () => await supabase.from(table).update(data).eq('id', id).select().single()
    );
  },

  /**
   * Delete with retry
   */
  async delete(
    table: string,
    id: string | number,
    options?: RetryOptions
  ) {
    return executeWithRetry(
      async () => await supabase.from(table).delete().eq('id', id)
    );
  },
};

