import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, X, CheckCircle, AlertCircle, Download, Loader2, Copy } from 'lucide-react';
import { bulkImportProducts } from '../../api/adminApi';

interface CsvRow {
  name:             string;
  slug:             string;
  description:      string;
  price:            string;
  category:         string;
  stock?:           string;
  old_price?:       string;
  badge?:           string;
  tax_rate?:        string;
  image_url?:       string;
  highlights?:      string;
  certifications?:  string;
  discount?:        string;
}

interface PreviewRow extends CsvRow {
  _index: number;
  _valid: boolean;
  _errors: string[];
}

interface ImportResult {
  row:    number;
  status: 'ok' | 'error';
  name?:  string;
  error?: string;
}

interface Props {
  onClose:   () => void;
  onSuccess: (count: number) => void;
}

const REQUIRED = ['name', 'slug', 'description', 'price', 'category'];

const TEMPLATE_CSV = [
  'name,slug,description,price,category,stock,old_price,badge,tax_rate,image_url,highlights,certifications,discount',
  'Whey Protein Vanille,whey-protein-vanille,Hochwertiges Whey Protein mit Vanillegeschmack,39.99,Protein,100,49.99,NEU,19,,Hochwertig;Schnell löslich;Vegan,Bio;Laborgeprüft,-20%',
  'Vitamin D3 2000 IE,vitamin-d3-2000,Vitamin D3 Kapseln für Knochen und Immunsystem,12.99,Vitamine & Mineralien,200,,,7,,,Bio-zertifiziert,',
].join('\n');

const AI_PROMPT = `Erstelle eine CSV-Tabelle mit Produktdaten.
Verwende exakt diese Kopfzeile (erste Zeile):
name,slug,description,price,category,stock,old_price,badge,tax_rate,highlights,certifications,discount

Regeln:
- name: Produktname auf Deutsch
- slug: Kleinbuchstaben, Bindestriche, keine Umlaute (z.B. "bio-hanf-protein")
- description: 1–2 Sätze Produktbeschreibung
- price: Dezimalzahl ohne Währung (z.B. 29.99)
- category: Kategoriename (z.B. "Protein", "Vitamine", "Snacks")
- stock: Ganzzahl (z.B. 150)
- old_price: Dezimalzahl oder leer lassen
- badge: "NEU", "SALE", "BESTSELLER" oder leer lassen
- tax_rate: 19 (Standard) oder 7 (Lebensmittel/Bücher)
- highlights: Vorteile mit ; getrennt (z.B. "Hochwertig;Vegan;Schnell löslich")
- certifications: Siegel mit ; getrennt (z.B. "Bio;Vegan;Laborgeprüft") oder leer lassen
- discount: Rabatttext wie "-20%" oder leer lassen

Erstelle [ANZAHL] Produkte für einen [BRANCHE/THEMA]-Shop.
Ausgabe: Nur die CSV-Daten, keine Erklärungen.`;

function validateRow(row: CsvRow, index: number): PreviewRow {
  const errors: string[] = [];
  for (const field of REQUIRED) {
    if (!row[field as keyof CsvRow]?.trim()) errors.push(`${field} fehlt`);
  }
  if (row.price && isNaN(parseFloat(row.price))) errors.push('price ungültig');
  if (row.stock && isNaN(parseInt(row.stock)))  errors.push('stock ungültig');
  if (row.slug  && !/^[a-z0-9-]+$/.test(row.slug.trim())) errors.push('slug: nur a–z, 0–9, Bindestriche');
  return { ...row, _index: index, _valid: errors.length === 0, _errors: errors };
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'shopray-produkte-vorlage.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvImportModal({ onClose, onSuccess }: Props) {
  const [preview,   setPreview]   = useState<PreviewRow[] | null>(null);
  const [fileName,  setFileName]  = useState('');
  const [importing, setImporting] = useState(false);
  const [results,   setResults]   = useState<ImportResult[] | null>(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    setResults(null);
    Papa.parse<CsvRow>(file, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: h => h.trim().toLowerCase(),
      complete: ({ data }) => {
        setPreview(data.map((row, i) => validateRow(row, i)));
      },
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith('.csv')) parseFile(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    const valid = preview.filter(r => r._valid);
    if (!valid.length) return;

    setImporting(true);
    try {
      const payload = valid.map(({ _index: _i, _valid: _v, _errors: _e, ...row }) => ({
        ...row,
        price:     parseFloat(row.price),
        stock:     row.stock     ? parseInt(row.stock)     : 0,
        old_price: row.old_price ? parseFloat(row.old_price) : null,
        tax_rate:  row.tax_rate  ? parseFloat(row.tax_rate)  : 19,
      }));

      const data = await bulkImportProducts(payload);
      setResults(data.results);
      const okCount = data.ok ?? 0;
      if (okCount > 0) onSuccess(okCount);
    } catch {
      setResults([{ row: 0, status: 'error', error: 'Verbindungsfehler' }]);
    } finally {
      setImporting(false);
    }
  };

  const validCount   = preview?.filter(r => r._valid).length ?? 0;
  const invalidCount = preview?.filter(r => !r._valid).length ?? 0;

  return (
    <div className="csv-modal-backdrop" onClick={onClose}>
      <div className="csv-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="csv-modal__header">
          <div>
            <h2 className="csv-modal__title">CSV-Import</h2>
            <p className="csv-modal__sub">Mehrere Produkte auf einmal anlegen</p>
          </div>
          <button className="csv-modal__close" onClick={onClose} aria-label="Schließen">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="csv-modal__body">

          {/* Vorlage / KI-Prompt */}
          {!preview && (
            <div className="csv-actions">
              <button className="csv-template-btn" onClick={downloadTemplate}>
                <Download size={14} strokeWidth={2} />
                Vorlage herunterladen
              </button>
              <button
                className={`csv-ai-btn${copied ? ' csv-ai-btn--copied' : ''}`}
                onClick={copyPrompt}
              >
                {copied
                  ? <><CheckCircle size={14} strokeWidth={2} /> Kopiert!</>
                  : <><Copy size={14} strokeWidth={1.75} /> KI-Prompt kopieren</>
                }
              </button>
            </div>
          )}

          {/* Drop Zone */}
          {!preview && (
            <div
              className={`csv-dropzone${dragOver ? ' csv-dropzone--over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={28} strokeWidth={1.5} className="csv-dropzone__icon" />
              <p className="csv-dropzone__label">CSV-Datei hier ablegen oder klicken</p>
              <p className="csv-dropzone__hint">Pflichtfelder: name, slug, description, price, category</p>
              <input ref={fileRef} type="file" accept=".csv" className="csv-dropzone__input" onChange={handleFile} />
            </div>
          )}

          {/* Vorschau */}
          {preview && !results && (
            <>
              <div className="csv-stats">
                <span className="csv-stats__file">{fileName}</span>
                <span className="csv-stats__ok"><CheckCircle size={13} /> {validCount} gültig</span>
                {invalidCount > 0 && (
                  <span className="csv-stats__err"><AlertCircle size={13} /> {invalidCount} fehlerhaft</span>
                )}
                <button className="csv-stats__reset" onClick={() => { setPreview(null); setFileName(''); }}>
                  <X size={12} /> Neue Datei
                </button>
              </div>

              <div className="csv-preview">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Preis</th>
                      <th>Kategorie</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(row => (
                      <tr key={row._index} className={row._valid ? '' : 'csv-row--invalid'}>
                        <td className="admin-table__muted">{row._index + 1}</td>
                        <td>{row.name || <span className="admin-table__muted">—</span>}</td>
                        <td className="admin-table__muted">{row.slug || '—'}</td>
                        <td>{row.price ? `€ ${row.price}` : '—'}</td>
                        <td>{row.category || '—'}</td>
                        <td>
                          {row._valid
                            ? <span className="status-badge status-badge--paid">OK</span>
                            : <span className="status-badge status-badge--payment_failed" title={row._errors.join(', ')}>
                                {row._errors[0]}
                              </span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Ergebnis nach Import */}
          {results && (
            <div className="csv-results">
              <div className="csv-results__summary">
                <CheckCircle size={18} className="csv-results__ok-icon" />
                <span>
                  {results.filter(r => r.status === 'ok').length} Produkte importiert
                  {results.filter(r => r.status === 'error').length > 0
                    ? `, ${results.filter(r => r.status === 'error').length} fehlgeschlagen`
                    : ''
                  }
                </span>
              </div>
              {results.filter(r => r.status === 'error').map((r, i) => (
                <div key={i} className="csv-results__error-row">
                  <AlertCircle size={13} />
                  Zeile {r.row} „{r.name}": {r.error}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && !results && (
          <div className="csv-modal__footer">
            <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={importing || validCount === 0}
            >
              {importing
                ? <><Loader2 size={14} className="spin" /> Importiere…</>
                : <><Upload size={14} /> {validCount} Produkte importieren</>
              }
            </button>
          </div>
        )}

        {results && (
          <div className="csv-modal__footer">
            <button className="btn-primary" onClick={onClose}>Fertig</button>
          </div>
        )}
      </div>
    </div>
  );
}
