import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { getTickets } from '@features/tickets';
import type { Ticket, TicketStatus } from '@features/tickets';

const TABS: { label: string; status: TicketStatus | 'all' }[] = [
  { label: 'Alle',           status: 'all' },
  { label: 'Offen',          status: 'open' },
  { label: 'In Bearbeitung', status: 'in-progress' },
  { label: 'Geschlossen',    status: 'closed' },
];

const STATUS_LABEL: Record<TicketStatus, string> = {
  'open':        'Offen',
  'in-progress': 'In Bearbeitung',
  'closed':      'Geschlossen',
};

export default function TicketsPage() {
  const [activeStatus, setActiveStatus] = useState<TicketStatus | 'all'>('all');
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getTickets(1, 100)
      .then(res => setTickets(res.data))
      .catch(() => setError('Tickets konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeStatus === 'all'
    ? tickets
    : tickets.filter(t => t.status === activeStatus);

  const countFor = (s: TicketStatus | 'all') =>
    s === 'all' ? tickets.length : tickets.filter(t => t.status === s).length;

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
              key={tab.status}
              role="tab"
              aria-selected={activeStatus === tab.status}
              className={`tickets-tab${activeStatus === tab.status ? ' is-active' : ''}`}
              onClick={() => setActiveStatus(tab.status)}
              type="button"
            >
              {tab.label}
              <span className="tickets-tab__count">{countFor(tab.status)}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="tickets-empty" role="tabpanel">
            <p>Lädt…</p>
          </div>
        )}

        {error && !loading && (
          <div className="tickets-empty" role="tabpanel">
            <p className="tickets-empty__body">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="tickets-empty" role="tabpanel">
            <div className="tickets-empty__icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="tickets-empty__title">
              {activeStatus === 'all' ? 'Noch keine Tickets' : `Keine ${TABS.find(t => t.status === activeStatus)?.label} Tickets`}
            </h2>
            <p className="tickets-empty__body">
              Hast du eine Frage oder ein Problem? Erstelle ein neues Ticket und wir melden uns so schnell wie möglich.
            </p>
            <Link to={ROUTES.ACCOUNT.TICKET_NEW} className="btn btn--primary btn--sm">
              Ticket erstellen
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="tickets-list" role="tabpanel">
            {filtered.map(ticket => (
              <div
                key={ticket.id}
                className="ticket-card ticket-card--clickable"
                onClick={() => navigate(ROUTES.ACCOUNT.ticketDetail(ticket.id))}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(ROUTES.ACCOUNT.ticketDetail(ticket.id))}
              >
                <div className="ticket-card__body">
                  <div className="ticket-card__subject">{ticket.subject}</div>
                  <div className="ticket-card__meta">
                    {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <span className={`ticket-status ticket-status--${ticket.status}`}>
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
