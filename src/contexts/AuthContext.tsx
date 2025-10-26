import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { initializeSeedData } from "@/lib/seed-data";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  work_unit_id: number | null;
  nip: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize seed data
    initializeSeedData();

    // Check for existing user session
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const users = storage.getUsers();
    const foundUser = users.find((u) => u.email === email && u.password === password);

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      storage.setCurrentUser(userWithoutPassword);
      return { success: true };
    }

    return { success: false, error: "Email atau password salah" };
  };

  const register = async (userData: any) => {
    const users = storage.getUsers();
    
    // Check if email already exists
    if (users.some((u) => u.email === userData.email)) {
      return { success: false, error: "Email sudah terdaftar" };
    }

    // Check if NIP already exists
    if (users.some((u) => u.nip === userData.nip)) {
      return { success: false, error: "NIP sudah terdaftar" };
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      role: "user_unit", // Default role
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    storage.setUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    storage.setCurrentUser(userWithoutPassword);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    storage.clearCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
