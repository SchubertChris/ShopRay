/** Welche Cookies der Benutzer erlaubt hat */
export interface ConsentState {
  /** Technisch notwendig — immer aktiv, nicht abschaltbar */
  necessary: true;
  /** Analyse-Cookies (z. B. Matomo, PostHog) */
  analytics: boolean;
  /** Marketing-Cookies (z. B. Meta Pixel, Google Ads) */
  marketing: boolean;
  /** Personalisierung (z. B. Wishlist-Sync, Empfehlungen) */
  preferences: boolean;
}

/** Speichert ob der Banner bereits gezeigt/beantwortet wurde */
export interface ConsentStore extends ConsentState {
  /** null = Benutzer hat noch keine Entscheidung getroffen */
  decidedAt: string | null;
  /** Banner manuell öffnen (z. B. vom Footer aus) */
  isOpen:    boolean;
  setAll:    (consent: Omit<ConsentState, 'necessary'>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  reset:     () => void;
  open:      () => void;
  close:     () => void;
}
