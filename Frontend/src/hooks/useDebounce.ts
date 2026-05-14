import { useState, useEffect } from 'react';

/**
 * Verzögert Wert-Updates um `delay` ms.
 * Verhindert bei der Suche übermäßige API-Calls bei jedem Tastendruck.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
