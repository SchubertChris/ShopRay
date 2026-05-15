import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { LmivInfo, NutrientRow } from '../../api/adminApi';

interface LmivEditorProps {
  value:    LmivInfo | null;
  onChange: (value: LmivInfo | null) => void;
}

const EMPTY_LMIV: LmivInfo = {
  ingredients: '', allergens: [], servingSize: '', netContent: '',
  nutrients: [], storageHint: '', usage: '', warnings: [], manufacturer: '',
};

const EMPTY_NUTRIENT: NutrientRow = { name: '', per100g: '', perServing: '', nrv: '' };

export default function LmivEditor({ value, onChange }: LmivEditorProps) {
  const [open, setOpen] = useState(false);
  const [newAllergen, setNewAllergen] = useState('');
  const [newWarning, setNewWarning]   = useState('');

  const enabled = value !== null;
  const lmiv    = value ?? EMPTY_LMIV;

  const set = (field: keyof LmivInfo) => (val: unknown) =>
    onChange({ ...lmiv, [field]: val });

  const addAllergen = () => {
    const a = newAllergen.trim();
    if (!a) return;
    set('allergens')([...(lmiv.allergens ?? []), a]);
    setNewAllergen('');
  };

  const removeAllergen = (i: number) =>
    set('allergens')((lmiv.allergens ?? []).filter((_, idx) => idx !== i));

  const addWarning = () => {
    const w = newWarning.trim();
    if (!w) return;
    set('warnings')([...(lmiv.warnings ?? []), w]);
    setNewWarning('');
  };

  const removeWarning = (i: number) =>
    set('warnings')((lmiv.warnings ?? []).filter((_, idx) => idx !== i));

  const addNutrient = () =>
    set('nutrients')([...(lmiv.nutrients ?? []), { ...EMPTY_NUTRIENT }]);

  const removeNutrient = (i: number) =>
    set('nutrients')((lmiv.nutrients ?? []).filter((_, idx) => idx !== i));

  const updateNutrient = (i: number, field: keyof NutrientRow, val: string) => {
    const rows = [...(lmiv.nutrients ?? [])];
    rows[i] = { ...rows[i], [field]: val };
    set('nutrients')(rows);
  };

  return (
    <div className="lmiv-editor">
      {/* Enable/disable toggle */}
      <div className="lmiv-editor__toggle-row">
        <label className="form-toggle">
          <input
            type="checkbox"
            className="form-toggle__input"
            checked={enabled}
            onChange={e => onChange(e.target.checked ? EMPTY_LMIV : null)}
          />
          <span className="form-toggle__track" />
          <span className="form-toggle__label">
            LMIV aktivieren (Lebensmittelprodukt mit Pflichtangaben)
          </span>
        </label>
        {enabled && (
          <button
            type="button"
            className="lmiv-editor__collapse-btn"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
            {open ? 'Einklappen' : 'Bearbeiten'}
          </button>
        )}
      </div>

      {enabled && open && (
        <div className="lmiv-editor__body">

          {/* Basis-Infos */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Portionsgröße</label>
              <input type="text" className="form-input" value={lmiv.servingSize ?? ''}
                onChange={e => set('servingSize')(e.target.value)} placeholder="30 g (1 Messlöffel)" />
            </div>
            <div className="form-field">
              <label className="form-label">Nettofüllmenge</label>
              <input type="text" className="form-input" value={lmiv.netContent ?? ''}
                onChange={e => set('netContent')(e.target.value)} placeholder="500 g" />
            </div>
          </div>

          {/* Zutaten */}
          <div className="form-field">
            <label className="form-label">Zutaten (vollständige Liste)</label>
            <textarea className="form-textarea" rows={3} value={lmiv.ingredients ?? ''}
              onChange={e => set('ingredients')(e.target.value)}
              placeholder="Molkenprotein-Isolat (Milch), Kakaopulver, Emulgator Lecithin (Soja)…" />
          </div>

          {/* Allergene */}
          <div className="form-field">
            <label className="form-label">Allergene</label>
            <div className="tag-input">
              {(lmiv.allergens ?? []).map((a, i) => (
                <span key={i} className="tag-input__tag">
                  {a}
                  <button type="button" onClick={() => removeAllergen(i)} aria-label="Entfernen">
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="tag-input__field"
                value={newAllergen}
                onChange={e => setNewAllergen(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergen(); } }}
                placeholder="Allergen eingeben + Enter"
              />
            </div>
            <p className="form-hint">z. B. Milch · Soja · Gluten · Nüsse</p>
          </div>

          {/* Nährwerte-Tabelle */}
          <div className="form-field">
            <label className="form-label">Nährwertangaben</label>
            <div className="nutrient-table-editor">
              <div className="nutrient-table-editor__head">
                <span>Nährstoff</span>
                <span>pro 100 g</span>
                <span>pro Portion</span>
                <span>NRV %</span>
                <span />
              </div>
              {(lmiv.nutrients ?? []).map((row, i) => (
                <div key={i} className="nutrient-table-editor__row">
                  <input className="form-input form-input--sm" value={row.name}
                    onChange={e => updateNutrient(i, 'name', e.target.value)} placeholder="Eiweiß" />
                  <input className="form-input form-input--sm" value={row.per100g}
                    onChange={e => updateNutrient(i, 'per100g', e.target.value)} placeholder="78 g" />
                  <input className="form-input form-input--sm" value={row.perServing ?? ''}
                    onChange={e => updateNutrient(i, 'perServing', e.target.value)} placeholder="23 g" />
                  <input className="form-input form-input--sm" value={row.nrv ?? ''}
                    onChange={e => updateNutrient(i, 'nrv', e.target.value)} placeholder="47 %" />
                  <button type="button" className="lmiv-editor__remove-row" onClick={() => removeNutrient(i)}>
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-secondary lmiv-editor__add-row" onClick={addNutrient}>
                <Plus size={13} strokeWidth={2} /> Zeile hinzufügen
              </button>
            </div>
          </div>

          {/* Verzehrempfehlung & Lagerung */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Verzehrempfehlung</label>
              <textarea className="form-textarea" rows={3} value={lmiv.usage ?? ''}
                onChange={e => set('usage')(e.target.value)}
                placeholder="1 Messlöffel (30 g) in 250 ml Wasser einrühren…" />
            </div>
            <div className="form-field">
              <label className="form-label">Lagerhinweis</label>
              <textarea className="form-textarea" rows={3} value={lmiv.storageHint ?? ''}
                onChange={e => set('storageHint')(e.target.value)}
                placeholder="Kühl, trocken und lichtgeschützt lagern…" />
            </div>
          </div>

          {/* Warnhinweise */}
          <div className="form-field">
            <label className="form-label">Warnhinweise</label>
            {(lmiv.warnings ?? []).map((w, i) => (
              <div key={i} className="lmiv-editor__warning-row">
                <input className="form-input" value={w}
                  onChange={e => {
                    const rows = [...(lmiv.warnings ?? [])];
                    rows[i] = e.target.value;
                    set('warnings')(rows);
                  }} />
                <button type="button" className="lmiv-editor__remove-row" onClick={() => removeWarning(i)}>
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            ))}
            <div className="lmiv-editor__warning-row">
              <input className="form-input" value={newWarning}
                onChange={e => setNewWarning(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addWarning(); } }}
                placeholder="Warnhinweis eingeben + Enter" />
              <button type="button" className="btn-secondary" onClick={addWarning}>
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Hersteller */}
          <div className="form-field">
            <label className="form-label">Hersteller / Importeur</label>
            <input type="text" className="form-input" value={lmiv.manufacturer ?? ''}
              onChange={e => set('manufacturer')(e.target.value)}
              placeholder="Muster GmbH, Musterstraße 1, 12345 Musterstadt" />
          </div>

        </div>
      )}
    </div>
  );
}
