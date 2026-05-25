export type Palette = 'sage' | 'navy' | 'terra' | 'electric' | 'gold';
export type ThemeMode = 'light' | 'dark';

export const PALETTES: { id: Palette; label: string; color: string }[] = [
  { id: 'sage',     label: 'Sage Green',  color: '#4a6b5d' },
  { id: 'navy',     label: 'Navy Gold',   color: '#1e293b' },
  { id: 'terra',    label: 'Terra',       color: '#bc6c25' },
  { id: 'electric', label: 'Electric',    color: '#3b82f6' },
  { id: 'gold',     label: 'Candlescope', color: '#C9A84C' },
];

