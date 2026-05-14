import { useState } from 'react';

interface MutationResult<TPayload, TResult> {
  mutate:  (payload: TPayload) => Promise<TResult>;
  loading: boolean;
  error:   string | null;
  reset:   () => void;
}

/**
 * Leichtgewichtiger Mutation-Hook für POST / PUT / DELETE Requests.
 * Für produktionsreifes Caching TanStack Query als Drop-in nutzen.
 *
 * @param mutationFn  Async-Funktion die den Request ausführt
 */
export function useMutation<TPayload, TResult>(
  mutationFn: (payload: TPayload) => Promise<TResult>,
): MutationResult<TPayload, TResult> {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const mutate = async (payload: TPayload): Promise<TResult> => {
    setLoading(true);
    setError(null);
    try {
      return await mutationFn(payload);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Fehler';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, reset: () => setError(null) };
}
