/**
 * Centralized Storage Utilities
 * Unified storage management untuk localStorage operations
 */

const STORAGE_KEYS = {
  USERS: "sipandai_users",
  SERVICES: "sipandai_services",
  CONSULTATIONS: "sipandai_consultations",
  CONSULTATION_MESSAGES: "sipandai_consultation_messages",
  CURRENT_USER: "sipandai_current_user",
  SERVICE_HISTORY: "sipandai_service_history",
  // Form drafts
  FORM_DRAFT_PREFIX: "sipandai_form_draft_",
  // User preferences
  USER_PREFERENCES: "sipandai_user_preferences",
  // Cache
  CACHE_PREFIX: "sipandai_cache_",
} as const;

/**
 * Generic storage operations dengan error handling
 */
class StorageManager {
  /**
   * Get item from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to get storage item "${key}":`, error);
      return null;
    }
  }

  /**
   * Set item to localStorage
   */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set storage item "${key}":`, error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Clearing old cache...');
        this.clearCache();
        // Try once more
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove storage item "${key}":`, error);
    }
  }

  /**
   * Clear all localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys with prefix
   */
  getKeysWithPrefix(prefix: string): string[] {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.error('Failed to get keys with prefix:', error);
    }
    return keys;
  }

  /**
   * Clear all items with prefix (useful for cache cleanup)
   */
  clearWithPrefix(prefix: string): void {
    const keys = this.getKeysWithPrefix(prefix);
    keys.forEach(key => this.remove(key));
  }

  /**
   * Clear cache items
   */
  clearCache(): void {
    this.clearWithPrefix(STORAGE_KEYS.CACHE_PREFIX);
  }

  /**
   * Get storage size in bytes (approximate)
   */
  getSize(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          total += key.length + value.length;
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }
    return total;
  }
}

// Create singleton instance
const storageManager = new StorageManager();

/**
 * Main storage export dengan convenience methods
 */
export const storage = {
  // Generic operations
  get: <T>(key: string): T | null => storageManager.get<T>(key),
  set: <T>(key: string, value: T): boolean => storageManager.set(key, value),
  remove: (key: string): void => storageManager.remove(key),
  clear: (): void => storageManager.clear(),
  has: (key: string): boolean => storageManager.has(key),
  
  // Cache operations
  getCache: <T>(key: string): T | null => storageManager.get<T>(`${STORAGE_KEYS.CACHE_PREFIX}${key}`),
  setCache: <T>(key: string, value: T, ttl?: number): boolean => {
    const cacheData = {
      value,
      expiresAt: ttl ? Date.now() + ttl : null,
    };
    return storageManager.set(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, cacheData);
  },
  clearCache: (): void => storageManager.clearCache(),
  
  // Form draft operations
  getFormDraft: <T>(formId: string): T | null => 
    storageManager.get<T>(`${STORAGE_KEYS.FORM_DRAFT_PREFIX}${formId}`),
  setFormDraft: <T>(formId: string, data: T): boolean => 
    storageManager.set(`${STORAGE_KEYS.FORM_DRAFT_PREFIX}${formId}`, data),
  clearFormDraft: (formId: string): void => 
    storageManager.remove(`${STORAGE_KEYS.FORM_DRAFT_PREFIX}${formId}`),
  clearAllFormDrafts: (): void => 
    storageManager.clearWithPrefix(STORAGE_KEYS.FORM_DRAFT_PREFIX),
  
  // User-specific functions (backward compatibility)
  getUsers: () => storageManager.get<any[]>(STORAGE_KEYS.USERS) || [],
  setUsers: (users: any[]) => storageManager.set(STORAGE_KEYS.USERS, users),
  
  getCurrentUser: () => storageManager.get<any>(STORAGE_KEYS.CURRENT_USER),
  setCurrentUser: (user: any) => storageManager.set(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => storageManager.remove(STORAGE_KEYS.CURRENT_USER),
  
  // Services (backward compatibility)
  getServices: () => storageManager.get<any[]>(STORAGE_KEYS.SERVICES) || [],
  setServices: (services: any[]) => storageManager.set(STORAGE_KEYS.SERVICES, services),
  
  // Consultations (backward compatibility)
  getConsultations: () => storageManager.get<any[]>(STORAGE_KEYS.CONSULTATIONS) || [],
  setConsultations: (consultations: any[]) => storageManager.set(STORAGE_KEYS.CONSULTATIONS, consultations),
  
  // Consultation Messages (backward compatibility)
  getConsultationMessages: () => storageManager.get<any[]>(STORAGE_KEYS.CONSULTATION_MESSAGES) || [],
  setConsultationMessages: (messages: any[]) => storageManager.set(STORAGE_KEYS.CONSULTATION_MESSAGES, messages),
  
  // Service History (backward compatibility)
  getServiceHistory: () => storageManager.get<any[]>(STORAGE_KEYS.SERVICE_HISTORY) || [],
  setServiceHistory: (history: any[]) => storageManager.set(STORAGE_KEYS.SERVICE_HISTORY, history),
  
  // Utility methods
  getSize: () => storageManager.getSize(),
  getKeysWithPrefix: (prefix: string) => storageManager.getKeysWithPrefix(prefix),
};

// Export storage keys for external use
export { STORAGE_KEYS };
