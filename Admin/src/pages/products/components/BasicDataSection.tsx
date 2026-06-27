import type { Category } from '../../../api/adminApi';
import type { ProductFormData } from '../product-form.types';

interface BasicDataSectionProps {
  form: ProductFormData;
  set: (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: Category[];
}

export default function BasicDataSection({ form, set, handleNameChange, categories }: BasicDataSectionProps) {
  return (
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
          <select
            className="form-input"
            value={form.category}
            onChange={set('category')}
            required
          >
            <option value="">— Kategorie wählen —</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
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
  );
}
