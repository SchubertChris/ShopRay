import { useState, useEffect, useCallback } from 'react';
import { getReviews } from '../api/reviewService';
import type { Review } from '../types/review.types';

export function useReviews(productId: string) {
  const [data,    setData]    = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getReviews(productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Bewertungen');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
