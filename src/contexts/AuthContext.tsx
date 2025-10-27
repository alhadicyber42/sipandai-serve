import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  name: string;
  role: string;
  work_unit_id: number | null;
  nip: string;
  phone: string | null;
}

interface User extends Profile {
  id: string;
  email: string;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setTimeout(() => {
          loadUserProfile(newSession.user);
        }, 0);
      } else {
        setUser(null);
      }
    });

    // THEN check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profile) {
      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: profile.name,
        role: profile.role,
        work_unit_id: profile.work_unit_id,
        nip: profile.nip,
        phone: profile.phone,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: "user_unit",
            work_unit_id: userData.work_unit_id,
            nip: userData.nip,
            phone: userData.phone,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
