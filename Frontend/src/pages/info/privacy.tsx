import { SeoMeta, LegalPage } from '@components/ui';
import { APP_COMPANY, APP_CONTACT } from '@config/app';

const TOC = [
  { id: 'verantwortlicher',    label: '1. Verantwortlicher'          },
  { id: 'erhebung',            label: '2. Erhebung & Verarbeitung'   },
  { id: 'zweck',               label: '3. Zweck der Datenverarbeitung' },
  { id: 'auftragsverarbeiter', label: '4. Auftragsverarbeiter'       },
  { id: 'weitergabe',          label: '5. Weitergabe an Dritte'      },
  { id: 'cookies',             label: '6. Cookies'                   },
  { id: 'rechte',              label: '7. Deine Rechte'              },
  { id: 'speicherdauer',       label: '8. Speicherdauer'             },
  { id: 'beschwerde',          label: '9. Beschwerderecht'           },
];

export default function PrivacyPage() {
  return (
    <>
      <SeoMeta title="Datenschutz" noIndex />
      <LegalPage title="Datenschutzerklärung" eyebrow="Rechtliches" lastUpdated="Januar 2025" toc={TOC}>

        <h2 id="verantwortlicher">1. Verantwortlicher</h2>
        <p>
          {APP_COMPANY.owner}<br />
          {APP_COMPANY.street}, {APP_COMPANY.zip} {APP_COMPANY.city}<br />
          E-Mail: {APP_CONTACT.email}
        </p>

        <h2 id="erhebung">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
        <p>
          Wir erheben personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Dienste
          erforderlich ist oder du uns diese freiwillig mitteilst. Dazu gehören Name, E-Mail-Adresse,
          Lieferadresse und Zahlungsinformationen bei Bestellungen.
        </p>

        <h2 id="zweck">3. Zweck der Datenverarbeitung</h2>
        <p>
          Deine Daten werden ausschließlich zur Auftragsabwicklung, Kundenkommunikation und — mit
          deiner Einwilligung — zum Versand unseres Newsletters verwendet.
        </p>

        <h2 id="auftragsverarbeiter">4. Auftragsverarbeiter (Art. 28 DSGVO)</h2>
        <p>
          Wir setzen folgende Dienstleister ein, mit denen Auftragsverarbeitungsverträge (AVV) gemäß
          Art. 28 DSGVO geschlossen wurden. Alle Dienstleister verarbeiten Daten ausschließlich in
          der EU oder in Ländern mit angemessenem Datenschutzniveau.
        </p>

        <div className="privacy-processors">
          <div className="privacy-processor">
            <div className="privacy-processor__name">Supabase Inc.</div>
            <div className="privacy-processor__tags">
              <span className="privacy-processor__tag">Datenbank</span>
              <span className="privacy-processor__tag">Authentifizierung</span>
              <span className="privacy-processor__tag">EU-Region</span>
            </div>
            <p className="privacy-processor__desc">
              Speicherung von Kundendaten, Bestellungen, Tickets. Server-Region: Frankfurt (eu-central-1).
              Datenschutzerklärung: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
            </p>
          </div>
          <div className="privacy-processor">
            <div className="privacy-processor__name">Stripe Inc.</div>
            <div className="privacy-processor__tags">
              <span className="privacy-processor__tag">Zahlungsabwicklung</span>
              <span className="privacy-processor__tag">PCI-DSS</span>
            </div>
            <p className="privacy-processor__desc">
              Verarbeitung von Zahlungsdaten (Kreditkarte, SEPA, etc.). Stripe speichert
              Zahlungsinformationen — wir erhalten nur ein Token, keine Rohdaten.
              Datenschutzerklärung: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">stripe.com/de/privacy</a>
            </p>
          </div>
          <div className="privacy-processor">
            <div className="privacy-processor__name">E-Mail-Dienstleister (Platzhalter)</div>
            <div className="privacy-processor__tags">
              <span className="privacy-processor__tag">Transaktionale E-Mails</span>
            </div>
            <p className="privacy-processor__desc">
              Versand von Bestellbestätigungen, Passwort-Zurücksetzen und System-Benachrichtigungen.
              Empfohlen: Resend, Postmark oder AWS SES (EU-Region).
            </p>
          </div>
          <div className="privacy-processor">
            <div className="privacy-processor__name">Hosting-Anbieter (Platzhalter)</div>
            <div className="privacy-processor__tags">
              <span className="privacy-processor__tag">Infrastruktur</span>
              <span className="privacy-processor__tag">Server-Logs</span>
            </div>
            <p className="privacy-processor__desc">
              Betrieb des Webservers und CDN. Server-Logs (IP-Adressen) werden für max. 7 Tage
              gespeichert und danach automatisch gelöscht. Empfohlen: Vercel, Hetzner oder Fly.io (EU).
            </p>
          </div>
        </div>

        <h2 id="weitergabe">5. Weitergabe an sonstige Dritte</h2>
        <p>
          Eine Weitergabe deiner Daten zu Werbezwecken findet nicht statt. Daten werden nur im
          Rahmen der oben genannten Auftragsverarbeitung oder bei gesetzlicher Verpflichtung
          (z.&nbsp;B. Steuerbehörden) weitergegeben.
        </p>

        <h2 id="cookies">6. Cookies und lokale Speicherung</h2>
        <p>
          Wir setzen technisch notwendige Cookies und Browser-Speicher (localStorage) ein, die für
          den Betrieb des Shops erforderlich sind — z.&nbsp;B. für Warenkorb, Wunschliste und
          Login-Session. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
          bzw. § 25 Abs. 2 TTDSG.
        </p>
        <p>
          Optionale Kategorien (Analyse, Marketing, Präferenzen) werden ausschließlich mit deiner
          ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TTDSG) aktiviert.
          Du kannst deine Einwilligung jederzeit widerrufen — nutze dazu den Link
          „Cookie-Einstellungen" im Footer dieser Seite.
        </p>

        <h2 id="rechte">7. Deine Rechte</h2>
        <p>
          Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung sowie Datenübertragbarkeit. Wende dich dafür an {APP_CONTACT.email}.
        </p>

        <h2 id="speicherdauer">8. Speicherdauer</h2>
        <p>
          Personenbezogene Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt und
          keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>

        <h2 id="beschwerde">9. Beschwerderecht</h2>
        <p>
          Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde über die Verarbeitung
          deiner personenbezogenen Daten zu beschweren.
        </p>

      </LegalPage>
    </>
  );
}
