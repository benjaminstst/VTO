"use client";

import { useState, useCallback } from "react";

interface UseClientTokenReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  fetchToken: () => Promise<string>;
}

export function useClientToken(): UseClientTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/vto/token", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Token request failed (${res.status})`);
      }
      const data = await res.json();
      const apiKey = data.apiKey as string;
      setToken(apiKey);
      return apiKey;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get session token";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { token, loading, error, fetchToken };
}
