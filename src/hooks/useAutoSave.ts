import { useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/toast-helper";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // Delay in milliseconds before auto-saving (default: 2000ms)
  enabled?: boolean; // Enable/disable auto-save (default: true)
  storageKey?: string; // LocalStorage key for offline backup
  showNotification?: boolean; // Show "Auto-saved" notification (default: false)
}

/**
 * Hook for auto-saving form data
 * - Debounced save after user stops typing
 * - LocalStorage backup for offline resilience
 * - Loading state management
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  storageKey,
  showNotification = false,
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  // Save to localStorage for offline backup
  const saveToStorage = (dataToSave: T) => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }
  };

  // Load from localStorage
  const loadFromStorage = (): T | null => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("Failed to load from localStorage:", error);
        return null;
      }
    }
    return null;
  };

  // Clear localStorage
  const clearStorage = () => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Failed to clear localStorage:", error);
      }
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Check if data has changed
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (!dataChanged) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      
      try {
        // Save to localStorage first (instant backup)
        saveToStorage(data);
        
        // Then save to server
        await onSave(data);
        
        setLastSaved(new Date());
        previousDataRef.current = data;
        
        if (showNotification) {
          showToast.autoSaved();
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
        // Data is still in localStorage, so not lost
      } finally {
        setIsSaving(false);
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, onSave, showNotification, storageKey]);

  // Manual save function
  const saveNow = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      saveToStorage(data);
      await onSave(data);
      setLastSaved(new Date());
      previousDataRef.current = data;
      showToast.saved("Draft");
    } catch (error) {
      showToast.error("Gagal menyimpan", {
        description: "Terjadi kesalahan saat menyimpan. Silakan coba lagi.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaved,
    saveNow,
    loadFromStorage,
    clearStorage,
  };
}

/**
 * Hook for form draft management
 * Simpler version focused on localStorage backup only
 * 
 * @deprecated Use useAutoSave with storageKey instead
 * This function is kept for backward compatibility
 */
export function useFormDraft<T>(storageKey: string, defaultValues: T) {
  const [draftData, setDraftData] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValues;
    } catch {
      return defaultValues;
    }
  });

  // Save draft to localStorage
  const saveDraft = (data: T) => {
    setDraftData(data);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  // Clear draft
  const clearDraft = () => {
    setDraftData(defaultValues);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  // Check if draft exists
  const hasDraft = () => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  };

  return {
    draftData,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}

/**
 * Unified form auto-save hook
 * Combines functionality from useAutoSave and useFormAutoSave
 */
export function useFormAutoSaveUnified<T extends Record<string, any>>(
  storageKey: string,
  formData: T,
  options: {
    debounceMs?: number;
    enabled?: boolean;
    onSave?: (data: T) => Promise<void>;
    showNotification?: boolean;
  } = {}
) {
  const { debounceMs = 1000, enabled = true, onSave, showNotification = false } = options;

  // Use the main useAutoSave hook
  return useAutoSave({
    data: formData,
    onSave: onSave || (async () => {}), // No-op if not provided
    delay: debounceMs,
    enabled,
    storageKey,
    showNotification,
  });
}
