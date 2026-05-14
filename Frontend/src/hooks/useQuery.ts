import { useState, useEffect } from 'react';

interface QueryResult<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

/**
 * Leichtgewichtiger Datenfetch-Hook.
 * Für produktionsreifes Caching TanStack Query als Drop-in nutzen.
 *
 * @param fetchFn  Async-Funktion die die Daten lädt
 * @param deps     Abhängigkeiten — bei Änderung wird neu geladen
 */
export function useQuery<T>(fetchFn: () => Promise<T>, deps: unknown[] = []): QueryResult<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(d  => { if (!cancelled) { setData(d);              setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e?.message ?? 'Fehler beim Laden'); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
