// Local storage utilities for SIPANDAI

const STORAGE_KEYS = {
  USERS: "sipandai_users",
  SERVICES: "sipandai_services",
  CONSULTATIONS: "sipandai_consultations",
  CONSULTATION_MESSAGES: "sipandai_consultation_messages",
  CURRENT_USER: "sipandai_current_user",
  SERVICE_HISTORY: "sipandai_service_history",
};

export const storage = {
  // Generic storage functions
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Storage error:", error);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },

  // User-specific functions
  getUsers: () => storage.get<any[]>(STORAGE_KEYS.USERS) || [],
  setUsers: (users: any[]) => storage.set(STORAGE_KEYS.USERS, users),

  getCurrentUser: () => storage.get<any>(STORAGE_KEYS.CURRENT_USER),
  setCurrentUser: (user: any) => storage.set(STORAGE_KEYS.CURRENT_USER, user),
  clearCurrentUser: () => storage.remove(STORAGE_KEYS.CURRENT_USER),

  // Services
  getServices: () => storage.get<any[]>(STORAGE_KEYS.SERVICES) || [],
  setServices: (services: any[]) => storage.set(STORAGE_KEYS.SERVICES, services),

  // Consultations
  getConsultations: () => storage.get<any[]>(STORAGE_KEYS.CONSULTATIONS) || [],
  setConsultations: (consultations: any[]) => storage.set(STORAGE_KEYS.CONSULTATIONS, consultations),

  // Consultation Messages
  getConsultationMessages: () => storage.get<any[]>(STORAGE_KEYS.CONSULTATION_MESSAGES) || [],
  setConsultationMessages: (messages: any[]) => storage.set(STORAGE_KEYS.CONSULTATION_MESSAGES, messages),

  // Service History
  getServiceHistory: () => storage.get<any[]>(STORAGE_KEYS.SERVICE_HISTORY) || [],
  setServiceHistory: (history: any[]) => storage.set(STORAGE_KEYS.SERVICE_HISTORY, history),
};
