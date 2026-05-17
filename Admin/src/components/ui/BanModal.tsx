import { useState } from 'react';
import { X, ShieldOff, Loader2 } from 'lucide-react';
import { banCustomer } from '../../api/adminApi';

interface Props {
  customer: { id: string; name: string | null; email: string | null };
  onClose:  () => void;
  onBanned: () => void;
}

export default function BanModal({ customer, onClose, onBanned }: Props) {
  const [reason,   setReason]   = useState('');
  const [banType,  setBanType]  = useState<'permanent' | 'temporary'>('permanent');
  const [until,    setUntil]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Bitte gib einen Sperrgrund an.');
      return;
    }

    if (banType === 'temporary') {
      if (!until) {
        setError('Bitte wähle ein Enddatum aus.');
        return;
      }
      const untilDate = new Date(until);
      if (untilDate <= new Date()) {
        setError('Das Enddatum muss in der Zukunft liegen.');
        return;
      }
    }

    setLoading(true);
    try {
      const untilIso = banType === 'temporary' && until
        ? new Date(until + 'T23:59:59.000Z').toISOString()
        : undefined;
      await banCustomer(customer.id, reason.trim(), untilIso);
      onBanned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sperrung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csv-modal-backdrop" onClick={onClose}>
      <div className="csv-modal" onClick={e => e.stopPropagation()}>

        <div className="csv-modal__header">
          <div>
            <h2 className="csv-modal__title">Konto sperren</h2>
            <p className="csv-modal__sub">{customer.name ?? customer.email ?? 'Unbekannter Kunde'}</p>
          </div>
          <button className="csv-modal__close" onClick={onClose} aria-label="Schließen">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="csv-modal__body">

            <div className="form-group">
              <label className="form-label" htmlFor="ban-reason">
                Sperrgrund <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="ban-reason"
                className="form-input"
                rows={3}
                maxLength={500}
                placeholder="Warum wird dieses Konto gesperrt?"
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={loading}
                required
              />
              <p className="form-hint">{reason.length}/500 Zeichen</p>
            </div>

            <div className="form-group">
              <p className="form-label">Sperrdauer</p>
              <div className="ban-type-options">
                <label className="ban-type-option">
                  <input
                    type="radio"
                    name="banType"
                    value="permanent"
                    checked={banType === 'permanent'}
                    onChange={() => { setBanType('permanent'); setUntil(''); }}
                    disabled={loading}
                  />
                  <span>Dauerhaft</span>
                </label>
                <label className="ban-type-option">
                  <input
                    type="radio"
                    name="banType"
                    value="temporary"
                    checked={banType === 'temporary'}
                    onChange={() => setBanType('temporary')}
                    disabled={loading}
                  />
                  <span>Temporär bis…</span>
                </label>
              </div>
            </div>

            {banType === 'temporary' && (
              <div className="form-group">
                <label className="form-label" htmlFor="ban-until">
                  Gesperrt bis <span aria-hidden="true">*</span>
                </label>
                <input
                  id="ban-until"
                  type="date"
                  className="form-input"
                  min={minDate}
                  value={until}
                  onChange={e => setUntil(e.target.value)}
                  disabled={loading}
                  required={banType === 'temporary'}
                />
              </div>
            )}

            {error && <p className="form-error-inline">{error}</p>}

          </div>

          <div className="csv-modal__footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={loading || !reason.trim()}
            >
              {loading
                ? <><Loader2 size={14} className="spin" /> Wird gesperrt…</>
                : <><ShieldOff size={14} /> Konto sperren</>
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
