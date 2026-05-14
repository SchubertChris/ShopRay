import { useState, useCallback } from 'react';

/**
 * Wie useState, aber mit localStorage-Persistenz.
 * Gut für Einstellungen, die den Browser-Refresh überleben sollen.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (value: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setStored(value);
      } catch { /* ignore QuotaExceededError */ }
    },
    [key],
  );

  return [stored, set];
}
