import { useState, useCallback, useRef } from 'react';

type RollbackFn = () => void;

interface OptimisticMutationResult<T> {
  execute: (
    optimisticUpdate: () => void,
    mutation: () => Promise<T>,
    rollback?: RollbackFn
  ) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
}

export function useOptimisticMutation<T>(): OptimisticMutationResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const rollbackRef = useRef<RollbackFn | null>(null);

  const execute = useCallback(
    async (
      optimisticUpdate: () => void,
      mutation: () => Promise<T>,
      rollback?: RollbackFn
    ): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);

      // Apply optimistic update immediately
      optimisticUpdate();
      rollbackRef.current = rollback || null;

      try {
        const result = await mutation();
        setIsLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);

        // Rollback on failure
        if (rollbackRef.current) {
          rollbackRef.current();
        }

        throw error;
      }
    },
    []
  );

  return { execute, isLoading, error };
}

// Helper for creating snapshot-based optimistic updates
export function createOptimisticUpdate<T>(
  getCurrentState: () => T,
  applyUpdate: (state: T) => T,
  setState: (state: T) => void
): { update: () => void; rollback: () => void } {
  let snapshot: T | null = null;

  return {
    update: () => {
      snapshot = getCurrentState();
      const newState = applyUpdate(snapshot);
      setState(newState);
    },
    rollback: () => {
      if (snapshot !== null) {
        setState(snapshot);
      }
    },
  };
}
