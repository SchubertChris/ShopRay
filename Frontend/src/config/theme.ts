export type Palette = 'sage' | 'navy' | 'terra' | 'electric';
export type ThemeMode = 'light' | 'dark';

export const PALETTES: { id: Palette; label: string; color: string }[] = [
  { id: 'sage',     label: 'Sage Green',  color: '#4a6b5d' },
  { id: 'navy',     label: 'Navy Gold',   color: '#1e293b' },
  { id: 'terra',    label: 'Terra',       color: '#bc6c25' },
  { id: 'electric', label: 'Electric',    color: '#3b82f6' },
];

