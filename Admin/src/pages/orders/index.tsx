import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, X, Package, User, Mail, CreditCard, Truck, CheckCircle, XCircle, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
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
  address?:      string;
  paymentMethod?: string;
}

const MOCK_ORDERS: MockOrder[] = [
  { id: '1',  orderNumber: '#1042', customerName: 'Laura Meier',    customerEmail: 'l.meier@mail.de',   total: '€ 89,00',   status: 'paid',           items: 2, date: '14.05.2026', address: 'Musterstr. 12, 10115 Berlin',      paymentMethod: 'Kreditkarte' },
  { id: '2',  orderNumber: '#1041', customerName: 'Jonas Braun',    customerEmail: 'j.braun@mail.de',   total: '€ 124,50',  status: 'shipped',        items: 3, date: '13.05.2026', address: 'Hauptstr. 5, 80331 München',       paymentMethod: 'PayPal' },
  { id: '3',  orderNumber: '#1040', customerName: 'Sara König',     customerEmail: 's.koenig@mail.de',  total: '€ 56,00',   status: 'delivered',      items: 1, date: '13.05.2026', address: 'Bahnhofstr. 3, 70173 Stuttgart',   paymentMethod: 'Kreditkarte' },
  { id: '4',  orderNumber: '#1039', customerName: 'Max Müller',     customerEmail: 'm.mueller@mail.de', total: '€ 210,00',  status: 'pending',        items: 4, date: '12.05.2026', address: 'Gartenweg 8, 60311 Frankfurt',     paymentMethod: 'Vorkasse' },
  { id: '5',  orderNumber: '#1038', customerName: 'Anna Schmidt',   customerEmail: 'a.schmidt@mail.de', total: '€ 38,00',   status: 'cancelled',      items: 1, date: '11.05.2026', address: 'Lindenstr. 22, 50667 Köln',        paymentMethod: 'PayPal' },
  { id: '6',  orderNumber: '#1037', customerName: 'Felix Wagner',   customerEmail: 'f.wagner@mail.de',  total: '€ 67,50',   status: 'delivered',      items: 2, date: '10.05.2026', address: 'Rosestr. 1, 40210 Düsseldorf',     paymentMethod: 'Kreditkarte' },
  { id: '7',  orderNumber: '#1036', customerName: 'Mia Becker',     customerEmail: 'm.becker@mail.de',  total: '€ 159,00',  status: 'shipped',        items: 3, date: '09.05.2026', address: 'Bergstr. 17, 04109 Leipzig',       paymentMethod: 'PayPal' },
  { id: '8',  orderNumber: '#1035', customerName: 'Lukas Hoffmann', customerEmail: 'l.hoffmann@web.de', total: '€ 44,90',   status: 'paid',           items: 2, date: '08.05.2026', address: 'Waldweg 6, 01067 Dresden',         paymentMethod: 'Kreditkarte' },
  { id: '9',  orderNumber: '#1034', customerName: 'Sophie Fischer', customerEmail: 's.fischer@web.de',  total: '€ 319,00',  status: 'delivered',      items: 5, date: '07.05.2026', address: 'Seestr. 30, 90403 Nürnberg',      paymentMethod: 'Kreditkarte' },
  { id: '10', orderNumber: '#1033', customerName: 'Tim Schulz',     customerEmail: 't.schulz@web.de',   total: '€ 79,90',   status: 'payment_failed', items: 1, date: '06.05.2026', address: 'Kirchgasse 9, 20095 Hamburg',      paymentMethod: 'Kreditkarte' },
];

const STATUS_TABS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all',           label: 'Alle'        },
  { key: 'pending',       label: 'Ausstehend'  },
  { key: 'paid',          label: 'Bezahlt'     },
  { key: 'shipped',       label: 'Versendet'   },
  { key: 'delivered',     label: 'Zugestellt'  },
  { key: 'cancelled',     label: 'Storniert'   },
  { key: 'payment_failed',label: 'Zahlung fehlg.' },
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

const STATUS_ICONS: Record<OrderStatus, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  pending:        Clock,
  paid:           CreditCard,
  shipped:        Truck,
  delivered:      CheckCircle,
  cancelled:      XCircle,
  payment_failed: AlertTriangle,
  refunded:       RotateCcw,
};

export default function OrdersPage() {
  const [activeTab, setActiveTab]   = useState<OrderStatus | 'all'>('all');
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [status, setStatus]         = useState<Record<string, OrderStatus>>({});

  const getStatus = (o: MockOrder): OrderStatus => status[o.id] ?? o.status;

  const filtered = activeTab === 'all'
    ? MOCK_ORDERS
    : MOCK_ORDERS.filter(o => getStatus(o) === activeTab);

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? MOCK_ORDERS.length
      : MOCK_ORDERS.filter(o => getStatus(o) === tab.key).length;
    return acc;
  }, {});

  const activeOrder = activeId ? MOCK_ORDERS.find(o => o.id === activeId) ?? null : null;
  const activeStatus = activeOrder ? getStatus(activeOrder) : null;

  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    setStatus(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleRowClick = (id: string) => {
    setActiveId(prev => prev === id ? null : id);
  };

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
            className={`tab-nav__item${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => { setActiveTab(tab.key as OrderStatus | 'all'); setActiveId(null); }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`tab-nav__count${activeTab === tab.key ? ' is-active' : ''}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Split View */}
      <div className={`order-split${activeOrder ? ' has-detail' : ''}`}>
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
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const currentStatus = getStatus(o);
                  return (
                    <tr
                      key={o.id}
                      className={`admin-table__row--clickable${activeId === o.id ? ' is-selected' : ''}`}
                      onClick={() => handleRowClick(o.id)}
                    >
                      <td><strong>{o.orderNumber}</strong></td>
                      <td>
                        <p className="admin-table__primary">{o.customerName}</p>
                        <p className="admin-table__secondary">{o.customerEmail}</p>
                      </td>
                      <td className="admin-table__muted">{o.items} Artikel</td>
                      <td><strong>{o.total}</strong></td>
                      <td>
                        <span className={`status-badge status-badge--${currentStatus}`}>
                          {STATUS_LABELS[currentStatus]}
                        </span>
                      </td>
                      <td className="admin-table__muted">{o.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {activeOrder && activeStatus && (
          <div className="order-detail">
            <div className="order-detail__header">
              <div className="order-detail__header-top">
                <p className="order-detail__number">{activeOrder.orderNumber}</p>
                <button className="order-detail__close" onClick={() => setActiveId(null)} title="Schließen">
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
              <span className={`status-badge status-badge--${activeStatus}`}>
                {STATUS_LABELS[activeStatus]}
              </span>
              <p className="order-detail__date">{activeOrder.date}</p>
            </div>

            <div className="order-detail__section">
              <p className="order-detail__label">Kunde</p>
              <div className="order-detail__row">
                <User size={13} strokeWidth={2} className="order-detail__icon" />
                <span>{activeOrder.customerName}</span>
              </div>
              <div className="order-detail__row">
                <Mail size={13} strokeWidth={2} className="order-detail__icon" />
                <a className="order-detail__link" href={`mailto:${activeOrder.customerEmail}`}>
                  {activeOrder.customerEmail}
                </a>
              </div>
            </div>

            <div className="order-detail__section">
              <p className="order-detail__label">Bestellung</p>
              <div className="order-detail__row">
                <Package size={13} strokeWidth={2} className="order-detail__icon" />
                <span>{activeOrder.items} Artikel</span>
              </div>
              <div className="order-detail__total">
                <span className="order-detail__total-label">Gesamtbetrag</span>
                <span className="order-detail__total-value">{activeOrder.total}</span>
              </div>
              {activeOrder.paymentMethod && (
                <div className="order-detail__row">
                  <CreditCard size={13} strokeWidth={2} className="order-detail__icon" />
                  <span className="admin-table__muted">{activeOrder.paymentMethod}</span>
                </div>
              )}
              {activeOrder.address && (
                <p className="order-detail__address">{activeOrder.address}</p>
              )}
            </div>

            <div className="order-detail__section">
              <p className="order-detail__label">Status ändern</p>
              <select
                className="form-select"
                value={activeStatus}
                onChange={e => handleStatusChange(activeOrder.id, e.target.value as OrderStatus)}
              >
                <option value="pending">Ausstehend</option>
                <option value="paid">Bezahlt</option>
                <option value="shipped">Versendet</option>
                <option value="delivered">Zugestellt</option>
                <option value="cancelled">Storniert</option>
                <option value="refunded">Erstattet</option>
              </select>
            </div>

            <div className="order-detail__footer">
              <Link to={ROUTES.ORDERS.detail(activeOrder.id)} className="btn-secondary">
                <Eye size={13} strokeWidth={2} />
                Vollansicht
              </Link>
            </div>
          </div>
        )}
      </div>

      {filtered.length > 0 && !activeOrder && (
        <p className="table-hint">Klick auf eine Zeile für Details und Statusänderung</p>
      )}
    </>
  );
}
