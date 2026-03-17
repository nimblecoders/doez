"use client";

import { useEffect, useState } from "react";

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "user";
  expiresAt: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setSession(data.data);
        } else {
          setSession(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch session");
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { session, loading, error };
}

export function useIsAdmin() {
  const { session, loading } = useSession();
  return { isAdmin: session?.role === "admin", loading };
}

export function useAuth() {
  const { session, loading } = useSession();
  return { isAuthenticated: !!session, session, loading };
}
