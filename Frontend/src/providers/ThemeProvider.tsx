import { createContext, useContext, useState, useLayoutEffect, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { type Palette, type ThemeMode } from '../config/theme';

interface ThemeCtx {
  palette:     Palette;
  mode:        ThemeMode;
  setPalette:  (p: Palette) => void;
  toggleMode:  () => void;
}

const ThemeContext = createContext<ThemeCtx>({} as ThemeCtx);

// Typesafe wrapper — View Transitions API ist noch nicht in allen TS-Versionen typisiert
const vtDoc = document as Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function withTransition(callback: () => void) {
  if (!vtDoc.startViewTransition) {
    callback();
    return;
  }
  vtDoc.startViewTransition(() => flushSync(callback));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(
    () => (localStorage.getItem('sr-palette') as Palette) ?? 'sage'
  );
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem('sr-mode') as ThemeMode) ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // useLayoutEffect: läuft synchron im Commit-Phase (vor Paint) — damit data-theme
  // gesetzt ist bevor View Transitions den neuen State captured (flushSync-kompatibel)
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', `${palette}-${mode}`);
    localStorage.setItem('sr-palette', palette);
    localStorage.setItem('sr-mode', mode);

    // requestAnimationFrame: stellt sicher dass der Browser die CSS-Cascade
    // (data-theme → --clr-background) vollständig angewendet hat bevor wir lesen.
    // querySelectorAll: aktualisiert BEIDE theme-color Meta-Tags (mit und ohne media-Query),
    // damit der Browser-Chrome auf allen OS-Modes live die richtige Farbe zeigt.
    requestAnimationFrame(() => {
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--clr-background').trim();
      if (!bg) return;
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach(m => { m.content = bg; });
    });
  }, [palette, mode]);

  function setPalette(p: Palette) {
    withTransition(() => setPaletteState(p));
  }

  function toggleMode() {
    withTransition(() => setMode(m => m === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ palette, mode, setPalette, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
