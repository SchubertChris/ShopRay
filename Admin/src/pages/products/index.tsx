import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, AlertCircle, Loader2, Pencil } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { deleteProduct, toggleProductActive } from '../../api/adminApi';
import type { AdminProduct } from '../../api/adminApi';
import type { ProductCategory } from '../../types/index';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { API_URL } from '../../api/adminApi';

type Density = 'compact' | 'normal';
const CATEGORIES: Array<'Alle' | ProductCategory> = ['Alle', 'Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst'];
const DENSITY_KEY = 'admin-product-density';

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts]             = useState<AdminProduct[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [category, setCategory]             = useState<'Alle' | ProductCategory>('Alle');
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [togglingId, setTogglingId]         = useState<string | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError]       = useState<string | null>(null);
  const [density, setDensity]               = useState<Density>(
    () => (localStorage.getItem(DENSITY_KEY) as Density | null) ?? 'normal',
  );

  const toggleDensity = () => {
    setDensity(prev => {
      const next: Density = prev === 'normal' ? 'compact' : 'normal';
      localStorage.setItem(DENSITY_KEY, next);
      return next;
    });
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminProduct[] = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleRowDoubleClick = (id: string) => {
    navigate(ROUTES.PRODUCTS.edit(id));
  };

  const handleToggleActive = async (e: React.MouseEvent, product: AdminProduct) => {
    e.stopPropagation();
    if (togglingId === product.id) return;
    setTogglingId(product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
    try {
      await toggleProductActive(product.id, !product.active);
    } catch {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: product.active } : p));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmProduct) return;
    setDeletingId(confirmProduct.id);
    setDeleteError(null);
    try {
      await deleteProduct(confirmProduct.id);
      setProducts(prev => prev.filter(p => p.id !== confirmProduct.id));
      setConfirmProduct(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === 'Alle' || p.category === category;
    return matchSearch && matchCat;
  });

  const formatPrice = (value: number) =>
    value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Produkte</h1>
          <p className="page-header__sub">
            {loading ? 'Lädt…' : `${products.length} Produkte insgesamt`}
          </p>
        </div>
        <div className="page-header__actions">
          <Link to={ROUTES.PRODUCTS.NEW} className="btn-primary">
            <Plus size={15} strokeWidth={2} />
            Neues Produkt
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar__search">
          <Search size={14} strokeWidth={2} className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Produkte durchsuchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-bar__input"
          />
        </div>
        <div className="filter-bar__tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-bar__tab${category === cat ? ' is-active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          className={`density-btn${density === 'compact' ? ' is-active' : ''}`}
          onClick={toggleDensity}
          title={density === 'compact' ? 'Zurück zur normalen Ansicht' : 'Kompaktere Ansicht'}
        >
          Kompakt
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="data-card data-card--error">
          <div className="data-card__body">
            <div className="admin-table__empty">
              <AlertCircle size={18} strokeWidth={1.5} />
              Fehler beim Laden: {error}
              <button className="btn-secondary btn-secondary--ml" onClick={fetchProducts}>
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="data-card">
          <div className="data-card__body">
            <table className={`admin-table${density === 'compact' ? ' admin-table--compact' : ''}`}>
              <thead>
                <tr>
                  <th className="admin-table__th--narrow">#</th>
                  <th>Produkt</th>
                  <th>Kategorie</th>
                  <th>Preis</th>
                  <th>Lager</th>
                  <th>Status</th>
                  <th>Badge</th>
                  <th className="admin-table__th--action">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="admin-table__skeleton-row">
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td>
                        <div className="product-thumb">
                          <div className="product-thumb__img skeleton" />
                          <div>
                            <span className="skeleton skeleton--md" />
                            <span className="skeleton skeleton--sm" />
                          </div>
                        </div>
                      </td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--xs" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-table__empty">
                      <AlertCircle size={18} strokeWidth={1.5} />
                      Keine Produkte gefunden
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr
                      key={p.id}
                      className={[
                        'admin-table__row--clickable',
                        deletingId === p.id ? 'admin-table__row--deleting' : '',
                      ].filter(Boolean).join(' ')}
                      onDoubleClick={() => handleRowDoubleClick(p.id)}
                    >
                      <td className="admin-table__muted">{p.id.slice(0, 6)}</td>
                      <td>
                        <div className="product-thumb">
                          <div className="product-thumb__img">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} onContextMenu={e => e.preventDefault()} />
                              : <span className="product-thumb__placeholder">{p.name[0]}</span>
                            }
                          </div>
                          <div>
                            <p className="product-thumb__name">{p.name}</p>
                            <p className="product-thumb__slug">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="cat-badge">{p.category}</span></td>
                      <td>
                        <span className="admin-table__price">€ {formatPrice(p.price)}</span>
                        {p.old_price != null && (
                          <span className="admin-table__old-price">€ {formatPrice(p.old_price)}</span>
                        )}
                      </td>
                      <td>
                        <span className={`stock-badge${p.stock === 0 ? ' stock-badge--out' : p.stock <= 5 ? ' stock-badge--low' : ''}`}>
                          {p.stock === 0 ? 'Ausverkauft' : `${p.stock} Stk.`}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`status-badge status-badge--toggle ${p.active ? 'status-badge--active' : 'status-badge--inactive'}`}
                          onClick={e => handleToggleActive(e, p)}
                          onDoubleClick={e => e.stopPropagation()}
                          disabled={togglingId === p.id}
                          title={p.active ? 'Klicken um zu deaktivieren' : 'Klicken um zu aktivieren'}
                        >
                          {togglingId === p.id
                            ? <Loader2 size={10} strokeWidth={2} className="spin" />
                            : (p.active ? 'Aktiv' : 'Inaktiv')
                          }
                        </button>
                      </td>
                      <td>
                        {p.badge
                          ? <span className="product-badge">{p.badge}</span>
                          : <span className="admin-table__muted">—</span>
                        }
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            to={ROUTES.PRODUCTS.edit(p.id)}
                            className="table-action"
                            title="Bearbeiten"
                            onClick={e => e.stopPropagation()}
                          >
                            <Pencil size={13} strokeWidth={2} />
                          </Link>
                          <button
                            className="table-action table-action--danger"
                            title="Löschen"
                            onClick={e => { e.stopPropagation(); setConfirmProduct(p); }}
                            onDoubleClick={e => e.stopPropagation()}
                            disabled={deletingId === p.id}
                          >
                            {deletingId === p.id
                              ? <Loader2 size={13} strokeWidth={2} className="spin" />
                              : <Trash2 size={13} strokeWidth={2} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <p className="table-hint">Stift-Icon oder Doppelklick zum Bearbeiten · Klick auf Status zum Umschalten</p>
      )}

      <ConfirmDialog
        isOpen={!!confirmProduct}
        title="Produkt löschen?"
        description={`„${confirmProduct?.name}" wird unwiderruflich gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        variant="danger"
        loading={!!deletingId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmProduct(null); setDeleteError(null); }}
      />

      <ConfirmDialog
        isOpen={!!deleteError}
        title="Fehler beim Löschen"
        description={deleteError ?? ''}
        confirmLabel="OK"
        cancelLabel=""
        variant="warning"
        onConfirm={() => setDeleteError(null)}
        onCancel={() => setDeleteError(null)}
      />
    </>
  );
}
