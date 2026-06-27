import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface ProductFormHeaderProps {
  isEdit:     boolean;
  submitting: boolean;
  onBack:     () => void;
}

export default function ProductFormHeader({ isEdit, submitting, onBack }: ProductFormHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__left">
        <button className="back-btn" onClick={onBack}>
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
  );
}
