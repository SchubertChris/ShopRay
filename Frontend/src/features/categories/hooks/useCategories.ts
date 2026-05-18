import { useState, useEffect } from 'react';
import { getCategories, type Category } from '../api/categoryService';

export function useCategories() {
  const [data,    setData]    = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
