import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

// ── DATA ──────────────────────────────────────────────────────────────────────

const CHANNELS = [
  {
    id:    'email',
    tag:   '01',
    title: 'E-Mail',
    sub:   'Antwort in 24 h',
    body:  'Schreib uns direkt. Wir antworten innerhalb eines Werktages — persönlich, nicht automatisiert.',
    cta:   'Nachricht schreiben',
    to:    ROUTES.INFO.CONTACT,
  },
  {
    id:    'phone',
    tag:   '02',
    title: 'Hotline',
    sub:   'Mo – Fr · 09 – 17 Uhr',
    body:  '+49 30 000 000 00',
    cta:   'Jetzt anrufen',
    href:  'tel:+4930000000',
  },
  {
    id:    'chat',
    tag:   '03',
    title: 'Live-Chat',
    sub:   'Sofort verfügbar',
    body:  'Direkter Kontakt ohne Wartezeit. Verbinde deinen Chat-Anbieter an dieser Stelle.',
    cta:   'Chat starten',
    to:    ROUTES.SUPPORT.CHAT,
  },
  {
    id:    'web',
    tag:   '04',
    title: 'Support-Portal',
    sub:   'Tickets & Verlauf',
    body:  'Alle Anfragen, Status-Updates und dein Kommunikationsverlauf an einem Ort.',
    cta:   'Zum Portal',
    to:    ROUTES.SUPPORT.PORTAL,
  },
];

const FAQ_ITEMS = [
  { cat: 'Versand',    q: 'Wie lange dauert die Lieferung?',              a: 'Standard 3–5 Werktage, Express 1–2 Werktage. Ab 50 € Bestellwert kostenfrei.' },
  { cat: 'Versand',    q: 'Liefert ihr ins Ausland?',                     a: 'Ja, wir liefern in alle EU-Länder. Lieferzeiten und -kosten variieren je nach Zielland.' },
  { cat: 'Versand',    q: 'Kann ich die Lieferadresse noch ändern?',      a: 'Innerhalb von 30 Minuten nach Bestellung möglich. Danach bitte direkt den Support kontaktieren.' },
  { cat: 'Rückgabe',   q: 'Wie funktioniert die Rückgabe?',               a: '30 Tage Rückgaberecht ohne Angabe von Gründen. Einfach über den Retourenlink initiieren.' },
  { cat: 'Rückgabe',   q: 'Wann bekomme ich mein Geld zurück?',           a: 'Nach Eingang der Retoure innerhalb von 5–7 Werktagen auf die ursprüngliche Zahlungsmethode.' },
  { cat: 'Rückgabe',   q: 'Was ist mit beschädigten Artikeln?',           a: 'Bitte fotografiere den Schaden und kontaktiere uns. Wir kümmern uns um Ersatz oder vollständige Erstattung.' },
  { cat: 'Zahlung',    q: 'Welche Zahlungsmethoden gibt es?',             a: 'Kreditkarte, PayPal, Klarna, Sofortüberweisung und Apple Pay.' },
  { cat: 'Zahlung',    q: 'Ist die Zahlung sicher?',                      a: 'Ja. Alle Zahlungen laufen über SSL-verschlüsselte Verbindungen und sind PCI-DSS konform.' },
  { cat: 'Zahlung',    q: 'Kann ich in Raten zahlen?',                    a: 'Ratenzahlung ist über Klarna möglich. Die Konditionen werden beim Checkout angezeigt.' },
  { cat: 'Bestellung', q: 'Kann ich meine Bestellung noch ändern?',       a: 'Innerhalb von 30 Minuten nach Bestellung kostenfrei anpassbar oder stornierbar.' },
  { cat: 'Bestellung', q: 'Wie verfolge ich meine Bestellung?',           a: 'Nach dem Versand erhältst du eine E-Mail mit dem Tracking-Link deines Paketdienstleisters.' },
  { cat: 'Bestellung', q: 'Was passiert wenn niemand zu Hause ist?',      a: 'Der Paketdienstleister hinterlässt eine Benachrichtigung zur Abholung oder Ersatzzustellung.' },
];

const CATS = ['Alle', ...Array.from(new Set(FAQ_ITEMS.map(f => f.cat)))];

const PROVIDERS = [
  { name: 'Zendesk',   tag: 'Helpdesk', sub: 'Ticketsystem & Wissensdatenbank',    logo: 'https://logo.clearbit.com/zendesk.com' },
  { name: 'Freshdesk', tag: 'Helpdesk', sub: 'Multichannel Support-Suite',          logo: 'https://logo.clearbit.com/freshdesk.com' },
  { name: 'Intercom',  tag: 'Chat',     sub: 'Messaging & Onboarding-Plattform',    logo: 'https://logo.clearbit.com/intercom.com' },
  { name: 'Tidio',     tag: 'Chat',     sub: 'Live-Chat mit KI-Bots',               logo: 'https://logo.clearbit.com/tidio.com' },
  { name: 'Klaviyo',   tag: 'E-Mail',   sub: 'Marketing & Support Automation',      logo: 'https://logo.clearbit.com/klaviyo.com' },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const [cat, setCat]         = useState('Alle');
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = cat === 'Alle' ? FAQ_ITEMS : FAQ_ITEMS.filter(f => f.cat === cat);

  return (
    <>
      <SeoMeta
        title="FAQ & Support"
        description="Häufig gestellte Fragen — Lieferung, Rückgabe, Zahlung und mehr. Wir helfen dir schnell und unkompliziert."
      />
    <div className="help-page">

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section className="help-hero">
        <div className="help-hero__dots" aria-hidden="true" />
        <div className="help-hero__glow"  aria-hidden="true" />

        <div className="help-hero__inner">
          <div className="help-hero__content">
            <span className="help-hero__eyebrow">Support · Hilfe · Kontakt</span>
            <h1 className="help-hero__title">
              Wie können<br />
              <em>wir helfen?</em>
            </h1>
            <p className="help-hero__sub">
              Direkte Antworten. Echter Kontakt.<br />
              Kein automatisiertes Ping-Pong.
            </p>
            <div className="help-hero__badges">
              <span className="help-hero__badge">24 h Antwortzeit</span>
              <span className="help-hero__badge">4 Kanäle</span>
              <span className="help-hero__badge">Persönlich</span>
            </div>
          </div>

          <div className="help-hero__radar" aria-hidden="true">
            <div className="help-radar">
              <div className="help-radar__ring help-radar__ring--4" />
              <div className="help-radar__ring help-radar__ring--3" />
              <div className="help-radar__ring help-radar__ring--2" />
              <div className="help-radar__ring help-radar__ring--1" />
              <div className="help-radar__sweep" />
              <div className="help-radar__mark">?</div>
              <div className="help-radar__dot help-radar__dot--1" />
              <div className="help-radar__dot help-radar__dot--2" />
              <div className="help-radar__dot help-radar__dot--3" />
              <div className="help-radar__crosshair help-radar__crosshair--h" />
              <div className="help-radar__crosshair help-radar__crosshair--v" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KANAL-BENTO ───────────────────────────────────────────────────── */}
      <section className="help-channels">
        <div className="help-channels__inner">
          <header className="help-channels__head">
            <span className="label">Erreichbarkeit</span>
            <h2 className="help-channels__title">Dein Weg<br />zu uns.</h2>
          </header>

          <div className="help-channels__grid">
            {CHANNELS.map(ch => (
              <div key={ch.id} className={`channel-card channel-card--${ch.id}`}>
                <span className="channel-card__tag">{ch.tag}</span>
                <h3 className="channel-card__title">{ch.title}</h3>
                <p className="channel-card__sub">{ch.sub}</p>
                <p className="channel-card__body">{ch.body}</p>
                {'to' in ch ? (
                  <Link className="channel-card__cta" to={ch.to!}>{ch.cta} →</Link>
                ) : (
                  <a className="channel-card__cta" href={ch.href}>{ch.cta} →</a>
                )}
                <div className="channel-card__corner" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FAQ SPLIT ─────────────────────────────────────────────────────── */}
      <section className="help-faq">
        <div className="help-faq__inner">

          <aside className="help-faq__sidebar">
            <div className="help-faq__sidebar-sticky">
              <span className="label">Kategorien</span>
              <nav className="help-faq__nav" aria-label="FAQ Kategorien">
                {CATS.map(c => (
                  <button
                    key={c}
                    className={`help-faq__nav-btn${cat === c ? ' is-active' : ''}`}
                    onClick={() => { setCat(c); setOpenIdx(null); }}
                  >
                    <span className="help-faq__nav-indicator" aria-hidden="true" />
                    {c}
                  </button>
                ))}
              </nav>
              <div className="help-faq__sidebar-ghost" aria-hidden="true">FAQ</div>
            </div>
          </aside>

          <div className="help-faq__list">
            <div className="help-faq__list-head">
              <span className="help-faq__count">
                <strong>{filtered.length}</strong> Fragen
                {cat !== 'Alle' && <em> · {cat}</em>}
              </span>
            </div>

            {filtered.map((item, i) => (
              <div
                key={`${cat}-${i}`}
                className={`help-faq__item${openIdx === i ? ' is-open' : ''}`}
              >
                <button
                  className="help-faq__question"
                  aria-expanded={openIdx === i}
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                >
                  <span className="help-faq__q-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="help-faq__q-text">{item.q}</span>
                  <span className="help-faq__chevron" aria-hidden="true" />
                </button>
                <div className="help-faq__answer" role="region">
                  <div className="help-faq__answer-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 4. PROVIDER ──────────────────────────────────────────────────────── */}
      <section className="help-providers">
        <div className="help-providers__inner">
          <header className="help-providers__head">
            <span className="label">Integrationen</span>
            <h2 className="help-providers__title">Tools &amp;<br />Partner.</h2>
            <p className="help-providers__sub">
              Verbinde deinen bevorzugten Anbieter —<br />
              Platzhalter, bereit zum Anpassen.
            </p>
          </header>

          <div className="help-providers__grid">
            {PROVIDERS.map((p, i) => (
              <div key={p.name} className={`provider-card provider-card--${i + 1}`}>
                <div className="provider-card__logo" aria-label={p.name}>
                  {p.logo
                    ? <img src={p.logo} alt={p.name} loading="lazy" />
                    : <span>{p.name[0]}</span>}
                </div>
                <span className="provider-card__tag">{p.tag}</span>
                <p className="provider-card__name">{p.name}</p>
                <p className="provider-card__sub">{p.sub}</p>
                <a className="provider-card__link" href="#">Verbinden →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA ───────────────────────────────────────────────────────────── */}
      <section className="help-cta">
        <div className="help-cta__glow" aria-hidden="true" />
        <div className="help-cta__inner">
          <span className="help-cta__eyebrow">Immer noch eine Frage?</span>
          <h2 className="help-cta__title">
            Wir antworten.<br />
            <em>Persönlich.</em>
          </h2>
          <Link className="btn btn--primary btn--lg" to={ROUTES.INFO.CONTACT}>
            Kontakt aufnehmen
          </Link>
        </div>
      </section>

    </div>
    </>
  );
}
