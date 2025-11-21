import { useEffect, useRef } from "react";

/**
 * Auto-save form data to localStorage
 * Useful for preventing data loss on accidental navigation
 */
export function useFormAutoSave<T extends Record<string, any>>(
    key: string,
    formData: T,
    options: {
        debounceMs?: number;
        enabled?: boolean;
    } = {}
) {
    const { debounceMs = 1000, enabled = true } = options;
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!enabled) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the save
        timeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(formData));
            } catch (error) {
                console.error("Failed to auto-save form data:", error);
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [key, formData, debounceMs, enabled]);

    /**
     * Load saved form data from localStorage
     */
    const loadSavedData = (): T | null => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error("Failed to load saved form data:", error);
            return null;
        }
    };

    /**
     * Clear saved form data from localStorage
     */
    const clearSavedData = () => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Failed to clear saved form data:", error);
        }
    };

    return { loadSavedData, clearSavedData };
}

/**
 * Warn user before leaving page with unsaved changes
 */
export function useFormUnsavedWarning(hasUnsavedChanges: boolean) {
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
            return "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);
}
