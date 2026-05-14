import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

// ── DATA ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Offene Tickets',   value: '—', sub: 'Kein Anbieter aktiv' },
  { label: 'Gelöst (30 Tage)', value: '—', sub: 'Kein Anbieter aktiv' },
  { label: 'Ø Reaktionszeit',  value: '—', sub: 'Kein Anbieter aktiv' },
];

const CATS = ['Alle', 'Offen', 'In Bearbeitung', 'Gelöst', 'Geschlossen'];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function SupportPortalPage() {
  const [activeCat, setActiveCat] = useState('Alle');
  const [search, setSearch]       = useState('');

  return (
    <>
      <SeoMeta title="Support-Portal" description="Hilfe-Artikel, Tutorials und dein Ticket-System — alles an einem Ort." />
    <div className="portal-page">

      {/* ── Hero / Stats ────────────────────────────────────────────────── */}
      <header className="portal-hero">
        <div className="portal-hero__left">
          <span className="portal-hero__eyebrow">Support-Portal</span>
          <h1 className="portal-hero__title">Meine Tickets</h1>
        </div>
        <div className="portal-hero__stats">
          {STATS.map(s => (
            <div key={s.label} className="portal-stat">
              <span className="portal-stat__value">{s.value}</span>
              <span className="portal-stat__label">{s.label}</span>
              <span className="portal-stat__sub">{s.sub}</span>
            </div>
          ))}
        </div>
        <div className="portal-hero__actions">
          <Link to={ROUTES.ACCOUNT.TICKET_NEW} className="btn btn--primary">
            + Neues Ticket
          </Link>
        </div>
      </header>

      {/* ── Haupt-Bereich ────────────────────────────────────────────────── */}
      <div className="portal-body">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="portal-sidebar">
          <span className="portal-sidebar__label">Kategorie</span>
          <nav className="portal-sidebar__nav" aria-label="Ticket-Filter">
            {CATS.map(cat => (
              <button
                key={cat}
                className={`portal-sidebar__item${activeCat === cat ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveCat(cat)}
              >
                <span>{cat}</span>
                <span className="portal-sidebar__count">—</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Ticket-Liste (Empty State) ──────────────────────────────── */}
        <main className="portal-main">
          <div className="portal-toolbar">
            <input
              className="portal-toolbar__search"
              type="search"
              placeholder="Ticket suchen …"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Tickets durchsuchen"
            />
            <span className="portal-toolbar__count">0 Tickets</span>
          </div>

          <div className="portal-empty">
            <div className="portal-empty__icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="portal-empty__title">
              {activeCat === 'Alle' ? 'Noch keine Tickets' : `Keine ${activeCat} Tickets`}
            </h2>
            <p className="portal-empty__body">
              Verbinde ein Ticketsystem oder erstelle deine erste Anfrage direkt über
              den Support-Hub.
            </p>
            <div className="portal-empty__actions">
              <Link to={ROUTES.ACCOUNT.TICKET_NEW} className="btn btn--primary btn--sm">
                Ticket erstellen
              </Link>
              <Link to={ROUTES.INFO.FAQ} className="btn btn--ghost btn--sm">
                Support-Hub
              </Link>
            </div>
          </div>
        </main>

      </div>

    </div>
    </>
  );
}
