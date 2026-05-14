import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { Product, ProductCategory } from '../../types/index';

const MOCK_PRODUCTS: Product[] = [
  { id: 1,  name: 'Kerzentablett Marmor',    slug: 'kerzentablett-marmor',    description: '', price: '39,90', oldPrice: '49,90', discount: '-20%', badge: 'SALE',  category: 'Wohnen',   rating: 4.7, reviews: 84,  stock: 12, imageUrl: null,                              createdAt: '2026-01-10' },
  { id: 2,  name: 'Leinen Kissenhülle 50×50', slug: 'leinen-kissenhuelle',     description: '', price: '24,90', oldPrice: null,    discount: null,    badge: null,    category: 'Textilien',rating: 4.4, reviews: 121, stock: 38, imageUrl: null,                              createdAt: '2026-01-14' },
  { id: 3,  name: 'Holzschale Eiche',         slug: 'holzschale-eiche',        description: '', price: '59,00', oldPrice: null,    discount: null,    badge: 'NEU',   category: 'Deko',    rating: 4.9, reviews: 33,  stock: 5,  imageUrl: null,                              createdAt: '2026-02-01' },
  { id: 4,  name: 'Gusseisen-Pfanne 28 cm',   slug: 'gusseisen-pfanne-28',     description: '', price: '79,90', oldPrice: '99,00', discount: '-19%', badge: 'SALE',  category: 'Küche',   rating: 4.6, reviews: 58,  stock: 0,  imageUrl: null,                              createdAt: '2026-02-05' },
  { id: 5,  name: 'Aquarell-Print A3',         slug: 'aquarell-print-a3',       description: '', price: '29,90', oldPrice: null,    discount: null,    badge: null,    category: 'Kunst',   rating: 4.5, reviews: 17,  stock: 99, imageUrl: null,                              createdAt: '2026-02-20' },
  { id: 6,  name: 'Wolldecke Anthrazit',       slug: 'wolldecke-anthrazit',     description: '', price: '89,00', oldPrice: null,    discount: null,    badge: null,    category: 'Textilien',rating: 4.8, reviews: 76,  stock: 7,  imageUrl: null,                              createdAt: '2026-03-01' },
  { id: 7,  name: 'Duftkerze Zedernholz',     slug: 'duftkerze-zedernholz',    description: '', price: '18,90', oldPrice: '22,00', discount: '-14%', badge: null,    category: 'Deko',    rating: 4.3, reviews: 209, stock: 55, imageUrl: null,                              createdAt: '2026-03-10' },
  { id: 8,  name: 'Emaille-Topf Set 3-tlg.',  slug: 'emaille-topf-set',        description: '', price: '129,00',oldPrice: null,    discount: null,    badge: 'NEU',   category: 'Küche',   rating: 4.7, reviews: 12,  stock: 3,  imageUrl: null,                              createdAt: '2026-04-15' },
];

const CATEGORIES: Array<'Alle' | ProductCategory> = ['Alle', 'Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst'];

export default function ProductsPage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<'Alle' | ProductCategory>('Alle');

  const filtered = MOCK_PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === 'Alle' || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Produkte</h1>
          <p className="page-header__sub">{MOCK_PRODUCTS.length} Produkte insgesamt</p>
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

      {/* Table */}
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
                <th>Badge</th>
                <th style={{ width: 80 }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table__empty">
                    <AlertCircle size={18} strokeWidth={1.5} />
                    Keine Produkte gefunden
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td className="admin-table__muted">{p.id}</td>
                    <td>
                      <div className="product-thumb">
                        <div className="product-thumb__img">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} onContextMenu={e => e.preventDefault()} />
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
                      <span className="admin-table__price">€ {p.price}</span>
                      {p.oldPrice && <span className="admin-table__old-price">€ {p.oldPrice}</span>}
                    </td>
                    <td>
                      <span className={`stock-badge${p.stock === 0 ? ' stock-badge--out' : p.stock <= 5 ? ' stock-badge--low' : ''}`}>
                        {p.stock === 0 ? 'Ausverkauft' : `${p.stock} Stk.`}
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
                        <Link to={ROUTES.PRODUCTS.edit(p.id)} className="table-action" title="Bearbeiten">
                          <Edit2 size={13} strokeWidth={2} />
                        </Link>
                        <button className="table-action table-action--danger" title="Löschen">
                          <Trash2 size={13} strokeWidth={2} />
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
    </>
  );
}
