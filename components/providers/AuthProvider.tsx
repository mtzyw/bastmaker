"use client";

import { event as trackAnalyticsEvent } from "@/gtag";
import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/client";
import { type AuthError, type Session, type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type ExtendedUser = User & {
  role: "admin" | "user";
};

type AuthContextType = {
  user: ExtendedUser | null;
  loading: boolean;
  signInWithGoogle: (next?: string) => Promise<{ error: AuthError | null }>;
  signInWithGithub: (next?: string) => Promise<{ error: AuthError | null }>;
  signInWithEmail: (
    email: string,
    captchaToken?: string,
    next?: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareHandled, setShareHandled] = useState(false);
  const lastSessionTokenRef = useRef<string | null>(null);

  const supabase = createClient();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role || "user";
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return "user";
    }
  };

  const handleUser = async (user: User | null) => {
    try {
      if (user) {
        const role = await fetchUserRole(user.id);
        setUser({
          ...user,
          role: role as "admin" | "user",
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error in handleUser:", error);
      if (user) {
        setUser({
          ...user,
          role: "user",
        });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const AUTH_TRACKED_SESSION_KEY = "auth:lastTrackedSessionToken";

  const getTrackedSessionToken = () => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(AUTH_TRACKED_SESSION_KEY);
  };

  const setTrackedSessionToken = (token: string | null) => {
    if (typeof window === "undefined") {
      return;
    }
    if (token) {
      window.localStorage.setItem(AUTH_TRACKED_SESSION_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TRACKED_SESSION_KEY);
    }
  };

  const trackAuthEvent = (action: "sign_in" | "sign_up", label: string) => {
    trackAnalyticsEvent({
      action,
      category: "auth",
      label,
      value: 1,
    });
  };

  const normalizeProviderLabel = (provider?: string | null) => {
    if (!provider) {
      return "unknown";
    }
    if (provider === "email") {
      return "password";
    }
    return provider;
  };

  const maybeTrackOAuthSignUp = (session: Session) => {
    const provider = session.user?.app_metadata?.provider;
    if (!provider || provider === "email") {
      return;
    }
    if (
      session.user?.created_at &&
      session.user?.last_sign_in_at &&
      session.user.created_at === session.user.last_sign_in_at
    ) {
      trackAuthEvent("sign_up", provider);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      handleUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        lastSessionTokenRef.current = null;
        setTrackedSessionToken(null);
        handleUser(null);
        return;
      }

      if (event === "SIGNED_IN" && session?.access_token) {
        const storedToken = getTrackedSessionToken();
        if (session.access_token === storedToken) {
          lastSessionTokenRef.current = session.access_token;
          handleUser(session.user);
          return;
        }

        maybeTrackOAuthSignUp(session);
        const providerLabel = normalizeProviderLabel(
          session.user?.app_metadata?.provider
        );
        trackAuthEvent("sign_in", providerLabel);
        lastSessionTokenRef.current = session.access_token;
        setTrackedSessionToken(session.access_token);
        handleUser(session.user);
        return;
      }

      if (
        (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") &&
        session?.access_token
      ) {
        lastSessionTokenRef.current = session.access_token;
        setTrackedSessionToken(session.access_token);
      }

      handleUser(session?.user || null);
    });

    const userSubscription = supabase
      .channel("public:users")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user?.id}`,
        },
        async (payload) => {
          setUser((prevUser) => {
            if (prevUser) {
              return {
                ...prevUser,
                role: payload.new.role,
              };
            }
            return prevUser;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      userSubscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setShareHandled(false);
      return;
    }

    if (shareHandled) {
      return;
    }

    let active = true;

    fetch('/api/share/consume', { method: 'POST' })
      .catch((error) => {
        console.error('[share-consume] API call failed', error);
      })
      .finally(() => {
        if (active) {
          setShareHandled(true);
        }
      });

    return () => {
      active = false;
    };
  }, [user, shareHandled]);

  const signInWithGoogle = async (next?: string) => {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${
          next || ""
        }`,
      },
    });
  };

  const signInWithGithub = async (next?: string) => {
    return await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${
          next || ""
        }`,
      },
    });
  };

  const signInWithEmail = async (
    email: string,
    captchaToken?: string,
    next?: string
  ) => {
    return await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${
          next || ""
        }`,
        captchaToken,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTrackedSessionToken(null);
    lastSessionTokenRef.current = null;
    redirect("/");
  };

  const refreshUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await handleUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithGithub,
        signInWithEmail,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
