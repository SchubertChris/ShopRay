import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { deleteProduct } from '../../api/adminApi';
import type { AdminProduct } from '../../api/adminApi';
import type { ProductCategory } from '../../types/index';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

const CATEGORIES: Array<'Alle' | ProductCategory> = ['Alle', 'Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst'];

export default function ProductsPage() {
  const [products, setProducts]         = useState<AdminProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState<'Alle' | ProductCategory>('Alle');
  const [deletingId, setDeletingId]     = useState<string | null>(null);

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

  const handleDelete = async (product: AdminProduct) => {
    const confirmed = window.confirm(
      `Produkt „${product.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
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
      </div>

      {/* Error State */}
      {error && (
        <div className="data-card data-card--error">
          <div className="data-card__body">
            <div className="admin-table__empty">
              <AlertCircle size={18} strokeWidth={1.5} />
              Fehler beim Laden: {error}
              <button className="btn-secondary" onClick={fetchProducts} style={{ marginLeft: '1rem' }}>
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
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Produkt</th>
                  <th>Kategorie</th>
                  <th>Preis</th>
                  <th>Lager</th>
                  <th>Status</th>
                  <th>Badge</th>
                  <th style={{ width: 80 }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  /* Loading skeleton */
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
                    <tr key={p.id} className={deletingId === p.id ? 'admin-table__row--deleting' : ''}>
                      <td className="admin-table__muted">{p.id}</td>
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
                        <span className={`status-badge ${p.active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                          {p.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
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
                          >
                            <Edit2 size={13} strokeWidth={2} />
                          </Link>
                          <button
                            className="table-action table-action--danger"
                            title="Löschen"
                            onClick={() => handleDelete(p)}
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
    </>
  );
}
