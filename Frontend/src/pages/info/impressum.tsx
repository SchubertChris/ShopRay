import { SeoMeta, LegalPage } from '@components/ui';

const TOC = [
  { id: 'anbieter',         label: 'Anbieter'           },
  { id: 'kontakt',          label: 'Kontakt'             },
  { id: 'ust',              label: 'Umsatzsteuer-ID'     },
  { id: 'verantwortlich',   label: 'Verantwortlicher'    },
  { id: 'streit',           label: 'Streitschlichtung'   },
];

export default function ImpressumPage() {
  return (
    <>
      <SeoMeta title="Impressum" noIndex />
      <LegalPage title="Impressum" eyebrow="Rechtliches" lastUpdated="Januar 2025" toc={TOC}>

        <h2 id="anbieter">Anbieter</h2>
        <p>
          Max Mustermann<br />
          Musterstraße 1<br />
          12345 Musterstadt<br />
          Deutschland
        </p>

        <h2 id="kontakt">Kontakt</h2>
        <p>
          E-Mail: hallo@Concepts.de<br />
          Telefon: +49 (0) 123 456 789
        </p>

        <h2 id="ust">Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß §27a UStG: DE 123 456 789</p>

        <h2 id="verantwortlich">Verantwortlich für den Inhalt</h2>
        <p>Max Mustermann, Musterstraße 1, 12345 Musterstadt</p>

        <h2 id="streit">Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
            ec.europa.eu/consumers/odr/
          </a>
          . Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>

      </LegalPage>
    </>
  );
}
