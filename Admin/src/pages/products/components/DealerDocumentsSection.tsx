import { X, Plus } from 'lucide-react';
import type { DealerLink, ProductDocument } from '../../../api/adminApi';
import type { ProductFormData } from '../product-form.types';

interface DealerDocumentsSectionProps {
  form:             ProductFormData;
  addDealerLink:    () => void;
  updateDealerLink: (i: number, field: keyof DealerLink, val: string) => void;
  removeDealerLink: (i: number) => void;
  addDocument:      () => void;
  updateDocument:   (i: number, field: keyof ProductDocument, val: string) => void;
  removeDocument:   (i: number) => void;
}

export default function DealerDocumentsSection({
  form,
  addDealerLink,
  updateDealerLink,
  removeDealerLink,
  addDocument,
  updateDocument,
  removeDocument,
}: DealerDocumentsSectionProps) {
  return (
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
  );
}
