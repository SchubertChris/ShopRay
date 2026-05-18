import { useRef, useEffect, useState, type FormEvent } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { getTicketById, useTicketChat } from '@features/tickets';
import type { Ticket } from '@features/tickets';

const STATUS_LABEL: Record<string, string> = {
  'open':        'Offen',
  'in-progress': 'In Bearbeitung',
  'resolved':    'Gelöst',
  'closed':      'Geschlossen',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket,   setTicket]   = useState<Ticket | null>(null);
  const [tLoading, setTLoading] = useState(true);
  const [input,    setInput]    = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sending, error, send } = useTicketChat(id ?? '');

  useEffect(() => {
    if (!id) return;
    getTicketById(id)
      .then(setTicket)
      .catch(() => null)
      .finally(() => setTLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!id) return <Navigate to={ROUTES.ACCOUNT.TICKETS} replace />;

  const isClosed = ticket?.status === 'closed' || ticket?.status === 'resolved';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isClosed) return;
    await send(input);
    setInput('');
  };

  return (
    <>
      <SeoMeta title={ticket ? ticket.subject : 'Ticket'} noIndex />
      <div className="ticket-detail">

        <Link to={ROUTES.ACCOUNT.TICKETS} className="ticket-detail__back">
          ← Zurück zu Tickets
        </Link>

        {!tLoading && ticket && (
          <div className="ticket-detail__header">
            <h1 className="ticket-detail__title">{ticket.subject}</h1>
            <span className={`ticket-status ticket-status--${ticket.status}`}>
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </span>
          </div>
        )}

        <div className="ticket-chat">
          <div className="ticket-chat__messages">
            {loading && <p className="ticket-chat__loading">Lädt…</p>}

            {!loading && messages.map(msg => (
              <div
                key={msg.id}
                className={`chat-bubble chat-bubble--${msg.sender}`}
              >
                <div className="chat-bubble__text">{msg.text}</div>
                <div className="chat-bubble__time">{formatTime(msg.createdAt)}</div>
              </div>
            ))}

            {!loading && messages.length === 0 && (
              <p className="ticket-chat__empty">Noch keine Nachrichten.</p>
            )}

            <div ref={bottomRef} />
          </div>

          <form className="ticket-chat__input-bar" onSubmit={handleSubmit}>
            {isClosed ? (
              <p className="ticket-chat__closed-note">
                Gespräch geschlossen —{' '}
                <Link to={ROUTES.ACCOUNT.TICKET_NEW}>neues Ticket erstellen</Link>
              </p>
            ) : (
              <>
                <input
                  className="ticket-chat__input"
                  type="text"
                  placeholder="Nachricht schreiben…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={sending}
                  maxLength={5000}
                  aria-label="Nachricht"
                />
                <button
                  className="ticket-chat__send"
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Senden"
                >
                  {sending ? '…' : '→'}
                </button>
              </>
            )}
          </form>

          {error && <p className="ticket-chat__error">{error}</p>}
        </div>
      </div>
    </>
  );
}
