import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { OrderStatus } from '../../types/index';

interface MockOrder {
  id:            string;
  orderNumber:   string;
  customerName:  string;
  customerEmail: string;
  total:         string;
  status:        OrderStatus;
  items:         number;
  date:          string;
}

const MOCK_ORDERS: MockOrder[] = [
  { id: '1', orderNumber: '#1042', customerName: 'Laura Meier',    customerEmail: 'l.meier@mail.de',   total: '€ 89,00',   status: 'paid',      items: 2, date: '14.05.2026' },
  { id: '2', orderNumber: '#1041', customerName: 'Jonas Braun',    customerEmail: 'j.braun@mail.de',   total: '€ 124,50',  status: 'shipped',   items: 3, date: '13.05.2026' },
  { id: '3', orderNumber: '#1040', customerName: 'Sara König',     customerEmail: 's.koenig@mail.de',  total: '€ 56,00',   status: 'delivered', items: 1, date: '13.05.2026' },
  { id: '4', orderNumber: '#1039', customerName: 'Max Müller',     customerEmail: 'm.mueller@mail.de', total: '€ 210,00',  status: 'pending',       items: 4, date: '12.05.2026' },
  { id: '5', orderNumber: '#1038', customerName: 'Anna Schmidt',   customerEmail: 'a.schmidt@mail.de', total: '€ 38,00',   status: 'cancelled', items: 1, date: '11.05.2026' },
  { id: '6', orderNumber: '#1037', customerName: 'Felix Wagner',   customerEmail: 'f.wagner@mail.de',  total: '€ 67,50',   status: 'delivered', items: 2, date: '10.05.2026' },
  { id: '7', orderNumber: '#1036', customerName: 'Mia Becker',     customerEmail: 'm.becker@mail.de',  total: '€ 159,00',  status: 'shipped',   items: 3, date: '09.05.2026' },
  { id: '8', orderNumber: '#1035', customerName: 'Lukas Hoffmann', customerEmail: 'l.hoffmann@web.de', total: '€ 44,90',   status: 'paid',      items: 2, date: '08.05.2026' },
  { id: '9', orderNumber: '#1034', customerName: 'Sophie Fischer', customerEmail: 's.fischer@web.de',  total: '€ 319,00',  status: 'delivered', items: 5, date: '07.05.2026' },
  { id: '10',orderNumber: '#1033', customerName: 'Tim Schulz',     customerEmail: 't.schulz@web.de',   total: '€ 79,90',   status: 'pending',       items: 1, date: '06.05.2026' },
];

const STATUS_TABS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all',           label: 'Alle'        },
  { key: 'pending',       label: 'Ausstehend'  },
  { key: 'paid',          label: 'Bezahlt'     },
  { key: 'shipped',       label: 'Versendet'   },
  { key: 'delivered',     label: 'Zugestellt'  },
  { key: 'cancelled',     label: 'Storniert'   },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:        'Ausstehend',
  paid:           'Bezahlt',
  shipped:        'Versendet',
  delivered:      'Zugestellt',
  cancelled:      'Storniert',
  payment_failed: 'Zahlung fehlgeschlagen',
  refunded:       'Erstattet',
};

export default function OrdersPage() {
  const [active, setActive] = useState<OrderStatus | 'all'>('all');

  const filtered = active === 'all'
    ? MOCK_ORDERS
    : MOCK_ORDERS.filter(o => o.status === active);

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? MOCK_ORDERS.length
      : MOCK_ORDERS.filter(o => o.status === tab.key).length;
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Bestellungen</h1>
          <p className="page-header__sub">{MOCK_ORDERS.length} Bestellungen insgesamt</p>
        </div>
      </div>

      {/* Status-Tabs */}
      <div className="tab-nav">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-nav__item${active === tab.key ? ' is-active' : ''}`}
            onClick={() => setActive(tab.key as OrderStatus | 'all')}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`tab-nav__count${active === tab.key ? ' is-active' : ''}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="data-card__body">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bestellung</th>
                <th>Kunde</th>
                <th>Artikel</th>
                <th>Betrag</th>
                <th>Status</th>
                <th>Datum</th>
                <th style={{ width: 48 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>
                    <p className="admin-table__primary">{o.customerName}</p>
                    <p className="admin-table__secondary">{o.customerEmail}</p>
                  </td>
                  <td className="admin-table__muted">{o.items} Artikel</td>
                  <td><strong>{o.total}</strong></td>
                  <td>
                    <span className={`status-badge status-badge--${o.status}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="admin-table__muted">{o.date}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={ROUTES.ORDERS.detail(o.id)} className="table-action" title="Details">
                        <Eye size={13} strokeWidth={2} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
