import { SeoMeta, LegalPage } from '@components/ui';

const TOC = [
  { id: 'geltungsbereich',  label: '§ 1 Geltungsbereich'    },
  { id: 'vertragsschluss',  label: '§ 2 Vertragsschluss'    },
  { id: 'preise',           label: '§ 3 Preise & Zahlung'   },
  { id: 'lieferung',        label: '§ 4 Lieferung'          },
  { id: 'widerruf',         label: '§ 5 Widerrufsrecht'     },
  { id: 'gewaehrleistung',  label: '§ 6 Gewährleistung'     },
  { id: 'haftung',          label: '§ 7 Haftung'            },
  { id: 'streit',           label: '§ 8 Streitbeilegung'    },
  { id: 'recht',            label: '§ 9 Anwendbares Recht'  },
];

export default function TermsPage() {
  return (
    <>
      <SeoMeta title="AGB" noIndex />
      <LegalPage title="Allgemeine Geschäftsbedingungen" eyebrow="Rechtliches" lastUpdated="Januar 2025" toc={TOC}>

        <h2 id="geltungsbereich">§ 1 Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die über unseren
          Online-Shop abgewickelt werden. Abweichende Bedingungen des Käufers werden nicht anerkannt.
        </p>

        <h2 id="vertragsschluss">§ 2 Vertragsschluss</h2>
        <p>
          Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar.
          Mit dem Absenden der Bestellung gibst du ein verbindliches Kaufangebot ab. Die Annahme
          erfolgt durch eine Auftragsbestätigung per E-Mail.
        </p>

        <h2 id="preise">§ 3 Preise und Zahlung</h2>
        <p>
          Alle angegebenen Preise sind Endpreise inklusive der gesetzlichen Mehrwertsteuer.
          Versandkosten werden im Bestellprozess separat ausgewiesen. Wir akzeptieren Kreditkarte,
          PayPal, Klarna, Sofortüberweisung und Apple Pay.
        </p>

        <h2 id="lieferung">§ 4 Lieferung</h2>
        <p>
          Die Lieferung erfolgt an die angegebene Lieferadresse. Lieferzeiten: Standard 3–5 Werktage,
          Express 1–2 Werktage. Bei Lieferverzögerungen informieren wir dich umgehend per E-Mail.
        </p>

        <h2 id="widerruf">§ 5 Widerrufsrecht</h2>
        <p>
          Du hast das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
          Die Widerrufsfrist beträgt 14 Tage ab dem Tag, an dem du oder ein von dir benannter Dritter,
          der nicht der Beförderer ist, die Waren in Besitz genommen hat.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, musst du uns mittels einer eindeutigen Erklärung
          (z.&nbsp;B. per E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren.
        </p>
        <blockquote>
          <strong>Muster-Widerrufsformular</strong><br />
          An: [FIRMENNAME], [ADRESSE], [EMAIL]<br /><br />
          Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf
          der folgenden Waren:<br />
          Bestellt am: ___________<br />
          Name: ___________<br />
          Anschrift: ___________<br />
          Datum: ___________
        </blockquote>
        <p>
          <strong>Folgen des Widerrufs:</strong> Wenn du diesen Vertrag widerrufst, haben wir dir
          alle Zahlungen unverzüglich und spätestens binnen 14 Tagen zurückzuzahlen.
          Du trägst die unmittelbaren Kosten der Rücksendung.
        </p>

        <h2 id="gewaehrleistung">§ 6 Gewährleistung</h2>
        <p>
          Es gelten die gesetzlichen Gewährleistungsrechte. Bei Mängeln hast du Anspruch auf
          Nacherfüllung, Minderung oder Rücktritt vom Vertrag.
        </p>

        <h2 id="haftung">§ 7 Haftungsbeschränkung</h2>
        <p>
          Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der
          Gesundheit sowie für vorsätzliche oder grob fahrlässige Pflichtverletzungen. Im Übrigen
          ist unsere Haftung ausgeschlossen.
        </p>

        <h2 id="streit">§ 8 Streitbeilegung</h2>
        <p>
          Wir sind nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2 id="recht">§ 9 Anwendbares Recht</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
        </p>

      </LegalPage>
    </>
  );
}
