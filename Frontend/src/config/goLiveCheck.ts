// ═══════════════════════════════════════════════════════════════════════════
// GO-LIVE-CHECK — warnt im Dev-Modus vor verbliebenen Template-Platzhaltern
//
// Die Rechts- und Kontaktdaten aus app.ts landen automatisch in Impressum,
// Datenschutz, Widerruf und Footer. Mit Platzhaltern wie "Max Mustermann" oder
// "deine-domain.de" live zu gehen verletzt in Deutschland die Impressumspflicht
// (§5 DDG) → Abmahnrisiko. Diese Funktion erinnert den Template-Käufer beim
// Entwickeln daran, sie zu ersetzen.
//
// Läuft NUR im Dev-Modus (import.meta.env.DEV). Im Production-Build wird der
// Aufruf weg-tree-shaken — keine Konsolenausgabe, kein Verhalten beim Endkunden.
// ═══════════════════════════════════════════════════════════════════════════

import { APP_URL, APP_COMPANY, APP_CONTACT } from './app';

/** Ein Feld, das noch einen Template-Platzhalter enthält. */
interface Placeholder {
  field: string;
  value: string;
}

/** Liefert alle Config-Felder, die noch einen bekannten Platzhalter enthalten. */
export function findLegalPlaceholders(): Placeholder[] {
  const found: Placeholder[] = [];
  const check = (field: string, value: string, marker: RegExp): void => {
    if (marker.test(value)) found.push({ field, value });
  };

  check('APP_URL',            APP_URL,            /deine-domain\.de/i);
  check('APP_COMPANY.owner',  APP_COMPANY.owner,  /mustermann/i);
  check('APP_COMPANY.street', APP_COMPANY.street, /musterstra(ß|ss)e/i);
  check('APP_COMPANY.city',   APP_COMPANY.city,   /musterstadt/i);
  check('APP_COMPANY.ustId',  APP_COMPANY.ustId,  /123\s*456\s*789/);
  check('APP_CONTACT.email',  APP_CONTACT.email,  /deine-domain\.de/i);
  check('APP_CONTACT.phone',  APP_CONTACT.phone,  /000\s*000/);
  check('APP_CONTACT.address', APP_CONTACT.address, /musterstra(ß|ss)e|musterstadt/i);

  return found;
}

/** Gibt im Dev-Modus eine Warnung aus, wenn noch Platzhalter vorhanden sind. */
export function warnOnLegalPlaceholders(): void {
  if (!import.meta.env.DEV) return;

  const placeholders = findLegalPlaceholders();
  if (placeholders.length === 0) return;

  console.warn(
    `%c⚠ ShopRay Go-Live-Check — ${placeholders.length} Platzhalter in src/config/app.ts`,
    'color:#b91c1c;font-weight:bold;font-size:13px',
  );
  console.warn(
    'Diese Felder erscheinen in Impressum / Datenschutz / Footer. Vor dem Live-Gang ersetzen ' +
    '(sonst Impressumspflicht §5 DDG / Abmahnrisiko):',
  );
  placeholders.forEach(p => console.warn(`   • ${p.field} = "${p.value}"`));
}
