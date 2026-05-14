import { useState } from 'react';
import { MessageSquare, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import type { Ticket, TicketStatus, TicketCategory } from '../../types/index';

const MOCK_TICKETS: Ticket[] = [
  { id: '1',  subject: 'Bestellung #1039 — Lieferzeit?',          message: 'Wann kommt meine Bestellung an?',                    status: 'open',        category: 'order',   customerId: '4', customerName: 'Max Müller',     createdAt: '13.05.2026' },
  { id: '2',  subject: 'Produkt defekt angekommen',               message: 'Die Holzschale hat einen Riss.',                     status: 'in_progress', category: 'product', customerId: '1', customerName: 'Laura Meier',    createdAt: '12.05.2026' },
  { id: '3',  subject: 'Zahlung fehlgeschlagen — was tun?',       message: 'Meine Kreditkarte wird abgelehnt.',                  status: 'open',        category: 'payment', customerId: '5', customerName: 'Anna Schmidt',   createdAt: '12.05.2026' },
  { id: '4',  subject: 'Wo ist meine Rechnung?',                  message: 'Ich habe keine E-Mail erhalten.',                    status: 'open',        category: 'order',   customerId: '8', customerName: 'Lukas Hoffmann', createdAt: '11.05.2026' },
  { id: '5',  subject: 'Wolldecke nicht mehr verfügbar',          message: 'Gibt es eine Nachbestellung?',                      status: 'in_progress', category: 'product', customerId: '3', customerName: 'Sara König',     createdAt: '10.05.2026' },
  { id: '6',  subject: 'Rückgabe: Kissenhülle passt nicht',       message: 'Ich möchte das Produkt zurückgeben.',               status: 'closed',      category: 'other',   customerId: '2', customerName: 'Jonas Braun',    createdAt: '09.05.2026' },
  { id: '7',  subject: 'Rabattcode funktioniert nicht',           message: 'Der Code SOMMER10 wird nicht akzeptiert.',           status: 'closed',      category: 'payment', customerId: '7', customerName: 'Mia Becker',     createdAt: '08.05.2026' },
  { id: '8',  subject: 'Adresse ändern nach Bestellung',         message: 'Kann ich die Lieferadresse noch anpassen?',          status: 'open',        category: 'order',   customerId: '10',customerName: 'Tim Schulz',     createdAt: '07.05.2026' },
];

type StatusFilter = TicketStatus | 'all';
type CatFilter   = TicketCategory | 'all';

const STATUS_TABS: Array<{ key: StatusFilter; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { key: 'all',         label: 'Alle',           icon: MessageSquare },
  { key: 'open',        label: 'Offen',          icon: Clock         },
  { key: 'in_progress', label: 'In Bearbeitung', icon: ChevronRight  },
  { key: 'closed',      label: 'Geschlossen',    icon: CheckCircle   },
];

const CAT_LABELS: Record<TicketCategory, string> = {
  order:   'Bestellung',
  product: 'Produkt',
  payment: 'Zahlung',
  other:   'Sonstiges',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:        'Offen',
  in_progress: 'In Bearbeitung',
  closed:      'Geschlossen',
};

export default function SupportPage() {
  const [status, setStatus]   = useState<StatusFilter>('all');
  const [category, setCategory] = useState<CatFilter>('all');
  const [active, setActive]   = useState<string | null>(null);

  const filtered = MOCK_TICKETS.filter(t => {
    const matchStatus = status === 'all' || t.status === status;
    const matchCat    = category === 'all' || t.category === category;
    return matchStatus && matchCat;
  });

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? MOCK_TICKETS.length
      : MOCK_TICKETS.filter(t => t.status === tab.key).length;
    return acc;
  }, {});

  const activeTicket = active ? MOCK_TICKETS.find(t => t.id === active) : null;

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Support</span>
          <h1 className="page-header__title">Tickets</h1>
          <p className="page-header__sub">{MOCK_TICKETS.filter(t => t.status === 'open').length} offene Tickets</p>
        </div>
      </div>

      {/* Status-Tabs */}
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
        <select
          className="tab-nav__filter"
          value={category}
          onChange={e => setCategory(e.target.value as CatFilter)}
        >
          <option value="all">Alle Kategorien</option>
          {(Object.keys(CAT_LABELS) as TicketCategory[]).map(k => (
            <option key={k} value={k}>{CAT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Split View */}
      <div className={`ticket-split${activeTicket ? ' has-detail' : ''}`}>
        {/* Ticket List */}
        <div className="ticket-list">
          {filtered.length === 0 ? (
            <div className="data-card">
              <div className="data-card__empty">Keine Tickets in dieser Kategorie.</div>
            </div>
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
                  <span className="ticket-card__cat">{CAT_LABELS[t.category]}</span>
                  <span className="ticket-card__date">{t.createdAt}</span>
                </div>
                <p className="ticket-card__subject">{t.subject}</p>
                <p className="ticket-card__customer">{t.customerName}</p>
              </button>
            ))
          )}
        </div>

        {/* Reply Panel */}
        {activeTicket && (
          <div className="ticket-detail">
            <div className="ticket-detail__header">
              <p className="ticket-detail__id">Ticket #{activeTicket.id}</p>
              <p className="ticket-detail__subject">{activeTicket.subject}</p>
              <p className="ticket-detail__meta">
                {activeTicket.customerName} · {activeTicket.createdAt}
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
              />
              <div className="ticket-detail__actions">
                <select className="form-select form-select--sm">
                  <option value="open">Status: Offen</option>
                  <option value="in_progress">Status: In Bearbeitung</option>
                  <option value="closed">Status: Geschlossen</option>
                </select>
                <button className="btn-primary">Senden & aktualisieren</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
