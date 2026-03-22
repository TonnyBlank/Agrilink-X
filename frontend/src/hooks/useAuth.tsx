import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { apiFetch } from "@/lib/api";
import { clearStoredRole, getStoredRole, setStoredRole } from "@/lib/subscription";

type AppRole = Database["public"]["Enums"]["app_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setActiveRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  setActiveRole: () => {},
});

async function loadProfileFromSupabase(userId: string, fallbackFullName?: string | null) {
  let { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profileData) {
    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert({ user_id: userId, full_name: fallbackFullName || null })
      .select("*")
      .single();

    if (createError) throw createError;
    profileData = createdProfile;
  }

  return profileData;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const { data: authUserData } = await supabase.auth.getUser();
    const fallbackFullName =
      typeof authUserData.user?.user_metadata?.full_name === "string"
        ? authUserData.user.user_metadata.full_name
        : null;

    try {
      const data = await apiFetch<{ profile: Profile; role: AppRole | null }>("/profiles/me");
      setProfile(data.profile);
      if (data.role) {
        setRole(data.role);
        setStoredRole(userId, data.role);
      } else {
        const localRole = getStoredRole(userId);
        setRole(localRole || "farmer_free");
      }
    } catch (error) {
      console.error("Failed to load auth context from API, falling back to Supabase", error);

      try {
        const profileData = await loadProfileFromSupabase(userId, fallbackFullName);
        setProfile(profileData);

        const localRole = getStoredRole(userId);
        setRole(localRole || "farmer_free");
      } catch (fallbackError) {
        console.error("Failed to load auth context from Supabase", fallbackError);
        setProfile(null);
        setRole(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  const setActiveRole = (nextRole: AppRole) => {
    setRole(nextRole);

    if (user) {
      setStoredRole(user.id, nextRole);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => {
          void fetchUserData(nextSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void fetchUserData(currentSession.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (user) {
      clearStoredRole(user.id);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut, refreshProfile, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
