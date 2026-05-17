import { useState } from 'react';
import { X, Package, Loader2, ExternalLink } from 'lucide-react';
import { createShippingLabel } from '../../api/adminApi';

interface Props {
  orderId:     string;
  orderNumber: string;
  onClose:     () => void;
  onCreated:   (trackingNumber: string) => void;
}

function downloadLabel(b64: string, orderNumber: string): void {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob   = new Blob([bytes], { type: 'application/pdf' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `Versandlabel_${orderNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ShippingLabelModal({ orderId, orderNumber, onClose, onCreated }: Props) {
  const [weight,  setWeight]  = useState<string>('500');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleCreate = async () => {
    const w = parseInt(weight, 10);
    if (!w || w < 1 || w > 31500) {
      setError('Gewicht muss zwischen 1 g und 31.500 g liegen.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createShippingLabel(orderId, w);
      downloadLabel(result.label_b64, orderNumber);
      onCreated(result.tracking_number);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'DHL-Fehler — Label nicht erstellt.');
      setLoading(false);
    }
  };

  return (
    <div className="csv-modal-backdrop" onClick={onClose}>
      <div className="csv-modal csv-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="csv-modal__header">
          <div className="csv-modal__title">
            <Package size={16} strokeWidth={1.75} />
            DHL Versandlabel erstellen
          </div>
          <button className="csv-modal__close" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="csv-modal__body">
          <p className="csv-modal__hint">
            Für Bestellung <strong>{orderNumber}</strong> wird ein DHL-Label erstellt.<br />
            Der Status wird automatisch auf <em>Versendet</em> gesetzt.
          </p>

          <div className="form-field">
            <label className="form-label">
              Paketgewicht (Gramm)
            </label>
            <div className="label-weight-row">
              <input
                type="number"
                className="form-input"
                value={weight}
                min={1}
                max={31500}
                step={10}
                onChange={e => setWeight(e.target.value)}
                placeholder="z.B. 500"
              />
              <span className="label-weight-unit">g</span>
            </div>
            <p className="form-hint">1 g – 31.500 g (DHL Maximalgewicht). Standard-Päckchen: 500 g, Paket: 1000–5000 g.</p>
          </div>

          {error && <p className="csv-modal__error">{error}</p>}
        </div>

        <div className="csv-modal__footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Abbrechen
          </button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading
              ? <><Loader2 size={14} strokeWidth={2} className="spin" /> Erstelle Label…</>
              : <><ExternalLink size={14} strokeWidth={2} /> Label erstellen & herunterladen</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
