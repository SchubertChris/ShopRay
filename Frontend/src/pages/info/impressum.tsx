import { SeoMeta, LegalPage } from '@components/ui';
import { APP_COMPANY, APP_CONTACT } from '@config/app';

const TOC = [
  { id: 'anbieter',       label: 'Anbieter'          },
  { id: 'kontakt',        label: 'Kontakt'            },
  { id: 'ust',            label: 'Umsatzsteuer-ID'    },
  { id: 'verantwortlich', label: 'Verantwortlicher'   },
  { id: 'streit',         label: 'Streitschlichtung'  },
];

export default function ImpressumPage() {
  return (
    <>
      <SeoMeta title="Impressum" noIndex />
      <LegalPage title="Impressum" eyebrow="Rechtliches" lastUpdated="Januar 2025" toc={TOC}>

        <h2 id="anbieter">Anbieter</h2>
        <p>
          {APP_COMPANY.owner}<br />
          {APP_COMPANY.street}<br />
          {APP_COMPANY.zip} {APP_COMPANY.city}<br />
          {APP_COMPANY.country}
        </p>

        <h2 id="kontakt">Kontakt</h2>
        <p>
          E-Mail: {APP_CONTACT.email}<br />
          Telefon: {APP_CONTACT.phone}
        </p>

        <h2 id="ust">Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß §27a UStG: {APP_COMPANY.ustId}</p>

        <h2 id="verantwortlich">Verantwortlich für den Inhalt</h2>
        <p>
          {APP_COMPANY.owner}, {APP_COMPANY.street}, {APP_COMPANY.zip} {APP_COMPANY.city}
        </p>

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
