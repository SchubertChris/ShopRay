import { useState } from 'react';

export type ViewMode = 'table' | 'grid';

export function useViewMode(
  storageKey: string,
  defaultMode: ViewMode = 'table',
): [ViewMode, () => void] {
  const [mode, setMode] = useState<ViewMode>(
    () => (localStorage.getItem(storageKey) as ViewMode | null) ?? defaultMode,
  );

  const toggle = () =>
    setMode(prev => {
      const next: ViewMode = prev === 'table' ? 'grid' : 'table';
      localStorage.setItem(storageKey, next);
      return next;
    });

  return [mode, toggle];
}
