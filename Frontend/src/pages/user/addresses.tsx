import { useState, useEffect } from 'react';
import { SeoMeta } from '@components/ui';
import { getProfile, updateAddress } from '@features/users';
import { getErrorMessage } from '@/utils/errorMessage';
import type { Address } from '@/types/user';

const EMPTY: Address = {
  firstName: '',
  lastName:  '',
  street:    '',
  zip:       '',
  city:      '',
  country:   'Deutschland',
};

export default function AddressesPage() {
  const [form,    setForm]    = useState<Address>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [current, setCurrent] = useState<Address | null>(null);

  useEffect(() => {
    getProfile()
      .then(p => {
        setCurrent(p.address);
        if (p.address) setForm(p.address);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const saved = await updateAddress(form);
      setCurrent(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SeoMeta title="Adressen" noIndex />
      <div className="addresses-page">

        <div className="addresses-page__header">
          <h2 className="addresses-page__title">Meine Adresse</h2>
        </div>

        {/* ── Aktuelle Adresse ── */}
        {!loading && current && (
          <div className="address-current">
            <div className="address-current__label">Gespeicherte Lieferadresse</div>
            <div className="address-current__text">
              <strong>{current.firstName} {current.lastName}</strong>
              {current.street}<br />
              {current.zip} {current.city}<br />
              {current.country}
            </div>
          </div>
        )}

        {/* ── Adress-Formular ── */}
        <div className="address-form">
          <div className="address-form__title">
            {current ? 'Adresse bearbeiten' : 'Adresse hinzufügen'}
          </div>

          {loading ? (
            <div className="page-loader page-loader--inline">
              <span className="spinner" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <p className="address-form__error">{error}</p>}

              <div className="address-form__grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="addr-firstname">Vorname</label>
                  <input
                    id="addr-firstname"
                    className="form-input"
                    name="firstName"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="addr-lastname">Nachname</label>
                  <input
                    id="addr-lastname"
                    className="form-input"
                    name="lastName"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group address-form__full">
                  <label className="form-label" htmlFor="addr-street">Straße &amp; Hausnummer</label>
                  <input
                    id="addr-street"
                    className="form-input"
                    name="street"
                    type="text"
                    required
                    value={form.street}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="addr-zip">Postleitzahl</label>
                  <input
                    id="addr-zip"
                    className="form-input"
                    name="zip"
                    type="text"
                    required
                    value={form.zip}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="addr-city">Stadt</label>
                  <input
                    id="addr-city"
                    className="form-input"
                    name="city"
                    type="text"
                    required
                    value={form.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group address-form__full">
                  <label className="form-label" htmlFor="addr-country">Land</label>
                  <input
                    id="addr-country"
                    className="form-input"
                    name="country"
                    type="text"
                    required
                    value={form.country}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="address-form__actions">
                <button className="btn btn--primary btn--sm" type="submit" disabled={saving}>
                  {saving ? 'Speichert…' : 'Adresse speichern'}
                </button>
                {success && <span className="address-form__success">✓ Gespeichert</span>}
              </div>
            </form>
          )}
        </div>

      </div>
    </>
  );
}
