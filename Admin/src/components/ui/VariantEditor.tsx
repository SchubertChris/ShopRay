import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Save, Loader2, RefreshCw } from 'lucide-react';
import { getProductVariants, saveProductVariants } from '../../api/adminApi';
import type { AdminProductSku } from '../../api/adminApi';
import NumberInput from './NumberInput';

interface OptionDraft {
  name:   string;
  values: string[];   // Einträge als String-Array
  input:  string;     // aktuelles Eingabefeld
}

interface SkuRow extends AdminProductSku {
  dirty: boolean;
}

interface Props {
  productId: string;
}

function buildCombinations(options: OptionDraft[]): Record<string, string>[] {
  if (options.length === 0) return [];
  const filled = options.filter(o => o.name.trim() && o.values.length > 0);
  if (filled.length === 0) return [];

  const result: Record<string, string>[] = [{}];
  for (const opt of filled) {
    const next: Record<string, string>[] = [];
    for (const existing of result) {
      for (const val of opt.values) {
        next.push({ ...existing, [opt.name.trim()]: val });
      }
    }
    result.length = 0;
    result.push(...next);
  }
  return result;
}

export default function VariantEditor({ productId }: Props) {
  const [options,  setOptions]  = useState<OptionDraft[]>([]);
  const [skus,     setSkus]     = useState<SkuRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [saved,    setSaved]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductVariants(productId);
      const loadedOptions: OptionDraft[] = data.options.map(o => ({
        name:   o.name,
        values: o.variant_option_values.map(v => v.value),
        input:  '',
      }));
      setOptions(loadedOptions);
      setSkus(data.skus.map(s => ({ ...s, dirty: false })));
    } catch {
      setError('Varianten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  /* ── Option-Gruppe ─────────────────────────────────────────────────────────── */

  const addOption = () => {
    setOptions(prev => [...prev, { name: '', values: [], input: '' }]);
  };

  const removeOption = (i: number) => {
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateOptionName = (i: number, name: string) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, name } : o));
  };

  const updateOptionInput = (i: number, input: string) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, input } : o));
  };

  const addValue = (i: number) => {
    setOptions(prev => prev.map((o, idx) => {
      if (idx !== i) return o;
      const val = o.input.trim();
      if (!val || o.values.includes(val)) return { ...o, input: '' };
      return { ...o, values: [...o.values, val], input: '' };
    }));
  };

  const removeValue = (optIdx: number, valIdx: number) => {
    setOptions(prev => prev.map((o, idx) =>
      idx !== optIdx ? o : { ...o, values: o.values.filter((_, vi) => vi !== valIdx) }
    ));
  };

  /* ── SKU-Matrix generieren ─────────────────────────────────────────────────── */

  const generateSkus = () => {
    const combos = buildCombinations(options);
    setSkus(combos.map(combination => {
      const existing = skus.find(s =>
        JSON.stringify(s.combination) === JSON.stringify(combination)
      );
      return existing
        ? { ...existing, combination }
        : { id: '', combination, stock: 0, price_offset: 0, sku_code: null, active: true, dirty: true };
    }));
  };

  /* ── SKU-Felder bearbeiten ─────────────────────────────────────────────────── */

  const updateSku = (i: number, field: 'stock' | 'price_offset' | 'sku_code' | 'active', value: number | string | boolean) => {
    setSkus(prev => prev.map((s, idx) =>
      idx === i ? { ...s, [field]: value, dirty: true } : s
    ));
  };

  /* ── Speichern ─────────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveProductVariants(productId, {
        options: options
          .filter(o => o.name.trim() && o.values.length > 0)
          .map(o => ({ name: o.name.trim(), values: o.values })),
        skus: skus.map(s => ({
          combination:  s.combination,
          stock:        s.stock,
          price_offset: s.price_offset,
          sku_code:     s.sku_code || null,
          active:       s.active,
        })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const combinationLabel = (combo: Record<string, string>) =>
    Object.values(combo).join(' / ');

  if (loading) {
    return (
      <div className="variant-editor__loading">
        <Loader2 size={18} strokeWidth={1.5} className="spin" />
        <span>Varianten laden…</span>
      </div>
    );
  }

  return (
    <div className="variant-editor">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="variant-editor__header">
        <div>
          <p className="variant-editor__hint">
            Definiere Optionsgruppen (z.&nbsp;B. Größe, Farbe) und generiere dann die SKU-Matrix.
          </p>
        </div>
        <div className="variant-editor__actions">
          <button type="button" className="btn-ghost" onClick={load} title="Neu laden">
            <RefreshCw size={14} strokeWidth={2} />
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <Loader2 size={13} strokeWidth={2} className="spin" />
              : <Save    size={13} strokeWidth={2} />
            }
            {saving ? 'Speichert…' : saved ? 'Gespeichert ✓' : 'Varianten speichern'}
          </button>
        </div>
      </div>

      {error && <p className="variant-editor__error">{error}</p>}

      {/* ── Optionsgruppen ─────────────────────────────────────────────────── */}
      <div className="variant-editor__options">
        {options.map((opt, i) => (
          <div key={i} className="variant-option">
            <div className="variant-option__row">
              <input
                type="text"
                className="form-input variant-option__name"
                placeholder="Gruppenname (z.B. Größe)"
                value={opt.name}
                onChange={e => updateOptionName(i, e.target.value)}
              />
              <button type="button" className="btn-ghost" onClick={() => removeOption(i)} title="Gruppe entfernen">
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="variant-option__values">
              {opt.values.map((val, vi) => (
                <span key={vi} className="variant-tag">
                  {val}
                  <button type="button" onClick={() => removeValue(i, vi)} aria-label="Entfernen">
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <div className="variant-option__add-value">
                <input
                  type="text"
                  className="form-input variant-option__value-input"
                  placeholder="Wert (z.B. S)"
                  value={opt.input}
                  onChange={e => updateOptionInput(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(i); } }}
                />
                <button type="button" className="btn-secondary" onClick={() => addValue(i)}>
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="variant-editor__option-actions">
          {options.length < 3 && (
            <button type="button" className="btn-secondary" onClick={addOption}>
              <Plus size={13} strokeWidth={2} />
              Optionsgruppe hinzufügen
            </button>
          )}
          {options.some(o => o.name.trim() && o.values.length > 0) && (
            <button type="button" className="btn-secondary" onClick={generateSkus}>
              <RefreshCw size={13} strokeWidth={2} />
              SKU-Matrix generieren
            </button>
          )}
        </div>
      </div>

      {/* ── SKU-Tabelle ────────────────────────────────────────────────────── */}
      {skus.length > 0 && (
        <div className="variant-sku-table-wrap">
          <table className="variant-sku-table">
            <thead>
              <tr>
                <th>Variante</th>
                <th>Lagerbestand</th>
                <th>Preisaufschlag (€)</th>
                <th>SKU-Code</th>
                <th>Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {skus.map((sku, i) => (
                <tr key={i} className={sku.active ? '' : 'variant-sku-table__row--inactive'}>
                  <td className="variant-sku-table__combo">{combinationLabel(sku.combination)}</td>
                  <td>
                    <NumberInput
                      value={sku.stock}
                      min={0}
                      onChange={v => updateSku(i, 'stock', v)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input form-input--sm"
                      value={sku.price_offset}
                      step="0.01"
                      onChange={e => updateSku(i, 'price_offset', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input--sm"
                      placeholder="optional"
                      value={sku.sku_code ?? ''}
                      onChange={e => updateSku(i, 'sku_code', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={sku.active}
                      onChange={e => updateSku(i, 'active', e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {skus.length === 0 && options.length > 0 && (
        <p className="variant-editor__empty">
          Klicke auf „SKU-Matrix generieren" um Kombinationen aus den Optionsgruppen zu erstellen.
        </p>
      )}
    </div>
  );
}
