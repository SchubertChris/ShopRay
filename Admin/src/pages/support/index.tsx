import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock, CheckCircle, ChevronRight, Search, Archive } from 'lucide-react';
import { getAdminTickets, replyToTicket, getAdminTicketMessages, sendAdminMessage, type AdminTicket, type TicketMessage } from '../../api/adminApi';
import { useBadgeStore } from '@stores/badgeStore';
import ViewToggle from '../../components/ui/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

type StatusFilter = AdminTicket['status'] | 'all';
type ListViewMode = 'active' | 'archive';

const ACTIVE_TABS: Array<{ key: StatusFilter; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { key: 'all',         label: 'Alle',           icon: MessageSquare },
  { key: 'open',        label: 'Offen',          icon: Clock         },
  { key: 'in_progress', label: 'In Bearbeitung', icon: ChevronRight  },
];

const CAT_LABELS: Record<string, string> = {
  order:   'Bestellung',
  product: 'Produkt',
  payment: 'Zahlung',
  other:   'Sonstiges',
};

const STATUS_LABELS: Record<string, string> = {
  open:        'Offen',
  in_progress: 'In Bearbeitung',
  closed:      'Geschlossen',
};

export default function SupportPage() {
  const [tickets, setTickets]     = useState<AdminTicket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewMode, setViewMode]   = useState<ListViewMode>('active');
  const [status, setStatus]       = useState<StatusFilter>('all');
  const [displayMode, toggleDisplayMode] = useViewMode('admin-support-view');
  const [category, setCategory]   = useState<string>('all');
  const [search, setSearch]       = useState('');
  const [active, setActive]       = useState<string | null>(null);
  const [reply, setReply]         = useState('');
  const [replyStatus, setReplyStatus] = useState<AdminTicket['status']>('closed');
  const [saving, setSaving]       = useState(false);

  const [chatView,    setChatView]    = useState(false);
  const [chatTicket,  setChatTicket]  = useState<AdminTicket | null>(null);
  const [chatMsgs,    setChatMsgs]    = useState<TicketMessage[]>([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    useBadgeStore.getState().clear('openTickets');
    setLoading(true);
    getAdminTickets()
      .then(res => { setTickets(res.data); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // Aktive = open + in_progress, Archiv = closed
  const byMode = viewMode === 'active'
    ? tickets.filter(t => t.status !== 'closed')
    : tickets.filter(t => t.status === 'closed');

  const byStatus = status === 'all' ? byMode : byMode.filter(t => t.status === status);
  const byCategory = category === 'all' ? byStatus : byStatus.filter(t => t.category === category);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? byCategory.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        (t.profiles?.name ?? '').toLowerCase().includes(q) ||
        (t.profiles?.email ?? '').toLowerCase().includes(q),
      )
    : byCategory;

  const counts = ACTIVE_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? byMode.length : byMode.filter(t => t.status === tab.key).length;
    return acc;
  }, {});

  const archiveCount = tickets.filter(t => t.status === 'closed').length;
  const activeCount  = tickets.filter(t => t.status !== 'closed').length;

  const activeTicket = active ? tickets.find(t => t.id === active) : null;

  useEffect(() => {
    if (activeTicket) {
      setReply(activeTicket.reply ?? '');
      setReplyStatus(activeTicket.status === 'open' ? 'in_progress' : activeTicket.status);
    }
  }, [active]);

  const handleSend = async () => {
    if (!activeTicket || !reply.trim()) return;
    setSaving(true);
    try {
      await replyToTicket(activeTicket.id, reply, replyStatus);
      setTickets(prev => prev.map(t =>
        t.id === activeTicket.id ? { ...t, reply, status: replyStatus, replied_at: new Date().toISOString() } : t,
      ));
    } catch { /* ignore */ }
    setSaving(false);
  };

  const switchView = (mode: ListViewMode) => {
    setViewMode(mode);
    setStatus('all');
    setSearch('');
    setActive(null);
    setChatView(false);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const openChat = async (ticket: AdminTicket) => {
    setChatTicket(ticket);
    setChatLoading(true);
    try {
      const msgs = await getAdminTicketMessages(ticket.id);
      setChatMsgs(msgs);
    } finally {
      setChatLoading(false);
    }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const fresh = await getAdminTicketMessages(ticket.id).catch(() => null);
      if (fresh) setChatMsgs(fresh);
    }, 2000);
  };

  const closeChat = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setChatTicket(null);
    setChatMsgs([]);
  };

  const sendChat = async () => {
    if (!chatTicket || !chatInput.trim() || chatSending) return;
    setChatSending(true);
    try {
      const msg = await sendAdminMessage(chatTicket.id, chatInput.trim());
      setChatMsgs(prev => [...prev, msg]);
      setChatInput('');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Support</span>
          <h1 className="page-header__title">Tickets</h1>
          <p className="page-header__sub">{tickets.filter(t => t.status === 'open').length} offene Tickets</p>
        </div>
        <div className="page-header__actions">
          <button
            className={`filter-bar__tab${viewMode === 'active' ? ' is-active' : ''}`}
            onClick={() => switchView('active')}
          >
            Aktiv
            {activeCount > 0 && <span className="tab-nav__count">{activeCount}</span>}
          </button>
          <button
            className={`filter-bar__tab${viewMode === 'archive' ? ' is-active' : ''}`}
            onClick={() => switchView('archive')}
          >
            <Archive size={13} strokeWidth={2} />
            Archiv
            {archiveCount > 0 && <span className="tab-nav__count">{archiveCount}</span>}
          </button>
          <button
            className={`filter-bar__tab${chatView ? ' is-active' : ''}`}
            onClick={() => { if (chatView) { closeChat(); setChatView(false); } else { closeChat(); setChatView(true); setActive(null); } }}
          >
            Chats
            {activeCount > 0 && <span className="tab-nav__count">{activeCount}</span>}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__search">
          <Search size={14} strokeWidth={2} className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Betreff, Name oder E-Mail suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-bar__input"
          />
        </div>
        <ViewToggle mode={displayMode} onToggle={toggleDisplayMode} />
      </div>

      <div className="tab-nav">
        {viewMode === 'active' && ACTIVE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-nav__item${status === tab.key ? ' is-active' : ''}`}
            onClick={() => setStatus(tab.key)}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`tab-nav__count${status === tab.key ? ' is-active' : ''}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
        {viewMode === 'archive' && (
          <button className="tab-nav__item is-active">
            <CheckCircle size={14} strokeWidth={1.75} />
            Geschlossen
            <span className="tab-nav__count is-active">{archiveCount}</span>
          </button>
        )}
        <div className="tab-nav__spacer" />
        <select className="tab-nav__filter" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">Alle Kategorien</option>
          {Object.keys(CAT_LABELS).map(k => (
            <option key={k} value={k}>{CAT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Grid-Ansicht */}
      {displayMode === 'grid' && (
        <div className="admin-grid admin-grid--wide">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-card">
                <div className="admin-card__body">
                  <span className="skeleton skeleton--md" style={{ display: 'block', marginBottom: '0.4rem' }} />
                  <span className="skeleton skeleton--sm" style={{ display: 'block' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="data-card__empty">
              {search ? 'Keine Treffer für diese Suche.' : 'Keine Tickets in dieser Kategorie.'}
            </p>
          ) : filtered.map(t => (
            <div
              key={t.id}
              className="admin-card"
              onClick={() => setActive(active === t.id ? null : t.id)}
            >
              <div className="admin-card__body">
                <p className="admin-card__name">{t.subject}</p>
                <div className="admin-card__status-row">
                  <span className={`ticket-card__status ticket-card__status--${t.status}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                  <span className="ticket-card__cat">{CAT_LABELS[t.category] ?? t.category}</span>
                </div>
                <p className="admin-card__preview admin-card__meta">
                  {t.message.length > 80 ? `${t.message.slice(0, 80)}…` : t.message}
                </p>
              </div>
              <div className="admin-card__footer">
                <span className="admin-card__meta">{new Date(t.created_at).toLocaleDateString('de-DE')}</span>
                <span className="admin-card__meta">{t.profiles?.name ?? t.profiles?.email ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {displayMode === 'table' && (
      <div className={`ticket-split${activeTicket ? ' has-detail' : ''}`}>
        <div className="ticket-list">
          {loading ? (
            <div className="data-card"><div className="data-card__empty">Lade Tickets…</div></div>
          ) : filtered.length === 0 ? (
            <div className="data-card">
              <div className="data-card__empty">
                {search ? 'Keine Treffer für diese Suche.' : 'Keine Tickets in dieser Kategorie.'}
              </div>
            </div>
          ) : (
            filtered.map(t => (
              <button
                key={t.id}
                className={`ticket-card${active === t.id ? ' is-active' : ''} ticket-card--${t.status}`}
                onClick={() => setActive(active === t.id ? null : t.id)}
              >
                <div className="ticket-card__top">
                  {t.status === 'open' && <span className="unread-dot" />}
                  <span className={`ticket-card__status ticket-card__status--${t.status}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                  <span className="ticket-card__cat">{CAT_LABELS[t.category] ?? t.category}</span>
                  <span className="ticket-card__date">
                    {new Date(t.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="ticket-card__subject">{t.subject}</p>
                <p className="ticket-card__customer">{t.profiles?.name ?? t.profiles?.email ?? '—'}</p>
              </button>
            ))
          )}
        </div>

        {activeTicket && (
          <div className="ticket-detail">
            <div className="ticket-detail__header">
              <p className="ticket-detail__id">Ticket #{activeTicket.id.slice(0, 8)}</p>
              <p className="ticket-detail__subject">{activeTicket.subject}</p>
              <p className="ticket-detail__meta">
                {activeTicket.profiles?.name ?? activeTicket.profiles?.email ?? '—'} · {new Date(activeTicket.created_at).toLocaleDateString('de-DE')}
              </p>
            </div>
            <div className="ticket-detail__message">
              <p className="ticket-detail__message-label">Nachricht des Kunden</p>
              <p className="ticket-detail__message-text">{activeTicket.message}</p>
            </div>
            <div className="ticket-detail__reply">
              <p className="ticket-detail__message-label">Antwort</p>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Deine Antwort an den Kunden…"
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <div className="ticket-detail__actions">
                <select
                  className="form-select form-select--sm"
                  value={replyStatus}
                  onChange={e => setReplyStatus(e.target.value as AdminTicket['status'])}
                >
                  <option value="open">Status: Offen</option>
                  <option value="in_progress">Status: In Bearbeitung</option>
                  <option value="closed">Status: Geschlossen</option>
                </select>
                <button className="btn-primary" onClick={handleSend} disabled={saving || !reply.trim()}>
                  {saving ? 'Speichern…' : 'Senden & aktualisieren'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {chatView && !chatTicket && (
        <div className="ticket-list">
          {tickets
            .filter(t => t.status !== 'closed')
            .map(ticket => (
              <button
                key={ticket.id}
                className="ticket-card"
                onClick={() => openChat(ticket)}
                type="button"
              >
                <div className="ticket-card__top">
                  {ticket.status === 'open' && <span className="unread-dot" />}
                  <span className={`ticket-card__status ticket-card__status--${ticket.status}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  <span className="ticket-card__cat">{CAT_LABELS[ticket.category] ?? ticket.category}</span>
                  <span className="ticket-card__date">
                    {new Date(ticket.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="ticket-card__subject">{ticket.subject}</p>
                <p className="ticket-card__customer">{ticket.profiles?.name ?? ticket.profiles?.email ?? '—'}</p>
              </button>
            ))}
          {tickets.filter(t => t.status !== 'closed').length === 0 && (
            <div className="data-card"><div className="data-card__empty">Keine offenen Tickets.</div></div>
          )}
        </div>
      )}

      {chatView && chatTicket && (
        <div className="admin-chat-panel">
          <div className="admin-chat-panel__header">
            <button className="btn-ghost btn-sm" onClick={closeChat} type="button">← Zurück</button>
            <span className="admin-chat-panel__subject">{chatTicket.subject}</span>
            <span className="admin-chat-panel__customer">{chatTicket.profiles?.name ?? chatTicket.profiles?.email ?? '—'}</span>
          </div>
          <div className="admin-chat-panel__messages">
            {chatLoading && <p className="admin-chat-panel__loading">Lädt…</p>}
            {!chatLoading && chatMsgs.map(msg => (
              <div
                key={msg.id}
                className={`chat-bubble chat-bubble--${msg.sender === 'admin' ? 'admin-sent' : 'customer-recv'}`}
              >
                <div className="chat-bubble__text">{msg.text}</div>
                <div className="chat-bubble__time">
                  {new Date(msg.created_at).toLocaleString('de-DE', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
            {!chatLoading && chatMsgs.length === 0 && (
              <p className="admin-chat-panel__empty">Noch keine Nachrichten.</p>
            )}
          </div>
          <div className="admin-chat-panel__input-bar">
            <input
              className="form-input"
              type="text"
              placeholder="Antwort schreiben…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              disabled={chatSending}
              maxLength={5000}
            />
            <button
              className="btn-primary"
              type="button"
              onClick={sendChat}
              disabled={chatSending || !chatInput.trim()}
            >
              {chatSending ? '…' : 'Senden'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
