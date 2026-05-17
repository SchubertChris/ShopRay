import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Download, Trash2, Mail, ShoppingBag, X } from 'lucide-react';
import { ROUTES } from '@config/routes';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  getAdminCustomers, getAdminCustomer, deleteAdminCustomer,
  type AdminCustomer, type AdminCustomerDetail,
} from '../../api/adminApi';

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function handleExport(detail: AdminCustomerDetail) {
  const data = JSON.stringify(detail, null, 2);
  const blob  = new Blob([data], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `dsgvo-export-${detail.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [customers, setCustomers]       = useState<AdminCustomer[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [detail, setDetail]             = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomer | null>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(-1);

  useEffect(() => {
    setLoading(true);
    getAdminCustomers(1, 200)
      .then(res => { setCustomers(res.data); setTotal(res.total); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) { setDetail(null); return; }
    setDetailLoading(true);
    getAdminCustomer(activeId)
      .then(setDetail)
      .catch(() => null)
      .finally(() => setDetailLoading(false));
  }, [activeId]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (panelRef.current && panelRef.current.scrollTop === 0)
      touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current < 0 || !panelRef.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) { panelRef.current.style.transition = 'none'; panelRef.current.style.transform = `translateY(${dy}px)`; }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current < 0 || !panelRef.current) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = -1;
    if (dy > 100) {
      panelRef.current.style.transition = 'transform 0.22s ease';
      panelRef.current.style.transform  = 'translateY(100%)';
      setTimeout(() => setActiveId(null), 220);
    } else {
      panelRef.current.style.transition = 'transform 0.25s cubic-bezier(0.32,0.72,0,1)';
      panelRef.current.style.transform  = '';
    }
  };

  const filtered = customers.filter(c =>
    (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCustomer(deleteTarget.id);
      setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id));
      if (activeId === deleteTarget.id) setActiveId(null);
    } catch { /* ignore */ }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Kunden</h1>
          <p className="page-header__sub">{total} Kunden insgesamt</p>
        </div>
      </div>

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
        <div className="filter-bar__hint">DSGVO: Export- und Lösch-Aktionen werden protokolliert.</div>
      </div>

      {detail && <div className="panel-backdrop" onClick={() => setActiveId(null)} />}
      <div className={`customer-split${detail ? ' has-detail' : ''}`}>
        <div className="data-card">
          <div className="data-card__body">
            {loading ? (
              <p className="data-card__empty">Lade Kunden…</p>
            ) : filtered.length === 0 ? (
              <p className="data-card__empty">Keine Kunden gefunden.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kunde</th>
                    <th>Rolle</th>
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
                          <div className="customer-row__avatar">{initials(c.name)}</div>
                          <div>
                            <p className="admin-table__primary">{c.name ?? '—'}</p>
                            <p className="admin-table__secondary">{c.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-table__muted">{c.role}</td>
                      <td className="admin-table__muted">
                        {new Date(c.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="table-actions">
                          <button
                            className="table-action"
                            title="DSGVO-Datenexport (Art. 15)"
                            onClick={async () => {
                              const d = await getAdminCustomer(c.id).catch(() => null);
                              if (d) handleExport(d);
                            }}
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
            )}
          </div>
        </div>

        {(detail || detailLoading) && (
          <div
            className="customer-panel"
            ref={panelRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {detailLoading ? (
              <p className="data-card__empty">Lade Details…</p>
            ) : detail && (
              <>
                <div className="customer-panel__header">
                  <button className="customer-panel__close" onClick={() => setActiveId(null)} title="Schließen">
                    <X size={15} strokeWidth={2} />
                  </button>
                  <div className="customer-panel__avatar">{initials(detail.name)}</div>
                  <div>
                    <p className="customer-panel__name">{detail.name ?? '—'}</p>
                    <p className="customer-panel__since">
                      Kunde seit {new Date(detail.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>

                <div className="customer-panel__section">
                  <p className="customer-panel__label">Kontakt</p>
                  {detail.email && (
                    <div className="customer-panel__row">
                      <Mail size={13} strokeWidth={2} className="customer-panel__icon" />
                      <a className="customer-panel__link" href={`mailto:${detail.email}`}>{detail.email}</a>
                    </div>
                  )}
                </div>

                <div className="customer-panel__stats">
                  <div className="customer-panel__stat">
                    <ShoppingBag size={15} strokeWidth={1.75} />
                    <p className="customer-panel__stat-value">{detail.orders.length}</p>
                    <p className="customer-panel__stat-label">Bestellungen</p>
                  </div>
                  <div className="customer-panel__stat">
                    <p className="customer-panel__stat-value">{detail.tickets.length}</p>
                    <p className="customer-panel__stat-label">Tickets</p>
                  </div>
                  <div className="customer-panel__stat">
                    <p className="customer-panel__stat-value">{detail.reviews.length}</p>
                    <p className="customer-panel__stat-label">Bewertungen</p>
                  </div>
                </div>

                <div className="customer-panel__section customer-panel__section--dsgvo">
                  <p className="customer-panel__label">DSGVO-Aktionen</p>
                  <button className="customer-panel__dsgvo-btn" onClick={() => handleExport(detail)}>
                    <Download size={13} strokeWidth={2} />
                    Daten exportieren (Art. 15)
                  </button>
                  <button
                    className="customer-panel__dsgvo-btn customer-panel__dsgvo-btn--danger"
                    onClick={() => setDeleteTarget(detail)}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                    Konto löschen (Art. 17)
                  </button>
                </div>

                <div className="customer-panel__footer">
                  <Link to={ROUTES.CUSTOMERS.detail(detail.id)} className="btn-secondary">
                    <Eye size={13} strokeWidth={2} />
                    Vollprofil öffnen
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 && !detail && (
        <p className="table-hint">Klick auf einen Kunden für die Schnellansicht</p>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Kundenkonto löschen?"
        description={`Das Konto von ${deleteTarget?.name ?? 'diesem Kunden'} wird unwiderruflich gelöscht. Alle personenbezogenen Daten werden gemäß DSGVO Art. 17 entfernt.`}
        confirmLabel="Konto löschen"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
