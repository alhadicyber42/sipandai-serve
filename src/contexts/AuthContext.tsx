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

export interface EmploymentHistory {
  jabatan: string;
  tmt: string;
}

export interface MutationHistory {
  jenis_mutasi: string;
  tmt: string;
}

export interface DocumentItem {
  name: string;
  url: string;
}

export interface User extends Profile {
  id: string;
  email: string;
  jabatan?: string;
  pangkat_golongan?: string;
  tmt_pns?: string;
  tmt_pensiun?: string;
  riwayat_jabatan?: EmploymentHistory[];
  riwayat_mutasi?: MutationHistory[];
  documents?: Record<string, string | string[] | DocumentItem | DocumentItem[]>;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
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
      // Try to get role from user_roles table first
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle();

      // Fallback to profile.role if user_roles query fails or returns nothing
      const userRole = roleError ? profile.role : (roleData?.role || profile.role || "user_unit");

      // Get metadata from auth user
      const metadata = authUser.user_metadata || {};

      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: profile.name,
        role: userRole,
        work_unit_id: profile.work_unit_id,
        nip: profile.nip,
        phone: profile.phone,
        // Load additional fields from metadata
        jabatan: metadata.jabatan,
        pangkat_golongan: metadata.pangkat_golongan,
        tmt_pns: metadata.tmt_pns,
        tmt_pensiun: metadata.tmt_pensiun,
        riwayat_jabatan: metadata.riwayat_jabatan,
        riwayat_mutasi: metadata.riwayat_mutasi,
        documents: metadata.documents,
        avatar_url: metadata.avatar_url,
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
            // Store additional fields in metadata
            jabatan: userData.jabatan,
            pangkat_golongan: userData.pangkat_golongan,
            tmt_pns: userData.tmt_pns,
            tmt_pensiun: userData.tmt_pensiun,
            riwayat_jabatan: userData.riwayat_jabatan,
            riwayat_mutasi: userData.riwayat_mutasi,
            documents: {},
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

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error("No user logged in");

      // 1. Update Supabase Auth Metadata (for new fields)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          jabatan: data.jabatan,
          pangkat_golongan: data.pangkat_golongan,
          tmt_pns: data.tmt_pns,
          tmt_pensiun: data.tmt_pensiun,
          riwayat_jabatan: data.riwayat_jabatan,
          riwayat_mutasi: data.riwayat_mutasi,
          documents: data.documents,
          // Also sync basic info to metadata as backup
          name: data.name,
          nip: data.nip,
          phone: data.phone,
          work_unit_id: data.work_unit_id,
        }
      });

      if (authError) throw authError;

      // 2. Update profiles table (for basic info)
      // We attempt this, but if it fails due to RLS, we still have metadata
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          nip: data.nip,
          work_unit_id: data.work_unit_id,
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn("Profile table update failed, falling back to metadata:", profileError);
      }

      // 3. Update local state
      setUser((prev) => prev ? ({ ...prev, ...data }) : null);

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
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, isLoading }}>
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
