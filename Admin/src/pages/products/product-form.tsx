import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ImagePlus, Loader2, X } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { getAdminProduct, createProduct, updateProduct, uploadProductImage } from '../../api/adminApi';
import type { AdminProduct } from '../../api/adminApi';
import type { ProductCategory } from '../../types/index';

const TAX_RATES = [
  { label: '0 % (steuerfrei)',    value: 0  },
  { label: '7 % (ermäßigt)',      value: 7  },
  { label: '19 % (Regelsteuersatz)', value: 19 },
];

interface ProductFormData {
  name:             string;
  slug:             string;
  category:         ProductCategory;
  description:      string;
  price:            string;
  old_price:        string;
  discount:         string;
  badge:            string;
  stock:            string;
  active:           boolean;
  tax_rate:         number;
  image_url:        string;
  rich_description: string;
  highlights:       string; // eine pro Zeile
  certifications:   string; // kommagetrennt
}

const EMPTY: ProductFormData = {
  name: '', slug: '', category: 'Wohnen', description: '',
  price: '', old_price: '', discount: '', badge: '',
  stock: '0', active: true, tax_rate: 19, image_url: '',
  rich_description: '', highlights: '', certifications: '',
};

function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductFormPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);

  const [form, setForm]             = useState<ProductFormData>(EMPTY);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [categories, setCategories]   = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef  = useRef<HTMLDivElement>(null);

  /* ── Kategorien aus API laden ───────────────────────────────────────────── */
  useEffect(() => {
    const apiUrl = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';
    fetch(`${apiUrl}/api/products/categories`)
      .then(r => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) setCategories(data as string[]); })
      .catch(() => setCategories(['Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst']));
  }, []);

  /* ── Produkt laden (Edit-Modus) ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isEdit || !id) return;

    setLoadingProduct(true);
    setLoadError(null);

    getAdminProduct(id)
      .then((p: AdminProduct) => {
        setForm({
          name:             p.name,
          slug:             p.slug,
          category:         p.category as ProductCategory,
          description:      p.description,
          price:            String(p.price),
          old_price:        p.old_price != null ? String(p.old_price) : '',
          discount:         p.discount ?? '',
          badge:            p.badge ?? '',
          stock:            String(p.stock),
          active:           p.active,
          tax_rate:         p.tax_rate,
          image_url:        p.image_url ?? '',
          rich_description: p.rich_description ?? '',
          highlights:       (p.highlights ?? []).join('\n'),
          certifications:   (p.certifications ?? []).join(', '),
        });
      })
      .catch(err => {
        setLoadError(err instanceof Error ? err.message : 'Produkt konnte nicht geladen werden');
      })
      .finally(() => setLoadingProduct(false));
  }, [id, isEdit]);

  /* ── Formular-Helfer ────────────────────────────────────────────────────── */
  const set = (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, slug: autoSlug(name) }));
  };

  const handleToggleActive = () =>
    setForm(prev => ({ ...prev, active: !prev.active }));

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, tax_rate: Number(e.target.value) }));

  /* ── Bild-Upload ────────────────────────────────────────────────────────── */
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Nur Bilddateien erlaubt (JPG, PNG, WebP…)');
      setUploadStatus('error');
      return;
    }
    setUploadStatus('uploading');
    setUploadError(null);
    try {
      const url = await uploadProductImage(file);
      setForm(prev => ({ ...prev, image_url: url }));
      setUploadStatus('idle');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
      setUploadStatus('error');
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const clearImage = () => {
    setForm(prev => ({ ...prev, image_url: '' }));
    setUploadStatus('idle');
    setUploadError(null);
  };

  /* ── Validation ─────────────────────────────────────────────────────────── */
  const validate = (): string | null => {
    if (!form.name.trim())        return 'Produktname ist Pflichtfeld';
    if (!form.slug.trim())        return 'Slug ist Pflichtfeld';
    if (!form.description.trim()) return 'Beschreibung ist Pflichtfeld';
    if (!form.category)           return 'Kategorie ist Pflichtfeld';
    const priceNum = parseFloat(form.price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) return 'Preis muss größer als 0 sein';
    return null;
  };

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationError = validate();
    if (validationError) { setSubmitError(validationError); return; }

    setSubmitting(true);

    const priceNum    = parseFloat(form.price.replace(',', '.'));
    const oldPriceNum = form.old_price.trim()
      ? parseFloat(form.old_price.replace(',', '.'))
      : null;

    const payload = {
      name:             form.name.trim(),
      slug:             form.slug.trim(),
      description:      form.description.trim(),
      category:         form.category,
      price:            priceNum,
      old_price:        oldPriceNum,
      discount:         form.discount.trim()    || null,
      badge:            form.badge.trim()       || null,
      stock:            parseInt(form.stock, 10) || 0,
      active:           form.active,
      tax_rate:         form.tax_rate,
      image_url:        form.image_url.trim()   || null,
      rich_description: form.rich_description.trim() || null,
      highlights:       form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
      certifications:   form.certifications.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (isEdit && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate(ROUTES.PRODUCTS.LIST);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
      // 409 Slug-Konflikt leserlich machen
      setSubmitError(
        msg.includes('409') || msg.toLowerCase().includes('slug')
          ? 'Dieser Slug ist bereits vergeben. Bitte einen anderen wählen.'
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading / Error State (Edit-Modus) ─────────────────────────────────── */
  if (loadingProduct) {
    return (
      <div className="page-loading">
        <Loader2 size={24} strokeWidth={1.5} className="spin" />
        <span>Produkt wird geladen…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-error">
        <p>{loadError}</p>
        <button className="btn-secondary" onClick={() => navigate(ROUTES.PRODUCTS.LIST)}>
          Zurück zur Liste
        </button>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
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
          <button
            type="submit"
            form="product-form"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting
              ? <Loader2 size={15} strokeWidth={2} className="spin" />
              : <Save size={15} strokeWidth={2} />
            }
            {submitting ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Global Submit Error */}
      {submitError && (
        <div className="form-error-banner">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="form-error-banner__close">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit} className="form-grid" noValidate>
        {/* ── Linke Spalte ── */}
        <div className="form-col">

          {/* Grunddaten */}
          <div className="form-section">
            <h2 className="form-section__title">Grunddaten</h2>

            <div className="form-field">
              <label className="form-label">Produktname *</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={handleNameChange}
                placeholder="z.B. Kerzentablett Marmor"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">URL-Slug *</label>
              <input
                type="text"
                className="form-input form-input--mono"
                value={form.slug}
                onChange={set('slug')}
                placeholder="wird automatisch generiert"
                required
              />
              <p className="form-hint">Wird für die Produkt-URL verwendet. Nur Kleinbuchstaben und Bindestriche.</p>
            </div>

            <div className="form-field">
              <label className="form-label">Kategorie *</label>
              <input
                className="form-input"
                list="category-suggestions"
                value={form.category}
                onChange={set('category')}
                placeholder="z. B. Wohnen, Deko, Sport …"
                required
              />
              <datalist id="category-suggestions">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
              <p className="form-hint">Vorhandene Kategorie auswählen oder neue eingeben.</p>
            </div>

            <div className="form-field">
              <label className="form-label">Beschreibung *</label>
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={set('description')}
                rows={4}
                placeholder="Kurzbeschreibung — erscheint auf Produktkarten und in Suchergebnissen."
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Detailbeschreibung (HTML)</label>
              <textarea
                className="form-textarea form-textarea--mono"
                value={form.rich_description}
                onChange={set('rich_description')}
                rows={6}
                placeholder="<p>Ausführliche Beschreibung mit <strong>HTML</strong>…</p>"
              />
              <p className="form-hint">Erscheint auf der Produktdetailseite. HTML erlaubt (p, h4, ul, li, strong).</p>
            </div>

            <div className="form-field">
              <label className="form-label">Highlights / USPs</label>
              <textarea
                className="form-textarea"
                value={form.highlights}
                onChange={set('highlights')}
                rows={4}
                placeholder={"100 % natürliches Material\nHandmade in Germany\nPlastikfrei verpackt"}
              />
              <p className="form-hint">Ein Vorteil pro Zeile — erscheinen als Aufzählung unter dem Preis.</p>
            </div>

            <div className="form-field">
              <label className="form-label">Zertifikate / Siegel</label>
              <input
                type="text"
                className="form-input"
                value={form.certifications}
                onChange={set('certifications')}
                placeholder="Bio, Vegan, Handmade, CO₂-neutral"
              />
              <p className="form-hint">Kommagetrennt — erscheinen als Badges auf der Detailseite.</p>
            </div>
          </div>

          {/* Preis & Lager */}
          <div className="form-section">
            <h2 className="form-section__title">Preis & Lager</h2>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Preis (€) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="39.90"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Alter Preis (€)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.old_price}
                  onChange={set('old_price')}
                  placeholder="49.90"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Rabatt-Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.discount}
                  onChange={set('discount')}
                  placeholder="-20%"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Lagerbestand</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.stock}
                  onChange={set('stock')}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Steuersatz *</label>
                <select
                  className="form-select"
                  value={form.tax_rate}
                  onChange={handleTaxRateChange}
                  required
                >
                  {TAX_RATES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Badge</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.badge}
                  onChange={set('badge')}
                  placeholder="NEU, SALE, TOP, …"
                />
                <p className="form-hint">Kurzes Label auf der Produktkarte.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Rechte Spalte ── */}
        <div className="form-col form-col--side">

          {/* Sichtbarkeit */}
          <div className="form-section">
            <h2 className="form-section__title">Sichtbarkeit</h2>
            <div className="form-field">
              <label className="form-toggle">
                <input
                  type="checkbox"
                  className="form-toggle__input"
                  checked={form.active}
                  onChange={handleToggleActive}
                />
                <span className="form-toggle__track" />
                <span className="form-toggle__label">
                  {form.active ? 'Produkt aktiv (sichtbar im Shop)' : 'Produkt inaktiv (nicht sichtbar)'}
                </span>
              </label>
            </div>
          </div>

          {/* Produktbild */}
          <div className="form-section">
            <h2 className="form-section__title">Produktbild</h2>

            <div className="image-upload">
              {/* Vorschau */}
              {form.image_url ? (
                <div className="image-upload__preview">
                  <img
                    src={form.image_url}
                    alt="Vorschau"
                    onContextMenu={e => e.preventDefault()}
                  />
                  <button
                    type="button"
                    className="image-upload__remove"
                    onClick={clearImage}
                    title="Bild entfernen"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                /* Drop-Zone */
                <div
                  ref={dropZoneRef}
                  className={`image-upload__dropzone${isDragging ? ' is-dragging' : ''}${uploadStatus === 'uploading' ? ' is-uploading' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Bild hochladen"
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <Loader2 size={28} strokeWidth={1.25} className="spin" />
                      <span>Wird hochgeladen…</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={28} strokeWidth={1.25} />
                      <span>Klicken oder Bild hierher ziehen</span>
                      <span className="image-upload__hint">JPG, PNG, WebP — max. 5 MB</span>
                    </>
                  )}
                </div>
              )}

              {/* Upload Error */}
              {uploadStatus === 'error' && uploadError && (
                <p className="form-error">{uploadError}</p>
              )}

              {/* Verstecktes File-Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileInputChange}
              />

              {/* Manuelle URL-Eingabe als Fallback */}
              <div className="form-field">
                <label className="form-label">oder Bild-URL eingeben</label>
                <input
                  type="url"
                  className="form-input"
                  value={form.image_url}
                  onChange={set('image_url')}
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
