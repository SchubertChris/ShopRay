import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Palette = 'sage' | 'navy' | 'terra' | 'electric';
type Mode    = 'light' | 'dark';

interface ThemeContextValue {
  palette:      Palette;
  mode:         Mode;
  setPalette:   (p: Palette) => void;
  toggleMode:   () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(() =>
    (localStorage.getItem('admin-palette') as Palette) ?? 'sage'
  );
  const [mode, setMode] = useState<Mode>(() =>
    (localStorage.getItem('admin-mode') as Mode) ?? 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', `${palette}-${mode}`);
    localStorage.setItem('admin-palette', palette);
    localStorage.setItem('admin-mode', mode);
  }, [palette, mode]);

  const setPalette = (p: Palette) => setPaletteState(p);
  const toggleMode = () => setMode(m => m === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ palette, mode, setPalette, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
