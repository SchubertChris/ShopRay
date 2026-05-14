import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, User, MapPin, Clock } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { OrderStatus } from '../../types/index';

// Mock — wird durch echten API-Call ersetzt
const MOCK_ORDER = {
  id:            '4',
  orderNumber:   '#1039',
  createdAt:     '12.05.2026 14:32',
  status:        'new' as OrderStatus,
  customerName:  'Max Müller',
  customerEmail: 'm.mueller@mail.de',
  customerPhone: '+49 160 5551234',
  shippingAddress: {
    name:    'Max Müller',
    street:  'Musterstraße 42',
    zip:     '10115',
    city:    'Berlin',
    country: 'Deutschland',
  },
  items: [
    { id: 1, name: 'Emaille-Topf Set 3-tlg.',  qty: 1, price: '129,00', total: '129,00' },
    { id: 2, name: 'Holzschale Eiche',          qty: 2, price: '59,00',  total: '118,00' },
    { id: 3, name: 'Duftkerze Zedernholz',      qty: 1, price: '18,90',  total: '18,90'  },
  ],
  subtotal: '265,90',
  shipping:  '4,90',
  discount:  null as string | null,
  total:    '210,00',
  note:     'Bitte als Geschenk verpacken.',
  timeline: [
    { status: 'new',  label: 'Bestellung eingegangen', date: '12.05.2026 14:32' },
  ],
};

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'new',       label: 'Neu'         },
  { value: 'paid',      label: 'Bezahlt'     },
  { value: 'shipped',   label: 'Versendet'   },
  { value: 'delivered', label: 'Zugestellt'  },
  { value: 'cancelled', label: 'Storniert'   },
];

const STATUS_TIMELINE: Record<OrderStatus, string> = {
  new:       'Bestellung eingegangen',
  paid:      'Zahlung bestätigt',
  shipped:   'Paket versendet',
  delivered: 'Zugestellt',
  cancelled: 'Storniert',
};

export default function OrderDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const order        = MOCK_ORDER; // TODO: fetch by id
  const [status, setStatus] = useState<OrderStatus>(order.status);

  const handleSave = () => {
    // API call to update status
    console.log('Update order', id, 'status to', status);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <button className="back-btn" onClick={() => navigate(ROUTES.ORDERS.LIST)}>
            <ArrowLeft size={15} strokeWidth={2} />
            Alle Bestellungen
          </button>
          <span className="page-header__eyebrow">Bestellungen</span>
          <h1 className="page-header__title">{order.orderNumber}</h1>
          <p className="page-header__sub">{order.createdAt}</p>
        </div>
        <div className="page-header__actions">
          <select
            className="form-select"
            value={status}
            onChange={e => setStatus(e.target.value as OrderStatus)}
            style={{ width: 'auto' }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={14} strokeWidth={2} />
            Speichern
          </button>
        </div>
      </div>

      <div className="order-detail-grid">
        {/* ── Linke Spalte ── */}
        <div className="order-detail-col">

          {/* Artikel */}
          <div className="detail-card">
            <div className="detail-card__header">
              <Package size={15} strokeWidth={1.75} />
              Artikel
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Menge</th>
                  <th>Einzelpreis</th>
                  <th style={{ textAlign: 'right' }}>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="order-item-row">
                        <div className="order-item-row__thumb" />
                        <span className="admin-table__primary">{item.name}</span>
                      </div>
                    </td>
                    <td className="admin-table__muted">× {item.qty}</td>
                    <td className="admin-table__muted">€ {item.price}</td>
                    <td style={{ textAlign: 'right' }}><strong>€ {item.total}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="order-summary">
              <div className="order-summary__row">
                <span>Zwischensumme</span>
                <span>€ {order.subtotal}</span>
              </div>
              <div className="order-summary__row">
                <span>Versand</span>
                <span>€ {order.shipping}</span>
              </div>
              {order.discount && (
                <div className="order-summary__row order-summary__row--discount">
                  <span>Rabatt</span>
                  <span>−€ {order.discount}</span>
                </div>
              )}
              <div className="order-summary__row order-summary__row--total">
                <span>Gesamt</span>
                <span>€ {order.total}</span>
              </div>
            </div>
          </div>

          {/* Kundennotiz */}
          {order.note && (
            <div className="detail-card">
              <div className="detail-card__header">
                <Clock size={15} strokeWidth={1.75} />
                Kundennotiz
              </div>
              <div className="detail-card__body">
                <p className="detail-note">{order.note}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Rechte Spalte ── */}
        <div className="order-detail-col order-detail-col--side">

          {/* Kunde */}
          <div className="detail-card">
            <div className="detail-card__header">
              <User size={15} strokeWidth={1.75} />
              Kunde
            </div>
            <div className="detail-card__body">
              <div className="detail-info-list">
                <div className="detail-info-item">
                  <span className="detail-info-item__label">Name</span>
                  <span className="detail-info-item__value">{order.customerName}</span>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-item__label">E-Mail</span>
                  <a href={`mailto:${order.customerEmail}`} className="detail-info-item__link">
                    {order.customerEmail}
                  </a>
                </div>
                <div className="detail-info-item">
                  <span className="detail-info-item__label">Telefon</span>
                  <span className="detail-info-item__value">{order.customerPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lieferadresse */}
          <div className="detail-card">
            <div className="detail-card__header">
              <MapPin size={15} strokeWidth={1.75} />
              Lieferadresse
            </div>
            <div className="detail-card__body">
              <address className="detail-address">
                {order.shippingAddress.name}<br />
                {order.shippingAddress.street}<br />
                {order.shippingAddress.zip} {order.shippingAddress.city}<br />
                {order.shippingAddress.country}
              </address>
            </div>
          </div>

          {/* Timeline */}
          <div className="detail-card">
            <div className="detail-card__header">
              <Clock size={15} strokeWidth={1.75} />
              Verlauf
            </div>
            <div className="detail-card__body">
              <div className="order-timeline">
                {STATUS_OPTIONS.map((opt, i) => {
                  const statusIndex   = STATUS_OPTIONS.findIndex(s => s.value === status);
                  const optionIndex   = i;
                  const isDone        = optionIndex <= statusIndex;
                  const timelineEntry = order.timeline.find(t => t.status === opt.value);

                  return (
                    <div key={opt.value} className={`timeline-step${isDone ? ' is-done' : ''}`}>
                      <div className="timeline-step__dot" />
                      <div className="timeline-step__content">
                        <p className="timeline-step__label">{STATUS_TIMELINE[opt.value]}</p>
                        {timelineEntry && (
                          <p className="timeline-step__date">{timelineEntry.date}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
