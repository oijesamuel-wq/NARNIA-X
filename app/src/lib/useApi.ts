"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type Metrics, type CreditProfile, type AgentList, type IndexedEvent } from "./api";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, error, loading, refresh };
}

/** Protocol-level metrics from the backend */
export function useMetrics() {
  return useAsync<Metrics>(() => api.getMetrics());
}

/** Full credit profile for an address */
export function useCreditProfile(address: string | undefined) {
  return useAsync<CreditProfile>(
    () => (address ? api.getCreditProfile(address) : Promise.reject("no address")),
    [address],
  );
}

/** List of all registered agents */
export function useAgentList() {
  return useAsync<AgentList>(() => api.getAgents());
}

/** Recent events, optionally filtered by type */
export function useEvents(type?: string, limit = 50) {
  return useAsync<IndexedEvent[]>(() => api.getEvents(type, limit), [type, limit]);
}
