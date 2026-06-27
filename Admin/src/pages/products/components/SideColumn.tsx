import ImageGalleryEditor from '../../../components/ui/ImageGalleryEditor';
import VariantEditor from '../../../components/ui/VariantEditor';
import type { ProductFormData } from '../product-form.types';

interface SideColumnProps {
  form:    ProductFormData;
  setForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  isEdit:  boolean;
  id?:     string;
}

export default function SideColumn({ form, setForm, isEdit, id }: SideColumnProps) {
  return (
    <>
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
    </>
  );
}
