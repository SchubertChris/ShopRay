import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ImagePlus } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { ProductCategory } from '../../types/index';

const CATEGORIES: ProductCategory[] = ['Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst'];

interface ProductFormData {
  name:        string;
  slug:        string;
  category:    ProductCategory;
  description: string;
  price:       string;
  oldPrice:    string;
  discount:    string;
  badge:       string;
  stock:       string;
  imageUrl:    string;
}

const EMPTY: ProductFormData = {
  name: '', slug: '', category: 'Wohnen', description: '',
  price: '', oldPrice: '', discount: '', badge: '', stock: '', imageUrl: '',
};

export default function ProductFormPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);
  const [form, setForm] = useState<ProductFormData>(EMPTY);

  const set = (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, slug: autoSlug(name) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // API call would go here
    navigate(ROUTES.PRODUCTS.LIST);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <button className="back-btn" onClick={() => navigate(ROUTES.PRODUCTS.LIST)}>
            <ArrowLeft size={15} strokeWidth={2} />
            Zurück
          </button>
          <span className="page-header__eyebrow">Produkte</span>
          <h1 className="page-header__title">{isEdit ? 'Produkt bearbeiten' : 'Neues Produkt'}</h1>
        </div>
        <div className="page-header__actions">
          <button type="submit" form="product-form" className="btn-primary">
            <Save size={15} strokeWidth={2} />
            Speichern
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="form-grid">
        {/* ── Linke Spalte ── */}
        <div className="form-col">
          {/* Grunddaten */}
          <div className="form-section">
            <h2 className="form-section__title">Grunddaten</h2>
            <div className="form-field">
              <label className="form-label">Produktname *</label>
              <input type="text" className="form-input" value={form.name} onChange={handleNameChange} placeholder="z.B. Kerzentablett Marmor" required />
            </div>
            <div className="form-field">
              <label className="form-label">URL-Slug</label>
              <input type="text" className="form-input form-input--mono" value={form.slug}
                onChange={set('slug')} placeholder="wird automatisch generiert" />
              <p className="form-hint">Wird für die Produkt-URL verwendet. Nur Kleinbuchstaben und Bindestriche.</p>
            </div>
            <div className="form-field">
              <label className="form-label">Kategorie *</label>
              <select className="form-select" value={form.category} onChange={set('category')} required>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Beschreibung</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')}
                rows={5} placeholder="Produktbeschreibung für die Detailseite…" />
            </div>
          </div>

          {/* Preis & Lager */}
          <div className="form-section">
            <h2 className="form-section__title">Preis & Lager</h2>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Preis (€) *</label>
                <input type="text" className="form-input" value={form.price} onChange={set('price')}
                  placeholder="39,90" required />
              </div>
              <div className="form-field">
                <label className="form-label">Alter Preis (€)</label>
                <input type="text" className="form-input" value={form.oldPrice} onChange={set('oldPrice')}
                  placeholder="49,90" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Rabatt-Text</label>
                <input type="text" className="form-input" value={form.discount} onChange={set('discount')}
                  placeholder="-20%" />
              </div>
              <div className="form-field">
                <label className="form-label">Lagerbestand</label>
                <input type="number" className="form-input" value={form.stock} onChange={set('stock')}
                  placeholder="0" min="0" />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Badge</label>
              <input type="text" className="form-input" value={form.badge} onChange={set('badge')}
                placeholder="NEU, SALE, TOP, …" />
              <p className="form-hint">Kurzes Label das auf der Produktkarte angezeigt wird.</p>
            </div>
          </div>
        </div>

        {/* ── Rechte Spalte ── */}
        <div className="form-col form-col--side">
          {/* Bild */}
          <div className="form-section">
            <h2 className="form-section__title">Produktbild</h2>
            <div className="image-upload">
              <div className="image-upload__preview">
                {form.imageUrl
                  ? <img src={form.imageUrl} alt="Vorschau" onContextMenu={e => e.preventDefault()} />
                  : (
                    <div className="image-upload__empty">
                      <ImagePlus size={28} strokeWidth={1.25} />
                      <span>Kein Bild</span>
                    </div>
                  )
                }
              </div>
              <div className="form-field">
                <label className="form-label">Bild-URL</label>
                <input type="url" className="form-input" value={form.imageUrl} onChange={set('imageUrl')}
                  placeholder="https://…" />
                <p className="form-hint">Direkt-URL zum Produktbild. Wird nach Supabase-Integration durch Upload ersetzt.</p>
              </div>
            </div>
          </div>

          {/* Info-Box */}
          <div className="form-section form-section--info">
            <h2 className="form-section__title">Hinweis</h2>
            <p className="form-info-text">
              Diese Produktdaten werden als Mock-Daten gespeichert. Nach der Supabase-Anbindung
              (siehe SETUP.md Schritt 5) werden Produkte direkt in der Datenbank gespeichert.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
