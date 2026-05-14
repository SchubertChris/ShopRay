import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Download, Trash2 } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { Customer } from '../../types/index';

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Laura Meier',    email: 'l.meier@mail.de',    phone: '+49 151 1234567', orderCount: 7,  totalSpent: '€ 543,20', createdAt: '12.01.2026' },
  { id: '2', name: 'Jonas Braun',    email: 'j.braun@mail.de',    phone: null,              orderCount: 3,  totalSpent: '€ 287,00', createdAt: '15.01.2026' },
  { id: '3', name: 'Sara König',     email: 's.koenig@mail.de',   phone: '+49 170 9876543', orderCount: 12, totalSpent: '€ 1.204,50',createdAt: '20.01.2026' },
  { id: '4', name: 'Max Müller',     email: 'm.mueller@mail.de',  phone: '+49 160 5551234', orderCount: 1,  totalSpent: '€ 210,00', createdAt: '03.02.2026' },
  { id: '5', name: 'Anna Schmidt',   email: 'a.schmidt@mail.de',  phone: null,              orderCount: 5,  totalSpent: '€ 398,70', createdAt: '08.02.2026' },
  { id: '6', name: 'Felix Wagner',   email: 'f.wagner@mail.de',   phone: '+49 176 8881234', orderCount: 4,  totalSpent: '€ 324,00', createdAt: '14.02.2026' },
  { id: '7', name: 'Mia Becker',     email: 'm.becker@mail.de',   phone: '+49 152 4447890', orderCount: 9,  totalSpent: '€ 871,20', createdAt: '01.03.2026' },
  { id: '8', name: 'Lukas Hoffmann', email: 'l.hoffmann@web.de',  phone: null,              orderCount: 2,  totalSpent: '€ 129,80', createdAt: '10.03.2026' },
  { id: '9', name: 'Sophie Fischer', email: 's.fischer@web.de',   phone: '+49 177 2223344', orderCount: 15, totalSpent: '€ 2.145,00',createdAt: '18.03.2026' },
  { id: '10',name: 'Tim Schulz',     email: 't.schulz@web.de',    phone: null,              orderCount: 1,  totalSpent: '€ 79,90',  createdAt: '25.04.2026' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Kunden</h1>
          <p className="page-header__sub">{MOCK_CUSTOMERS.length} Kunden insgesamt</p>
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
          DSGVO: Alle Export- und Lösch-Aktionen werden protokolliert.
        </div>
      </div>

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
                <th>Kunde seit</th>
                <th style={{ width: 100 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="customer-row">
                      <div className="customer-row__avatar">
                        {c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
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
                  <td>
                    <div className="table-actions">
                      <Link to={ROUTES.CUSTOMERS.detail(c.id)} className="table-action" title="Profil">
                        <Eye size={13} strokeWidth={2} />
                      </Link>
                      <button className="table-action" title="DSGVO-Export">
                        <Download size={13} strokeWidth={2} />
                      </button>
                      <button className="table-action table-action--danger" title="Konto löschen (DSGVO)">
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
    </>
  );
}
