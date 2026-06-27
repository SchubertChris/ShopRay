import NumberInput from '../../../components/ui/NumberInput';
import { TAX_RATES } from '../product-form.constants';
import type { ProductFormData } from '../product-form.types';

interface PricingStockSectionProps {
  form: ProductFormData;
  set: (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export default function PricingStockSection({ form, set, setForm }: PricingStockSectionProps) {
  return (
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
  );
}
