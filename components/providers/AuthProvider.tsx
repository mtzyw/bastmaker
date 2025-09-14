"use client";

import { normalizeEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/client";
import { type AuthError, type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      handleUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
