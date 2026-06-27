import { PALETTES } from '@config/theme';
import type { Palette, ThemeMode } from '@config/theme';

interface ThemeDockProps {
  open:       boolean;
  onToggle:   () => void;
  palette:    Palette;
  mode:       ThemeMode;
  setPalette: (p: Palette) => void;
  toggleMode: () => void;
}

export function ThemeDock({ open, onToggle, palette, mode, setPalette, toggleMode }: ThemeDockProps) {
  return (
    <div className={`theme-dock${open ? ' is-open' : ''}`}>
      <button
        className="theme-dock__trigger"
        onClick={onToggle}
        aria-label="Theme wechseln"
      >
        <span className="theme-dock__dot" />
        <span className="theme-dock__label">Themes</span>
      </button>
      {open && (
        <div className="theme-panel">
          <p className="theme-panel__title">Farbpalette</p>
          <div className="theme-panel__palettes">
            {PALETTES.map(p => (
              <button
                key={p.id}
                className={`theme-panel__swatch${palette === p.id ? ' is-active' : ''}`}
                onClick={() => setPalette(p.id)}
              >
                <span className="theme-panel__swatch-dot" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
          <div className="theme-panel__divider" />
          <button className="theme-panel__mode-btn" onClick={toggleMode}>
            {mode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      )}
    </div>
  );
}
