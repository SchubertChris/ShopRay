import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

// ── DATA ──────────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'Intercom',  tag: 'Empfohlen', desc: 'Messaging & Onboarding-Plattform' },
  { name: 'Tidio',     tag: 'Beliebt',   desc: 'Live-Chat mit KI-Bots' },
  { name: 'Crisp',     tag: 'Günstig',   desc: 'Einfache Chat-Integration' },
  { name: 'Tawk.to',   tag: 'Kostenlos', desc: 'Live-Chat ohne monatliche Gebühr' },
];

const MOCK_MESSAGES = [
  { side: 'agent', text: 'Hallo! Wie kann ich dir heute helfen?' },
  { side: 'user',  text: 'Ich habe eine Frage zu meiner Bestellung.' },
  { side: 'agent', text: 'Natürlich! Nenne mir bitte deine Bestellnummer, dann schaue ich sofort nach.' },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  return (
    <>
      <SeoMeta title="Live Chat" description="Kontaktiere uns per Live-Chat — schnelle Hilfe, echte Menschen." />
    <div className="chat-page">

      {/* ── Status-Bar ──────────────────────────────────────────────────── */}
      <div className="chat-status">
        <div className="chat-status__dot chat-status__dot--offline" />
        <span className="chat-status__label">Live-Chat</span>
        <span className="chat-status__sep">·</span>
        <span className="chat-status__state">Kein Anbieter konfiguriert</span>
        <span className="chat-status__sep">·</span>
        <span className="chat-status__hint">
          Verbinde deinen Chat-Service in der Provider-Sektion
        </span>
      </div>

      {/* ── Haupt-Split ─────────────────────────────────────────────────── */}
      <div className="chat-split">

        {/* ── Chat-Widget (links) ─────────────────────────────────────── */}
        <div className="chat-widget">
          <div className="chat-widget__head">
            <div className="chat-widget__avatar" aria-hidden="true">
              <span>SR</span>
            </div>
            <div className="chat-widget__meta">
              <span className="chat-widget__name">Support-Team</span>
              <span className="chat-widget__status">
                <span className="chat-widget__status-dot" />
                Offline
              </span>
            </div>
            <div className="chat-widget__badge">DEMO</div>
          </div>

          <div className="chat-widget__messages" role="log" aria-label="Chat-Nachrichten">
            <div className="chat-widget__day-label">Heute</div>
            {MOCK_MESSAGES.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble chat-bubble--${msg.side}`}
              >
                <span className="chat-bubble__text">{msg.text}</span>
              </div>
            ))}
            <div className="chat-widget__typing" aria-label="Tippindikator" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>

          <div className="chat-widget__footer">
            <div className="chat-widget__input-bar">
              <input
                className="chat-widget__input"
                type="text"
                placeholder="Nachricht schreiben …"
                disabled
                aria-label="Nachrichteneingabe (nicht aktiv)"
              />
              <button className="chat-widget__send" type="button" disabled aria-label="Senden">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="chat-widget__offline-note">
              Chat ist aktuell nicht aktiv. Verbinde einen Anbieter.
            </p>
          </div>

          <div className="chat-widget__overlay" aria-hidden="true">
            <div className="chat-widget__overlay-inner">
              <span className="chat-widget__overlay-tag">Platzhalter</span>
              <p className="chat-widget__overlay-hint">
                Ersetze dieses Widget durch deinen Chat-Anbieter
              </p>
            </div>
          </div>
        </div>

        {/* ── Info-Panel (rechts) ──────────────────────────────────────── */}
        <aside className="chat-panel">
          <div className="chat-panel__section">
            <span className="chat-panel__eyebrow">Integration</span>
            <h1 className="chat-panel__title">
              Chat-Anbieter<br />
              <em>verbinden.</em>
            </h1>
            <p className="chat-panel__body">
              Binde deinen bevorzugten Live-Chat-Service ein und ersetze den Platzhalter
              links mit dem echten Widget-Code.
            </p>
          </div>

          <div className="chat-panel__section">
            <span className="chat-panel__label">Unterstützte Anbieter</span>
            <div className="chat-providers">
              {PROVIDERS.map(p => (
                <div key={p.name} className="chat-provider">
                  <div className="chat-provider__head">
                    <span className="chat-provider__name">{p.name}</span>
                    <span className="chat-provider__tag">{p.tag}</span>
                  </div>
                  <span className="chat-provider__desc">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-panel__section chat-panel__section--actions">
            <Link to={ROUTES.INFO.CONTACT} className="btn btn--primary">
              Kontakt aufnehmen
            </Link>
            <Link to={ROUTES.INFO.FAQ} className="btn btn--ghost">
              Zurück zum Support-Hub
            </Link>
          </div>
        </aside>

      </div>
    </div>
    </>
  );
}
