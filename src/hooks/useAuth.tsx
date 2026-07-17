import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api";

// Compatibility shape so existing components that read `user.uid`,
// `user.email`, and `user.emailVerified` keep working after the Firebase → Cloud Auth swap.
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  raw: SupabaseUser;
}

const toAuthUser = (u: SupabaseUser | null): AuthUser | null =>
  u
    ? {
        uid: u.id,
        email: u.email ?? null,
        emailVerified: !!u.email_confirmed_at,
        displayName:
          (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.name as string | undefined) ??
          null,
        photoURL:
          (u.user_metadata?.avatar_url as string | undefined) ??
          (u.user_metadata?.picture as string | undefined) ??
          null,
        raw: u,
      }
    : null;

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  phonepe_details: string | null;
  current_streak: number;
  lifetime_reviews: number;
  fcm_token: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
  hasPhonePeDetails: boolean;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isEmailVerified: false,
  hasPhonePeDetails: false,
  signOut: async () => {},
  resendVerification: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const isEmailVerified = user?.emailVerified || false;
  const hasPhonePeDetails = !!userProfile?.phonepe_details;

  const fetchProfile = async (_uid: string, email: string | null) => {
    if (!email) return null;
    try {
      const data = await apiFetch('/api/user/profile');
      setUserProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = toAuthUser(session?.user ?? null);
      setUser(next);
      setLoading(false);
      if (next) {
        // defer to avoid deadlock inside the auth callback
        setTimeout(() => { fetchProfile(next.uid, next.email); }, 0);
      } else {
        setUserProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const next = toAuthUser(session?.user ?? null);
      setUser(next);
      setLoading(false);
      if (next) fetchProfile(next.uid, next.email);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const resendVerification = async () => {
    if (user?.email) {
      await supabase.auth.resend({ type: "signup", email: user.email });
    }
  };

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isAdmin, 
      isEmailVerified, 
      hasPhonePeDetails,
      signOut,
      resendVerification,
      resetPassword,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
