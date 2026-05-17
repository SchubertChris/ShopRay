import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { getAdminTickets, replyToTicket, type AdminTicket } from '../../api/adminApi';

type StatusFilter = AdminTicket['status'] | 'all';

const STATUS_TABS: Array<{ key: StatusFilter; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { key: 'all',         label: 'Alle',           icon: MessageSquare },
  { key: 'open',        label: 'Offen',          icon: Clock         },
  { key: 'in_progress', label: 'In Bearbeitung', icon: ChevronRight  },
  { key: 'closed',      label: 'Geschlossen',    icon: CheckCircle   },
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
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState<StatusFilter>('all');
  const [category, setCategory]   = useState<string>('all');
  const [active, setActive]       = useState<string | null>(null);
  const [reply, setReply]         = useState('');
  const [replyStatus, setReplyStatus] = useState<AdminTicket['status']>('closed');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminTickets()
      .then(res => { setTickets(res.data); setTotal(res.total); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    const matchStatus = status === 'all' || t.status === status;
    const matchCat    = category === 'all' || t.category === category;
    return matchStatus && matchCat;
  });

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? tickets.length : tickets.filter(t => t.status === tab.key).length;
    return acc;
  }, {});

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

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Support</span>
          <h1 className="page-header__title">Tickets</h1>
          <p className="page-header__sub">{tickets.filter(t => t.status === 'open').length} offene Tickets</p>
        </div>
      </div>

      <div className="tab-nav">
        {STATUS_TABS.map(tab => (
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
        <div className="tab-nav__spacer" />
        <select className="tab-nav__filter" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">Alle Kategorien</option>
          {Object.keys(CAT_LABELS).map(k => (
            <option key={k} value={k}>{CAT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      <div className={`ticket-split${activeTicket ? ' has-detail' : ''}`}>
        <div className="ticket-list">
          {loading ? (
            <div className="data-card"><div className="data-card__empty">Lade Tickets…</div></div>
          ) : filtered.length === 0 ? (
            <div className="data-card"><div className="data-card__empty">Keine Tickets in dieser Kategorie.</div></div>
          ) : (
            filtered.map(t => (
              <button
                key={t.id}
                className={`ticket-card${active === t.id ? ' is-active' : ''} ticket-card--${t.status}`}
                onClick={() => setActive(active === t.id ? null : t.id)}
              >
                <div className="ticket-card__top">
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
    </>
  );
}
