import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

// ── DATA ──────────────────────────────────────────────────────────────────────

const TABS = ['Alle', 'Offen', 'In Bearbeitung', 'Gelöst', 'Geschlossen'] as const;
type Tab = typeof TABS[number];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Alle');

  return (
    <>
      <SeoMeta title="Meine Tickets" noIndex />
    <div className="tickets-page">
      <div className="tickets-head">
        <div className="tickets-head__left">
          <h1 className="tickets-head__title">Meine Tickets</h1>
          <p className="tickets-head__sub">Alle deine Support-Anfragen auf einen Blick.</p>
        </div>
        <Link to={ROUTES.ACCOUNT.TICKET_NEW} className="btn btn--primary btn--sm">
          + Neues Ticket
        </Link>
      </div>

      <div className="tickets-tabs" role="tablist" aria-label="Ticket-Filter">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tickets-tab${activeTab === tab ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
            <span className="tickets-tab__count">0</span>
          </button>
        ))}
      </div>

      <div className="tickets-empty" role="tabpanel">
        <div className="tickets-empty__icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="tickets-empty__title">
          {activeTab === 'Alle' ? 'Noch keine Tickets' : `Keine ${activeTab} Tickets`}
        </h2>
        <p className="tickets-empty__body">
          Hast du eine Frage oder ein Problem? Erstelle ein neues Ticket und wir melden
          uns so schnell wie möglich bei dir.
        </p>
        <Link to={ROUTES.ACCOUNT.TICKET_NEW} className="btn btn--primary btn--sm">
          Ticket erstellen
        </Link>
      </div>
    </div>
    </>
  );
}
