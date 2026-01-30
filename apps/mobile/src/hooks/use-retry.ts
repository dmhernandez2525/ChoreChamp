import { useState, useCallback, useRef, useEffect } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onSuccess?: () => void;
  onFailure?: (error: Error, attempt: number) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

interface UseRetryResult<T> {
  execute: () => Promise<T | undefined>;
  reset: () => void;
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
  hasReachedMaxAttempts: boolean;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryResult<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onSuccess,
    onFailure,
    onMaxAttemptsReached,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [hasReachedMaxAttempts, setHasReachedMaxAttempts] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculateDelay = useCallback(
    (attemptNumber: number) => {
      const delay = initialDelay * Math.pow(backoffFactor, attemptNumber - 1);
      return Math.min(delay, maxDelay);
    },
    [initialDelay, backoffFactor, maxDelay]
  );

  const execute = useCallback(async (): Promise<T | undefined> => {
    if (!mountedRef.current) return undefined;

    const currentAttempt = attempt + 1;
    setAttempt(currentAttempt);
    setIsRetrying(true);
    setLastError(null);

    try {
      const result = await fn();
      if (mountedRef.current) {
        setIsRetrying(false);
        setAttempt(0);
        setHasReachedMaxAttempts(false);
        onSuccess?.();
      }
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (!mountedRef.current) return undefined;

      setLastError(err);
      onFailure?.(err, currentAttempt);

      if (currentAttempt >= maxAttempts) {
        setIsRetrying(false);
        setHasReachedMaxAttempts(true);
        onMaxAttemptsReached?.(err);
        return undefined;
      }

      // Schedule retry with exponential backoff
      const delay = calculateDelay(currentAttempt);
      return new Promise((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          if (mountedRef.current) {
            const result = await execute();
            resolve(result);
          }
        }, delay);
      });
    }
  }, [fn, attempt, maxAttempts, calculateDelay, onSuccess, onFailure, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAttempt(0);
    setIsRetrying(false);
    setLastError(null);
    setHasReachedMaxAttempts(false);
  }, []);

  return {
    execute,
    reset,
    isRetrying,
    attempt,
    lastError,
    hasReachedMaxAttempts,
  };
}

// Simpler hook for one-off retries
export function useSimpleRetry() {
  const [isRetrying, setIsRetrying] = useState(false);

  const retryWithDelay = useCallback(
    async <T>(fn: () => Promise<T>, delay = 1000): Promise<T> => {
      setIsRetrying(true);
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            setIsRetrying(false);
          }
        }, delay);
      });
    },
    []
  );

  return { isRetrying, retryWithDelay };
}
