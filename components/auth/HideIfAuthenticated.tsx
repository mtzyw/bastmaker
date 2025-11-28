"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ReactNode, useEffect, useState } from "react";

export function HideIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, we render the content to avoid hydration mismatch
  // if the server rendered it (assuming server thinks user is not logged in).
  // However, to prevent flashing, if we are loading, we might want to show nothing or show content?
  // If we show content and then hide it, it's a flash.
  // If we show nothing and then show content, it's a flash for non-logged in users.
  // Since this is "detail content" at the bottom, showing it by default (SSR) is better for SEO.
  // Then we hide it if logged in.

  if (!mounted) {
    return <>{children}</>;
  }

  if (loading) {
    // While loading auth state, keep showing content to avoid layout shift for guests
    return <>{children}</>;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
