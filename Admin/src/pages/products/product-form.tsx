import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, X, Plus } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { getAdminProduct, createProduct, updateProduct, API_URL } from '../../api/adminApi';
import type { AdminProduct, LmivInfo, DealerLink, ProductDocument } from '../../api/adminApi';
import type { ProductCategory } from '../../types/index';
import NumberInput        from '../../components/ui/NumberInput';
import ImageGalleryEditor from '../../components/ui/ImageGalleryEditor';
import LmivEditor         from '../../components/ui/LmivEditor';
import VariantEditor      from '../../components/ui/VariantEditor';

const TAX_RATES = [
  { label: '0 % (steuerfrei)',       value: 0  },
  { label: '7 % (ermäßigt)',         value: 7  },
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
  images:           string[];
  rich_description: string;
  highlights:       string;   // eine pro Zeile
  certifications:   string;   // kommagetrennt
  lmiv:             LmivInfo | null;
  dealer_links:     DealerLink[];
  documents:        ProductDocument[];
  show_lmiv:        boolean;
  show_reviews:     boolean;
}

const EMPTY: ProductFormData = {
  name: '', slug: '', category: 'Merch', description: '',
  price: '', old_price: '', discount: '', badge: '',
  stock: '0', active: true, tax_rate: 19, images: [],
  rich_description: '', highlights: '', certifications: '',
  lmiv: null, dealer_links: [], documents: [],
  show_lmiv: true, show_reviews: true,
};

function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductFormPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm]                   = useState<ProductFormData>(EMPTY);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [loadError, setLoadError]         = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [categories, setCategories]       = useState<string[]>([]);

  /* ── Kategorien laden ───────────────────────────────────────────────────── */
  useEffect(() => {
    fetch(`${API_URL}/api/products/categories`)
      .then(r => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) setCategories(data as string[]); })
      .catch(() => setCategories(['Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst']));
  }, []);

  /* ── Produkt laden (Edit-Modus) ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingProduct(true);
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
          images:           Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
          rich_description: p.rich_description ?? '',
          highlights:       (p.highlights ?? []).join('\n'),
          certifications:   (p.certifications ?? []).join(', '),
          lmiv:             p.lmiv ?? null,
          dealer_links:     p.dealer_links ?? [],
          documents:        p.documents ?? [],
          show_lmiv:        p.sections_config?.lmiv    !== false,
          show_reviews:     p.sections_config?.reviews  !== false,
        });
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Produkt konnte nicht geladen werden'))
      .finally(() => setLoadingProduct(false));
  }, [id, isEdit]);

  /* ── Helfer ─────────────────────────────────────────────────────────────── */
  const set = (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, slug: autoSlug(name) }));
  }, []);

  /* ── Dealer Links ───────────────────────────────────────────────────────── */
  const addDealerLink = () =>
    setForm(prev => ({ ...prev, dealer_links: [...prev.dealer_links, { label: '', href: '' }] }));

  const updateDealerLink = (i: number, field: keyof DealerLink, val: string) =>
    setForm(prev => {
      const rows = [...prev.dealer_links];
      rows[i] = { ...rows[i], [field]: val };
      return { ...prev, dealer_links: rows };
    });

  const removeDealerLink = (i: number) =>
    setForm(prev => ({ ...prev, dealer_links: prev.dealer_links.filter((_, idx) => idx !== i) }));

  /* ── Dokumente ──────────────────────────────────────────────────────────── */
  const addDocument = () =>
    setForm(prev => ({ ...prev, documents: [...prev.documents, { label: '', href: '', type: 'pdf' as const }] }));

  const updateDocument = (i: number, field: keyof ProductDocument, val: string) =>
    setForm(prev => {
      const rows = [...prev.documents];
      rows[i] = { ...rows[i], [field]: val } as ProductDocument;
      return { ...prev, documents: rows };
    });

  const removeDocument = (i: number) =>
    setForm(prev => ({ ...prev, documents: prev.documents.filter((_, idx) => idx !== i) }));

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
    const oldPriceNum = form.old_price.trim() ? parseFloat(form.old_price.replace(',', '.')) : null;
    const imagesArr   = form.images.filter(Boolean);

    const payload = {
      name:             form.name.trim(),
      slug:             form.slug.trim(),
      description:      form.description.trim(),
      category:         form.category,
      price:            priceNum,
      old_price:        oldPriceNum,
      discount:         form.discount.trim()  || null,
      badge:            form.badge.trim()     || null,
      stock:            parseInt(form.stock, 10) || 0,
      active:           form.active,
      tax_rate:         form.tax_rate,
      image_url:        imagesArr[0] ?? null,
      images:           imagesArr,
      rich_description: form.rich_description.trim() || null,
      highlights:       form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
      certifications:   form.certifications.split(',').map(s => s.trim()).filter(Boolean),
      lmiv:             form.lmiv,
      dealer_links:     form.dealer_links.filter(d => d.label.trim() && d.href.trim()),
      documents:        form.documents.filter(d => d.label.trim() && d.href.trim()),
      sections_config:  { lmiv: form.show_lmiv, reviews: form.show_reviews },
    };

    try {
      if (isEdit && id) await updateProduct(id, payload);
      else               await createProduct(payload);
      navigate(ROUTES.PRODUCTS.LIST);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
      setSubmitError(
        msg.includes('409') || msg.toLowerCase().includes('slug')
          ? 'Dieser Slug ist bereits vergeben. Bitte einen anderen wählen.'
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── States ─────────────────────────────────────────────────────────────── */
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
          <button type="submit" form="product-form" className="btn-primary" disabled={submitting}>
            {submitting
              ? <Loader2 size={15} strokeWidth={2} className="spin" />
              : <Save size={15} strokeWidth={2} />
            }
            {submitting ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>

      {submitError && (
        <div className="form-error-banner">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="form-error-banner__close">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit} className="form-grid" noValidate>

        {/* ══ LINKE SPALTE ══════════════════════════════════════════════════ */}
        <div className="form-col">

          {/* ── Grunddaten ─────────────────────────────────────────────── */}
          <div className="form-section">
            <h2 className="form-section__title">Grunddaten</h2>

            <div className="form-field">
              <label className="form-label">Produktname *</label>
              <input type="text" className="form-input" value={form.name}
                onChange={handleNameChange} placeholder="z.B. Kerzentablett Marmor" required />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">URL-Slug *</label>
                <input type="text" className="form-input form-input--mono" value={form.slug}
                  onChange={set('slug')} placeholder="kerzentablett-marmor" required />
                <p className="form-hint">Nur Kleinbuchstaben und Bindestriche.</p>
              </div>
              <div className="form-field">
                <label className="form-label">Kategorie *</label>
                <input className="form-input" list="category-suggestions" value={form.category}
                  onChange={set('category')} placeholder="z. B. Wohnen, Deko…" required />
                <datalist id="category-suggestions">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Kurzbeschreibung * <span className="form-hint form-hint--inline">(Produktkarten + Meta)</span></label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')}
                rows={3} placeholder="Kurze, prägnante Beschreibung für Produktkarten und Suchergebnisse." required />
            </div>

            <div className="form-field">
              <label className="form-label">Detailbeschreibung (HTML)</label>
              <textarea className="form-textarea form-input--mono" value={form.rich_description}
                onChange={set('rich_description')} rows={7}
                placeholder={'<p>Ausführliche Beschreibung mit <strong>HTML</strong>…</p>\n<h4>Abschnitt</h4>\n<ul><li>Punkt 1</li></ul>'} />
              <p className="form-hint">Erscheint im Tab "Produktdetails". HTML erlaubt: p, h4, ul, li, strong, em.</p>
            </div>

          </div>

          {/* ── Preis & Lager  |  USPs & Siegel ───────────────────────── */}
          <div className="form-row-sections">

            <div className="form-section">
              <h2 className="form-section__title">Preis & Lager</h2>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Preis (€) *</label>
                  <NumberInput value={form.price} min={0.01} step={0.01} placeholder="39.90"
                    onChange={val => setForm(prev => ({ ...prev, price: String(val) }))} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Alter Preis (€)</label>
                  <NumberInput value={form.old_price} min={0} step={0.01} placeholder="49.90"
                    onChange={val => setForm(prev => ({ ...prev, old_price: val > 0 ? String(val) : '' }))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Rabatt-Label</label>
                  <input type="text" className="form-input" value={form.discount}
                    onChange={set('discount')} placeholder="-20%" />
                  <p className="form-hint">z. B. "-20%" oder "Sommer Sale"</p>
                </div>
                <div className="form-field">
                  <label className="form-label">Badge</label>
                  <input type="text" className="form-input" value={form.badge}
                    onChange={set('badge')} placeholder="NEU, SALE, TOP, Bestseller…" />
                  <p className="form-hint">Kurzes Label auf der Produktkarte.</p>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Steuersatz *</label>
                  <select className="form-select" value={form.tax_rate}
                    onChange={e => setForm(prev => ({ ...prev, tax_rate: Number(e.target.value) }))} required>
                    {TAX_RATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Lagerbestand</label>
                  <NumberInput value={form.stock} min={0} step={1} placeholder="0"
                    onChange={val => setForm(prev => ({ ...prev, stock: String(Math.max(0, val)) }))} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section__title">USPs & Siegel</h2>

              <div className="form-field">
                <label className="form-label">Highlights / USPs</label>
                <textarea className="form-textarea" value={form.highlights} onChange={set('highlights')} rows={5}
                  placeholder={'100 % natürliches Material\nHandmade in Germany\nPlastikfrei verpackt'} />
                <p className="form-hint">Ein Vorteil pro Zeile — erscheinen direkt unter dem Preis.</p>
              </div>

              <div className="form-field">
                <label className="form-label">Zertifikate / Siegel</label>
                <input type="text" className="form-input" value={form.certifications}
                  onChange={set('certifications')} placeholder="Bio, Vegan, Handmade, CO₂-neutral" />
                <p className="form-hint">Kommagetrennt — erscheinen als Badges auf der Detailseite.</p>
              </div>
            </div>

          </div>

          {/* ── Händler & Bezugsquellen  |  Dokumente & Downloads ──────── */}
          <div className="form-row-sections">

            <div className="form-section">
              <h2 className="form-section__title">Händler & Bezugsquellen</h2>
              <p className="form-section__desc">
                Links zu externen Händlern — erscheinen im Bereich "Erhältlich bei" auf der Produktdetailseite.
              </p>

              <div className="dynamic-list-editor">
                {form.dealer_links.map((d, i) => (
                  <div key={i} className="dynamic-list-editor__row">
                    <input type="text" className="form-input" value={d.label}
                      onChange={e => updateDealerLink(i, 'label', e.target.value)}
                      placeholder="Händlername (z.B. Manufactum)" />
                    <input type="url" className="form-input" value={d.href}
                      onChange={e => updateDealerLink(i, 'href', e.target.value)}
                      placeholder="https://…" />
                    <button type="button" className="lmiv-editor__remove-row" onClick={() => removeDealerLink(i)}>
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-secondary dynamic-list-editor__add" onClick={addDealerLink}>
                  <Plus size={13} strokeWidth={2} /> Händler hinzufügen
                </button>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section__title">Dokumente & Downloads</h2>
              <p className="form-section__desc">
                PDFs oder externe Links (Sicherheitsdatenblatt, Zertifikat, Anleitung etc.)
              </p>

              <div className="dynamic-list-editor">
                {form.documents.map((d, i) => (
                  <div key={i} className="dynamic-list-editor__row">
                    <input type="text" className="form-input" value={d.label}
                      onChange={e => updateDocument(i, 'label', e.target.value)}
                      placeholder="Bezeichnung (z.B. Sicherheitsdatenblatt)" />
                    <input type="url" className="form-input" value={d.href}
                      onChange={e => updateDocument(i, 'href', e.target.value)}
                      placeholder="https://…" />
                    <select className="form-select form-select--doc-type" value={d.type}
                      onChange={e => updateDocument(i, 'type', e.target.value)}>
                      <option value="pdf">PDF</option>
                      <option value="external">Link</option>
                    </select>
                    <button type="button" className="lmiv-editor__remove-row" onClick={() => removeDocument(i)}>
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-secondary dynamic-list-editor__add" onClick={addDocument}>
                  <Plus size={13} strokeWidth={2} /> Dokument hinzufügen
                </button>
              </div>
            </div>

          </div>

          {/* ── LMIV ────────────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section__head">
              <h2 className="form-section__title">Inhaltsstoffe & Nährwerte (LMIV)</h2>
              <p className="form-section__desc">
                Nur für Lebensmittel und Nahrungsergänzungsmittel. Erscheint im Tab
                "Inhaltsstoffe & Nährwerte" auf der Produktdetailseite.
              </p>
            </div>
            <LmivEditor
              value={form.lmiv}
              onChange={lmiv => setForm(prev => ({ ...prev, lmiv }))}
            />
          </div>

        </div>

        {/* ══ RECHTE SPALTE ═════════════════════════════════════════════════ */}
        <div className="form-col form-col--side">

          {/* ── Varianten (nur im Edit-Modus) ───────────────────────────── */}
          {isEdit && id && (
            <div className="form-section">
              <h2 className="form-section__title">Varianten</h2>
              <VariantEditor productId={id} />
            </div>
          )}

          {/* ── Sichtbarkeit ────────────────────────────────────────────── */}
          <div className="form-section">
            <h2 className="form-section__title">Sichtbarkeit</h2>
            <label className="form-toggle">
              <input type="checkbox" className="form-toggle__input" checked={form.active}
                onChange={() => setForm(prev => ({ ...prev, active: !prev.active }))} />
              <span className="form-toggle__track" />
              <span className="form-toggle__label">
                {form.active ? 'Aktiv — im Shop sichtbar' : 'Inaktiv — versteckt'}
              </span>
            </label>

            <p className="form-section__desc" style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
              Detailseiten-Tabs — steuert welche Tabs auf der Produktdetailseite erscheinen:
            </p>
            <label className="form-toggle">
              <input type="checkbox" className="form-toggle__input" checked={form.show_lmiv}
                onChange={() => setForm(prev => ({ ...prev, show_lmiv: !prev.show_lmiv }))} />
              <span className="form-toggle__track" />
              <span className="form-toggle__label">
                {form.show_lmiv ? 'Tab „Inhaltsstoffe & Nährwerte" sichtbar' : 'Tab „Inhaltsstoffe & Nährwerte" ausgeblendet'}
              </span>
            </label>
            <label className="form-toggle" style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" className="form-toggle__input" checked={form.show_reviews}
                onChange={() => setForm(prev => ({ ...prev, show_reviews: !prev.show_reviews }))} />
              <span className="form-toggle__track" />
              <span className="form-toggle__label">
                {form.show_reviews ? 'Tab „Bewertungen" sichtbar' : 'Tab „Bewertungen" ausgeblendet'}
              </span>
            </label>
          </div>

          {/* ── Produktbilder ────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section__head">
              <h2 className="form-section__title">Produktbilder</h2>
              <p className="form-section__desc">
                Bis zu 8 Bilder. Das erste Bild ist das Hauptbild — es erscheint auf
                Produktkarten und in der Galerie ganz oben.
              </p>
            </div>
            <ImageGalleryEditor
              images={form.images}
              onChange={images => setForm(prev => ({ ...prev, images }))}
            />
          </div>

        </div>
      </form>
    </>
  );
}
