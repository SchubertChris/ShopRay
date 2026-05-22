import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@features/auth';
import { getTickets, createTicket, useTicketChat } from '@features/tickets';
import type { Ticket } from '@features/tickets';

// ── Active chat (uses useTicketChat — must be separate component for hook rules) ──
interface ActiveChatPanelProps {
  ticket: Ticket;
  onClose: () => void;
}

function ActiveChatPanel({ ticket, onClose }: ActiveChatPanelProps) {
  const { messages, loading, sending, error, send } = useTicketChat(ticket.id);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    await send(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      <div className="chat-widget__header">
        <div className="chat-widget__header-info">
          <span className="chat-widget__header-title">Support-Chat</span>
          <span className="chat-widget__header-sub">{ticket.subject}</span>
        </div>
        <button className="chat-widget__close" onClick={onClose} aria-label="Schließen">
          <X size={18} />
        </button>
      </div>

      <div className="chat-widget__messages">
        {loading && (
          <div className="chat-widget__loading">
            <Loader2 size={22} className="chat-widget__spinner" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="chat-widget__empty">Noch keine Nachrichten. Schreib uns!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`chat-widget__bubble chat-widget__bubble--${msg.sender}`}>
            <span className="chat-widget__bubble-text">{msg.text}</span>
            <span className="chat-widget__bubble-time">
              {new Date(msg.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {error && <p className="chat-widget__error">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="chat-widget__input-bar">
        <input
          className="chat-widget__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nachricht eingeben…"
          disabled={sending || ticket.status === 'closed'}
        />
        <button
          className="chat-widget__send"
          onClick={() => void handleSend()}
          disabled={sending || !input.trim() || ticket.status === 'closed'}
          aria-label="Senden"
        >
          {sending
            ? <Loader2 size={16} className="chat-widget__spinner" />
            : <Send size={16} />
          }
        </button>
      </div>
    </>
  );
}

// ── New ticket form (authenticated user, no open ticket) ─────────────────────
interface NewTicketFormProps {
  onCreated: (ticket: Ticket) => void;
  onClose:   () => void;
}

function NewTicketForm({ onCreated, onClose }: NewTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const ticket = await createTicket({
        subject:     subject.trim(),
        category:    'Sonstiges',
        priority:    'normal',
        description: message.trim(),
      });
      onCreated(ticket);
    } catch {
      setError('Ticket konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chat-widget__header">
        <span className="chat-widget__header-title">Neue Anfrage</span>
        <button className="chat-widget__close" onClick={onClose} aria-label="Schließen">
          <X size={18} />
        </button>
      </div>
      <div className="chat-widget__form">
        <p className="chat-widget__form-intro">
          Stell uns deine Frage — wir antworten so schnell wie möglich.
        </p>
        <input
          className="chat-widget__input chat-widget__input--field"
          placeholder="Betreff"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <textarea
          className="chat-widget__textarea"
          placeholder="Wie können wir dir helfen?"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
        />
        {error && <p className="chat-widget__error">{error}</p>}
        <button
          className="chat-widget__submit"
          onClick={() => void submit()}
          disabled={loading || !subject.trim() || !message.trim()}
        >
          {loading && <Loader2 size={16} className="chat-widget__spinner" />}
          {loading ? 'Wird gesendet…' : 'Anfrage senden'}
        </button>
      </div>
    </>
  );
}

// ── Guest form (not logged in) ───────────────────────────────────────────────
interface GuestFormProps {
  onClose: () => void;
}

function GuestForm({ onClose }: GuestFormProps) {
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !subject.trim() || !message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createTicket({
        subject:     subject.trim(),
        category:    'Sonstiges',
        priority:    'normal',
        description: message.trim(),
        guestEmail:  email.trim(),
      });
      setDone(true);
    } catch {
      setError('Anfrage konnte nicht gesendet werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chat-widget__header">
        <span className="chat-widget__header-title">Support kontaktieren</span>
        <button className="chat-widget__close" onClick={onClose} aria-label="Schließen">
          <X size={18} />
        </button>
      </div>

      {done ? (
        <div className="chat-widget__done">
          <span className="chat-widget__done-icon">✓</span>
          <p className="chat-widget__done-text">
            Danke! Wir haben deine Anfrage erhalten und melden uns per E-Mail bei dir.
          </p>
        </div>
      ) : (
        <div className="chat-widget__form">
          <p className="chat-widget__form-intro">
            Stell uns deine Frage — wir antworten per E-Mail.
          </p>
          <input
            className="chat-widget__input chat-widget__input--field"
            placeholder="Deine E-Mail-Adresse"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="chat-widget__input chat-widget__input--field"
            placeholder="Betreff"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <textarea
            className="chat-widget__textarea"
            placeholder="Wie können wir dir helfen?"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
          />
          {error && <p className="chat-widget__error">{error}</p>}
          <button
            className="chat-widget__submit"
            onClick={() => void submit()}
            disabled={loading || !email.trim() || !subject.trim() || !message.trim()}
          >
            {loading && <Loader2 size={16} className="chat-widget__spinner" />}
            {loading ? 'Wird gesendet…' : 'Anfrage senden'}
          </button>
        </div>
      )}
    </>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────
type PanelView = 'loading' | 'active-chat' | 'new-ticket' | 'guest';

export function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen,       setIsOpen]       = useState(false);
  const [view,         setView]         = useState<PanelView>('loading');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const open = useCallback(async () => {
    setIsOpen(true);
    if (!isAuthenticated) {
      setView('guest');
      return;
    }
    setView('loading');
    try {
      const result = await getTickets(1, 10);
      const openTicket = result.data.find(t => t.status !== 'closed');
      if (openTicket) {
        setActiveTicket(openTicket);
        setView('active-chat');
      } else {
        setView('new-ticket');
      }
    } catch {
      setView('new-ticket');
    }
  }, [isAuthenticated]);

  const close = useCallback(() => setIsOpen(false), []);

  const handleTicketCreated = useCallback((ticket: Ticket) => {
    setActiveTicket(ticket);
    setView('active-chat');
  }, []);

  // Full-screen transparent portal — kein position:fixed auf child nötig,
  // verhindert Containing-Block-Probleme durch CSS auf body/#root.
  return createPortal(
    <div className="chat-portal">
      {isOpen && (
        <div className="chat-widget__panel">
          {view === 'loading' && (
            <div className="chat-widget__loader-wrap">
              <Loader2 size={24} className="chat-widget__spinner" />
            </div>
          )}
          {view === 'active-chat' && activeTicket && (
            <ActiveChatPanel ticket={activeTicket} onClose={close} />
          )}
          {view === 'new-ticket' && (
            <NewTicketForm onCreated={handleTicketCreated} onClose={close} />
          )}
          {view === 'guest' && (
            <GuestForm onClose={close} />
          )}
        </div>
      )}

      <div className="chat-widget">
        <button
          className={`chat-widget__fab${isOpen ? ' chat-widget__fab--active' : ''}`}
          onClick={isOpen ? close : () => void open()}
          aria-label={isOpen ? 'Chat schließen' : 'Chat öffnen'}
        >
          {isOpen ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>
    </div>,
    document.body
  );
}
