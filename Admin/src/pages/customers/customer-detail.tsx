import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, ShoppingBag, Mail, Phone, Calendar } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { OrderStatus } from '../../types/index';

// Mock — wird durch echten API-Call ersetzt
const MOCK_CUSTOMER = {
  id:         '3',
  name:       'Sara König',
  email:      's.koenig@mail.de',
  phone:      '+49 170 9876543',
  createdAt:  '20.01.2026',
  orderCount: 12,
  totalSpent: '€ 1.204,50',
  avgOrder:   '€ 100,38',
  lastOrder:  '13.05.2026',
  orders: [
    { orderNumber: '#1040', date: '13.05.2026', total: '€ 56,00',  status: 'delivered' as OrderStatus, items: 1 },
    { orderNumber: '#1028', date: '01.05.2026', total: '€ 129,00', status: 'delivered' as OrderStatus, items: 2 },
    { orderNumber: '#1015', date: '15.04.2026', total: '€ 219,50', status: 'delivered' as OrderStatus, items: 3 },
    { orderNumber: '#1003', date: '28.03.2026', total: '€ 89,00',  status: 'delivered' as OrderStatus, items: 1 },
    { orderNumber: '#0992', date: '10.03.2026', total: '€ 44,90',  status: 'cancelled' as OrderStatus, items: 1 },
  ],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  new:       'Neu',
  paid:      'Bezahlt',
  shipped:   'Versendet',
  delivered: 'Zugestellt',
  cancelled: 'Storniert',
};

export default function CustomerDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const customer = MOCK_CUSTOMER; // TODO: fetch by id

  const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleExport = () => {
    // DSGVO-Export: erzeugt JSON mit allen Kundendaten
    const data = JSON.stringify(customer, null, 2);
    const blob  = new Blob([data], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `dsgvo-export-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (window.confirm(`Kundenkonto von ${customer.name} unwiderruflich löschen?\n\nAlle Daten werden gemäß DSGVO Art. 17 entfernt.`)) {
      // API call to delete customer
      navigate(ROUTES.CUSTOMERS.LIST);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <button className="back-btn" onClick={() => navigate(ROUTES.CUSTOMERS.LIST)}>
            <ArrowLeft size={15} strokeWidth={2} />
            Alle Kunden
          </button>
          <span className="page-header__eyebrow">Kunden</span>
          <h1 className="page-header__title">{customer.name}</h1>
          <p className="page-header__sub">Kunde seit {customer.createdAt}</p>
        </div>
        <div className="page-header__actions">
          <button className="btn-secondary" onClick={handleExport} title="DSGVO-Datenexport">
            <Download size={14} strokeWidth={2} />
            Daten exportieren
          </button>
          <button className="btn-danger" onClick={handleDelete} title="Konto löschen (DSGVO Art. 17)">
            <Trash2 size={14} strokeWidth={2} />
            Konto löschen
          </button>
        </div>
      </div>

      <div className="customer-detail-grid">
        {/* ── Linke Spalte ── */}
        <div>
          {/* Profil-Karte */}
          <div className="detail-card detail-card--profile">
            <div className="detail-card__body">
              <div className="customer-profile">
                <div className="customer-profile__avatar">{initials}</div>
                <div className="customer-profile__info">
                  <h2 className="customer-profile__name">{customer.name}</h2>
                  <div className="customer-profile__meta">
                    <span><Mail size={13} strokeWidth={2} />{customer.email}</span>
                    <span><Phone size={13} strokeWidth={2} />{customer.phone ?? '—'}</span>
                    <span><Calendar size={13} strokeWidth={2} />Seit {customer.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="customer-stats">
            <div className="customer-stat">
              <ShoppingBag size={18} strokeWidth={1.5} />
              <p className="customer-stat__value">{customer.orderCount}</p>
              <p className="customer-stat__label">Bestellungen</p>
            </div>
            <div className="customer-stat">
              <p className="customer-stat__value">{customer.totalSpent}</p>
              <p className="customer-stat__label">Gesamtumsatz</p>
            </div>
            <div className="customer-stat">
              <p className="customer-stat__value">{customer.avgOrder}</p>
              <p className="customer-stat__label">Ø Bestellwert</p>
            </div>
            <div className="customer-stat">
              <p className="customer-stat__value">{customer.lastOrder}</p>
              <p className="customer-stat__label">Letzte Bestellung</p>
            </div>
          </div>

          {/* Bestellhistorie */}
          <div className="detail-card">
            <div className="detail-card__header">
              <ShoppingBag size={15} strokeWidth={1.75} />
              Bestellhistorie
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bestellung</th>
                  <th>Datum</th>
                  <th>Artikel</th>
                  <th>Betrag</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map(o => (
                  <tr key={o.orderNumber}>
                    <td><strong>{o.orderNumber}</strong></td>
                    <td className="admin-table__muted">{o.date}</td>
                    <td className="admin-table__muted">{o.items} Artikel</td>
                    <td><strong>{o.total}</strong></td>
                    <td>
                      <span className={`status-badge status-badge--${o.status}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Rechte Spalte ── */}
        <div>
          {/* DSGVO-Bereich */}
          <div className="detail-card dsgvo-card">
            <div className="detail-card__header dsgvo-card__header">
              DSGVO — Betroffenenrechte
            </div>
            <div className="detail-card__body">
              <div className="dsgvo-action">
                <div className="dsgvo-action__info">
                  <p className="dsgvo-action__title">Datenauskunft (Art. 15)</p>
                  <p className="dsgvo-action__desc">
                    Exportiert alle gespeicherten Daten dieses Kunden als JSON-Datei.
                    Muss auf Anfrage innerhalb von 30 Tagen bereitgestellt werden.
                  </p>
                </div>
                <button className="btn-secondary" onClick={handleExport}>
                  <Download size={13} strokeWidth={2} />
                  Exportieren
                </button>
              </div>
              <div className="dsgvo-divider" />
              <div className="dsgvo-action">
                <div className="dsgvo-action__info">
                  <p className="dsgvo-action__title">Recht auf Löschung (Art. 17)</p>
                  <p className="dsgvo-action__desc">
                    Löscht das Kundenkonto und alle personenbezogenen Daten unwiderruflich.
                    Bestelldaten werden anonymisiert (Pflicht für Buchführung).
                  </p>
                </div>
                <button className="btn-danger" onClick={handleDelete}>
                  <Trash2 size={13} strokeWidth={2} />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
