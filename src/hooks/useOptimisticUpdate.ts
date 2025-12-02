/**
 * useOptimisticUpdate Hook
 * Hook untuk optimistic updates - update UI immediately, rollback on error
 */

import { useState, useCallback, useRef } from 'react';

interface UseOptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any, rollback: () => void) => void;
  onRollback?: () => void;
}

export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>,
  options: UseOptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError, onRollback } = options;
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const previousDataRef = useRef<T>(initialData);

  const update = useCallback(async (optimisticData: T) => {
    // Store previous data for rollback
    previousDataRef.current = data;

    // Optimistically update UI
    setData(optimisticData);
    setIsUpdating(true);

    try {
      // Perform actual update
      const updatedData = await updateFn(optimisticData);
      
      // Update with server response
      setData(updatedData);
      setIsUpdating(false);
      
      onSuccess?.(updatedData);
      return { success: true, data: updatedData };
    } catch (error: any) {
      // Rollback on error
      setData(previousDataRef.current);
      setIsUpdating(false);
      
      onError?.(error, () => {
        setData(previousDataRef.current);
        onRollback?.();
      });
      
      return { success: false, error };
    }
  }, [data, updateFn, onSuccess, onError, onRollback]);

  const rollback = useCallback(() => {
    setData(previousDataRef.current);
    setIsUpdating(false);
    onRollback?.();
  }, [onRollback]);

  return {
    data,
    isUpdating,
    update,
    rollback,
  };
}

