import { useState, useEffect } from 'react';
import { SeoMeta, LegalPage } from '@components/ui';
import { API_BASE } from '@config/api';

interface ShippingSettings {
  standard:   number;
  express:    number;
  free_above: number;
  delivery:   string;
}

const DEFAULTS: ShippingSettings = { standard: 4.90, express: 9.90, free_above: 50, delivery: '2–4 Werktage' };

const TOC = [
  { id: 'versandkosten',  label: 'Versandkosten'        },
  { id: 'lieferzeiten',   label: 'Lieferzeiten'         },
  { id: 'versandpartner', label: 'Versandpartner'       },
  { id: 'rueckgabe',      label: 'Rückgabe & Widerruf' },
  { id: 'ausnahmen',      label: 'Ausnahmen'            },
  { id: 'beschaedigt',    label: 'Beschädigte Ware'     },
];

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ShippingPage() {
  const [s, setS] = useState<ShippingSettings>(DEFAULTS);

  useEffect(() => {
    fetch(`${API_BASE}/settings/shipping`)
      .then(r => r.ok ? r.json() : null)
      .then((data: ShippingSettings | null) => { if (data) setS(data); })
      .catch(() => { /* Fallback-Werte bleiben */ });
  }, []);

  return (
    <>
      <SeoMeta title="Versand & Rückgabe" noIndex />
      <LegalPage title="Versand & Rückgabe" eyebrow="Service" lastUpdated="Januar 2025" toc={TOC}>

        <h2 id="versandkosten">Versandkosten</h2>
        <p>
          Wir versenden innerhalb Deutschlands.{' '}
          {s.free_above > 0
            ? <>Ab einem Bestellwert von <strong>{fmt(s.free_above)} €</strong> ist der Versand kostenlos.
              Darunter berechnen wir eine Versandpauschale von <strong>{fmt(s.standard)} €</strong>.</>
            : <>Der Versand ist für alle Bestellungen kostenlos.</>
          }
        </p>

        <h2 id="lieferzeiten">Lieferzeiten</h2>
        <p>
          Bestellungen werden werktags (Mo–Fr) bearbeitet. Die Lieferzeit beträgt in der Regel{' '}
          <strong>{s.delivery}</strong> nach Zahlungseingang. Du erhältst eine
          Versandbestätigung mit Tracking-Link per E-Mail.
        </p>

        <h2 id="versandpartner">Versandpartner</h2>
        <p>
          Wir versenden aktuell mit <strong>DHL</strong>. Nach dem Versand erhältst du eine
          Tracking-Nummer, mit der du deine Sendung jederzeit verfolgen kannst.
        </p>

        <h2 id="rueckgabe">Rückgabe & Widerruf</h2>
        <p>
          Du hast das Recht, innerhalb von <strong>14 Tagen</strong> ohne Angabe von Gründen
          zurückzutreten (§ 355 BGB). Die Frist beginnt mit Erhalt der Ware.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, informiere uns per E-Mail an{' '}
          <a href="mailto:retoure@deine-domain.de">retoure@deine-domain.de</a> über deinen
          Entschluss. Wir senden dir dann eine Retourenbeschriftung zu.
        </p>
        <p>
          Bitte verpacke die Ware sorgfältig im Originalkarton. Nach Eingang und Prüfung der
          Retoure erstatten wir den Kaufpreis innerhalb von <strong>14 Tagen</strong> auf den
          ursprünglichen Zahlungsweg.
        </p>

        <h2 id="ausnahmen">Ausnahmen vom Widerrufsrecht</h2>
        <p>
          Das Widerrufsrecht gilt nicht für Waren, die nach Kundenspezifikation angefertigt
          wurden, sowie für Waren, die aus hygienischen Gründen nach der Lieferung nicht
          zurückgegeben werden können (z. B. versiegelte Körperpflegeprodukte).
        </p>

        <h2 id="beschaedigt">Beschädigte oder falsche Ware</h2>
        <p>
          Falls du beschädigte oder falsche Ware erhalten hast, wende dich bitte innerhalb
          von <strong>48 Stunden</strong> mit Fotos an{' '}
          <a href="mailto:hello@deine-domain.de">hello@deine-domain.de</a>.
          Wir kümmern uns umgehend.
        </p>

      </LegalPage>
    </>
  );
}
