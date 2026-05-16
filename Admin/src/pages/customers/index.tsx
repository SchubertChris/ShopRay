import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Download, Trash2, Mail, Phone, ShoppingBag, X, Calendar } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { Customer } from '../../types/index';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface CustomerExtended extends Customer {
  totalSpent:  string;
  lastOrder?:  string;
  avgOrder?:   string;
}

const MOCK_CUSTOMERS: CustomerExtended[] = [
  { id: '1',  name: 'Laura Meier',    email: 'l.meier@mail.de',    phone: '+49 151 1234567', orderCount: 7,  totalSpent: '€ 543,20',   createdAt: '12.01.2026', lastOrder: '14.05.2026', avgOrder: '€ 77,60' },
  { id: '2',  name: 'Jonas Braun',    email: 'j.braun@mail.de',    phone: null,              orderCount: 3,  totalSpent: '€ 287,00',   createdAt: '15.01.2026', lastOrder: '13.05.2026', avgOrder: '€ 95,67' },
  { id: '3',  name: 'Sara König',     email: 's.koenig@mail.de',   phone: '+49 170 9876543', orderCount: 12, totalSpent: '€ 1.204,50', createdAt: '20.01.2026', lastOrder: '13.05.2026', avgOrder: '€ 100,38' },
  { id: '4',  name: 'Max Müller',     email: 'm.mueller@mail.de',  phone: '+49 160 5551234', orderCount: 1,  totalSpent: '€ 210,00',   createdAt: '03.02.2026', lastOrder: '12.05.2026', avgOrder: '€ 210,00' },
  { id: '5',  name: 'Anna Schmidt',   email: 'a.schmidt@mail.de',  phone: null,              orderCount: 5,  totalSpent: '€ 398,70',   createdAt: '08.02.2026', lastOrder: '11.05.2026', avgOrder: '€ 79,74' },
  { id: '6',  name: 'Felix Wagner',   email: 'f.wagner@mail.de',   phone: '+49 176 8881234', orderCount: 4,  totalSpent: '€ 324,00',   createdAt: '14.02.2026', lastOrder: '10.05.2026', avgOrder: '€ 81,00' },
  { id: '7',  name: 'Mia Becker',     email: 'm.becker@mail.de',   phone: '+49 152 4447890', orderCount: 9,  totalSpent: '€ 871,20',   createdAt: '01.03.2026', lastOrder: '09.05.2026', avgOrder: '€ 96,80' },
  { id: '8',  name: 'Lukas Hoffmann', email: 'l.hoffmann@web.de',  phone: null,              orderCount: 2,  totalSpent: '€ 129,80',   createdAt: '10.03.2026', lastOrder: '08.05.2026', avgOrder: '€ 64,90' },
  { id: '9',  name: 'Sophie Fischer', email: 's.fischer@web.de',   phone: '+49 177 2223344', orderCount: 15, totalSpent: '€ 2.145,00', createdAt: '18.03.2026', lastOrder: '07.05.2026', avgOrder: '€ 143,00' },
  { id: '10', name: 'Tim Schulz',     email: 't.schulz@web.de',    phone: null,              orderCount: 1,  totalSpent: '€ 79,90',    createdAt: '25.04.2026', lastOrder: '06.05.2026', avgOrder: '€ 79,90' },
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function handleExport(customer: CustomerExtended) {
  const data = JSON.stringify(customer, null, 2);
  const blob  = new Blob([data], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `dsgvo-export-${customer.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [search, setSearch]             = useState('');
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerExtended | null>(null);
  const [customers, setCustomers]       = useState(MOCK_CUSTOMERS);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCustomer = activeId ? customers.find(c => c.id === activeId) ?? null : null;

  const handleDelete = () => {
    if (!deleteTarget) return;
    setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id));
    if (activeId === deleteTarget.id) setActiveId(null);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Kunden</h1>
          <p className="page-header__sub">{customers.length} Kunden insgesamt</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar__search">
          <Search size={14} strokeWidth={2} className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-bar__input"
          />
        </div>
        <div className="filter-bar__hint">
          DSGVO: Export- und Lösch-Aktionen werden protokolliert.
        </div>
      </div>

      {/* Split View */}
      {activeCustomer && <div className="panel-backdrop" onClick={() => setActiveId(null)} />}
      <div className={`customer-split${activeCustomer ? ' has-detail' : ''}`}>
        {/* Table */}
        <div className="data-card">
          <div className="data-card__body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th>Telefon</th>
                  <th>Bestellungen</th>
                  <th>Umsatz</th>
                  <th>Seit</th>
                  <th className="admin-table__th--action">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    className={`admin-table__row--clickable${activeId === c.id ? ' is-selected' : ''}`}
                    onClick={() => setActiveId(prev => prev === c.id ? null : c.id)}
                  >
                    <td>
                      <div className="customer-row">
                        <div className="customer-row__avatar">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="admin-table__primary">{c.name}</p>
                          <p className="admin-table__secondary">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table__muted">{c.phone ?? '—'}</td>
                    <td>{c.orderCount} Bestellungen</td>
                    <td><strong>{c.totalSpent}</strong></td>
                    <td className="admin-table__muted">{c.createdAt}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        <button
                          className="table-action"
                          title="DSGVO-Datenexport (Art. 15)"
                          onClick={() => handleExport(c)}
                        >
                          <Download size={13} strokeWidth={2} />
                        </button>
                        <button
                          className="table-action table-action--danger"
                          title="Konto löschen (DSGVO Art. 17)"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail Panel */}
        {activeCustomer && (
          <div className="customer-panel">
            <div className="customer-panel__header">
              <button
                className="customer-panel__close"
                onClick={() => setActiveId(null)}
                title="Schließen"
              >
                <X size={15} strokeWidth={2} />
              </button>
              <div className="customer-panel__avatar">{initials(activeCustomer.name)}</div>
              <div>
                <p className="customer-panel__name">{activeCustomer.name}</p>
                <p className="customer-panel__since">Kunde seit {activeCustomer.createdAt}</p>
              </div>
            </div>

            <div className="customer-panel__section">
              <p className="customer-panel__label">Kontakt</p>
              <div className="customer-panel__row">
                <Mail size={13} strokeWidth={2} className="customer-panel__icon" />
                <a className="customer-panel__link" href={`mailto:${activeCustomer.email}`}>
                  {activeCustomer.email}
                </a>
              </div>
              {activeCustomer.phone && (
                <div className="customer-panel__row">
                  <Phone size={13} strokeWidth={2} className="customer-panel__icon" />
                  <span>{activeCustomer.phone}</span>
                </div>
              )}
              {activeCustomer.lastOrder && (
                <div className="customer-panel__row">
                  <Calendar size={13} strokeWidth={2} className="customer-panel__icon" />
                  <span className="admin-table__muted">Letzte Bestellung: {activeCustomer.lastOrder}</span>
                </div>
              )}
            </div>

            <div className="customer-panel__stats">
              <div className="customer-panel__stat">
                <ShoppingBag size={15} strokeWidth={1.75} />
                <p className="customer-panel__stat-value">{activeCustomer.orderCount}</p>
                <p className="customer-panel__stat-label">Bestellungen</p>
              </div>
              <div className="customer-panel__stat">
                <p className="customer-panel__stat-value">{activeCustomer.totalSpent}</p>
                <p className="customer-panel__stat-label">Gesamtumsatz</p>
              </div>
              <div className="customer-panel__stat">
                <p className="customer-panel__stat-value">{activeCustomer.avgOrder ?? '—'}</p>
                <p className="customer-panel__stat-label">Ø Bestellwert</p>
              </div>
            </div>

            <div className="customer-panel__section customer-panel__section--dsgvo">
              <p className="customer-panel__label">DSGVO-Aktionen</p>
              <button
                className="customer-panel__dsgvo-btn"
                onClick={() => handleExport(activeCustomer)}
              >
                <Download size={13} strokeWidth={2} />
                Daten exportieren (Art. 15)
              </button>
              <button
                className="customer-panel__dsgvo-btn customer-panel__dsgvo-btn--danger"
                onClick={() => setDeleteTarget(activeCustomer)}
              >
                <Trash2 size={13} strokeWidth={2} />
                Konto löschen (Art. 17)
              </button>
            </div>

            <div className="customer-panel__footer">
              <Link to={ROUTES.CUSTOMERS.detail(activeCustomer.id)} className="btn-secondary">
                <Eye size={13} strokeWidth={2} />
                Vollprofil öffnen
              </Link>
            </div>
          </div>
        )}
      </div>

      {filtered.length > 0 && !activeCustomer && (
        <p className="table-hint">Klick auf einen Kunden für die Schnellansicht</p>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Kundenkonto löschen?"
        description={`Das Konto von ${deleteTarget?.name} wird unwiderruflich gelöscht. Alle personenbezogenen Daten werden gemäß DSGVO Art. 17 entfernt.`}
        confirmLabel="Konto löschen"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
