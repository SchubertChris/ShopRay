import { useState } from 'react';
import { X, MapPin, Loader2, Save } from 'lucide-react';
import { updateOrderAddress, type ShippingAddress } from '../../api/adminApi';

interface Props {
  orderId:     string;
  orderNumber: string;
  current:     Partial<ShippingAddress>;
  onClose:     () => void;
  onSaved:     (address: ShippingAddress) => void;
}

export default function AddressEditModal({ orderId, orderNumber, current, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ShippingAddress>({
    firstName: current.firstName ?? '',
    lastName:  current.lastName  ?? '',
    street:    current.street    ?? '',
    zip:       current.zip       ?? '',
    city:      current.city      ?? '',
    country:   current.country   ?? 'Deutschland',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (key: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.street || !form.zip || !form.city) {
      setError('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateOrderAddress(orderId, form);
      onSaved(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
      setLoading(false);
    }
  };

  return (
    <div className="csv-modal-backdrop" onClick={onClose}>
      <div className="csv-modal csv-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="csv-modal__header">
          <div className="csv-modal__title">
            <MapPin size={16} strokeWidth={1.75} />
            Lieferadresse korrigieren
          </div>
          <button className="csv-modal__close" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="csv-modal__body">
          <p className="csv-modal__hint">
            Bestellung <strong>{orderNumber}</strong> — Adresse wird sofort gespeichert.
            Gilt nur für die Bestelldaten, nicht für ein bereits erstelltes DHL-Label.
          </p>

          <div className="address-edit-grid">
            <div className="form-field">
              <label className="form-label">Vorname *</label>
              <input className="form-input" value={form.firstName} onChange={set('firstName')} placeholder="Max" />
            </div>
            <div className="form-field">
              <label className="form-label">Nachname *</label>
              <input className="form-input" value={form.lastName} onChange={set('lastName')} placeholder="Mustermann" />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Straße + Hausnummer *</label>
            <input className="form-input" value={form.street} onChange={set('street')} placeholder="Musterstraße 1" />
          </div>

          <div className="address-edit-grid">
            <div className="form-field">
              <label className="form-label">PLZ *</label>
              <input className="form-input" value={form.zip} onChange={set('zip')} placeholder="12345" />
            </div>
            <div className="form-field">
              <label className="form-label">Stadt *</label>
              <input className="form-input" value={form.city} onChange={set('city')} placeholder="Berlin" />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Land</label>
            <input className="form-input" value={form.country} onChange={set('country')} placeholder="Deutschland" />
          </div>

          {error && <p className="csv-modal__error">{error}</p>}
        </div>

        <div className="csv-modal__footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading
              ? <><Loader2 size={14} strokeWidth={2} className="spin" /> Speichert…</>
              : <><Save    size={14} strokeWidth={2} /> Adresse speichern</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
