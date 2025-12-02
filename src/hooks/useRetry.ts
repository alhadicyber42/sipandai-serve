/**
 * useRetry Hook
 * Hook untuk retry operations dengan exponential backoff
 */

import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  onError?: (error: any, attempts: number) => void;
}

interface RetryState {
  isLoading: boolean;
  error: any | null;
  attempts: number;
  isRetrying: boolean;
}

export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attempts: 0,
    isRetrying: false,
  });

  const calculateBackoff = useCallback((attempt: number): number => {
    return retryDelay * Math.pow(2, attempt);
  }, [retryDelay]);

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn();
        
        setState({
          isLoading: false,
          error: null,
          attempts: attempt + 1,
          isRetrying: false,
        });

        if (attempt > 0) {
          onSuccess?.();
        }

        return result;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;

        if (isLastAttempt) {
          setState({
            isLoading: false,
            error,
            attempts: attempt + 1,
            isRetrying: false,
          });
          onError?.(error, attempt + 1);
          return null;
        }

        // Retry with exponential backoff
        const delay = calculateBackoff(attempt);
        setState(prev => ({
          ...prev,
          isRetrying: true,
          attempts: attempt + 1,
        }));

        onRetry?.(attempt + 1);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return null;
  }, [asyncFn, maxRetries, calculateBackoff, onRetry, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      attempts: 0,
      isRetrying: false,
    });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}

