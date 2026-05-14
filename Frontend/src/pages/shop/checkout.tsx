import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@features/cart';
import { createOrder } from '@features/checkout';
import { ProductImage, SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { getErrorMessage } from '@/utils/errorMessage';
import type { PaymentMethod } from '@/types/checkout';

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface ShippingForm {
  firstName:     string;
  lastName:      string;
  street:        string;
  zip:           string;
  city:          string;
  country:       string;
  paymentMethod: PaymentMethod;
}

type FormErrors = Partial<Record<keyof ShippingForm, string>>;

// ── DATA ──────────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; sub: string }> = [
  { value: 'card',          label: 'Kreditkarte',       sub: 'Visa, Mastercard, Amex' },
  { value: 'paypal',        label: 'PayPal',            sub: 'Schnell & sicher' },
  { value: 'klarna',        label: 'Klarna',            sub: 'Kauf auf Rechnung' },
  { value: 'bank-transfer', label: 'Sofortüberweisung', sub: 'Online-Banking' },
];

const INITIAL_FORM: ShippingForm = {
  firstName: '', lastName: '', street: '', zip: '', city: '', country: 'DE',
  paymentMethod: 'card',
};

// ── VALIDATION ────────────────────────────────────────────────────────────────

function validate(form: ShippingForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim())       errors.firstName = 'Vorname erforderlich';
  if (!form.lastName.trim())        errors.lastName  = 'Nachname erforderlich';
  if (!form.street.trim())          errors.street    = 'Straße & Hausnummer erforderlich';
  if (!/^\d{4,10}$/.test(form.zip)) errors.zip      = 'Gültige Postleitzahl eingeben';
  if (!form.city.trim())            errors.city      = 'Stadt erforderlich';
  return errors;
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [form,     setForm]     = useState<ShippingForm>(INITIAL_FORM);
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const cartTotal  = total().toFixed(2);
  const shipping   = parseFloat(cartTotal) >= 50 ? 0 : 4.99;
  const grandTotal = (parseFloat(cartTotal) + shipping).toFixed(2);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name as keyof ShippingForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await createOrder({
        shipping: {
          firstName: form.firstName,
          lastName:  form.lastName,
          street:    form.street,
          zip:       form.zip,
          city:      form.city,
          country:   form.country,
        },
        paymentMethod: form.paymentMethod,
        cartItems: items.map(i => ({ productId: i.id, quantity: i.quantity })),
      });
      clearCart();
      navigate(ROUTES.SHOP.ORDER_SUCCESS, {
        state: { orderNumber: result.orderNumber, total: result.total },
        replace: true,
      });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <SeoMeta title="Kasse" noIndex />
      <section className="section">
        <div className="container">
          <div className="checkout-empty">
            <p className="checkout-empty__text">Dein Warenkorb ist leer.</p>
            <Link to={ROUTES.HOME} className="btn btn--primary">Weiter shoppen</Link>
          </div>
        </div>
      </section>
      </>
    );
  }

  return (
    <>
      <SeoMeta title="Kasse" noIndex />
    <section className="section">
      <div className="container">
        <form className="checkout-page" onSubmit={handleSubmit} noValidate>
          <h1 className="checkout-page__title">Kasse</h1>

          <div className="checkout-page__layout">
            {/* ── Formulare (links) ─────────────────────────────────────── */}
            <div className="checkout-form">

              {apiError && (
                <p className="checkout-form__api-error">{apiError}</p>
              )}

              {/* Lieferadresse */}
              <div className="checkout-form__section">
                <h3 className="checkout-form__section-title">1. Lieferadresse</h3>

                <div className="checkout-form__row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="co-firstname">Vorname</label>
                    <input
                      id="co-firstname"
                      className={`form-input${errors.firstName ? ' form-input--error' : ''}`}
                      type="text"
                      name="firstName"
                      placeholder="Max"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={handleChange}
                    />
                    {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="co-lastname">Nachname</label>
                    <input
                      id="co-lastname"
                      className={`form-input${errors.lastName ? ' form-input--error' : ''}`}
                      type="text"
                      name="lastName"
                      placeholder="Mustermann"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={handleChange}
                    />
                    {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group checkout-form__group--mt">
                  <label className="form-label" htmlFor="co-street">Straße & Hausnummer</label>
                  <input
                    id="co-street"
                    className={`form-input${errors.street ? ' form-input--error' : ''}`}
                    type="text"
                    name="street"
                    placeholder="Musterstraße 1"
                    autoComplete="street-address"
                    value={form.street}
                    onChange={handleChange}
                  />
                  {errors.street && <span className="form-error">{errors.street}</span>}
                </div>

                <div className="checkout-form__row checkout-form__group--mt">
                  <div className="form-group">
                    <label className="form-label" htmlFor="co-zip">PLZ</label>
                    <input
                      id="co-zip"
                      className={`form-input${errors.zip ? ' form-input--error' : ''}`}
                      type="text"
                      name="zip"
                      placeholder="12345"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.zip}
                      onChange={handleChange}
                    />
                    {errors.zip && <span className="form-error">{errors.zip}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="co-city">Stadt</label>
                    <input
                      id="co-city"
                      className={`form-input${errors.city ? ' form-input--error' : ''}`}
                      type="text"
                      name="city"
                      placeholder="Berlin"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={handleChange}
                    />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>
                </div>
              </div>

              {/* Zahlungsmethode */}
              <div className="checkout-form__section">
                <h3 className="checkout-form__section-title">2. Zahlungsmethode</h3>
                <div className="payment-methods">
                  {PAYMENT_METHODS.map(m => (
                    <label
                      key={m.value}
                      className={`payment-option${form.paymentMethod === m.value ? ' payment-option--selected' : ''}`}
                    >
                      <span>
                        <span className="payment-option__label">{m.label}</span>
                        <span className="payment-option__sub">{m.sub}</span>
                      </span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.value}
                        checked={form.paymentMethod === m.value}
                        onChange={handleChange}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Bestellübersicht (rechts) ─────────────────────────────── */}
            <div className="checkout-overview">
              <h3 className="checkout-overview__title">Deine Bestellung</h3>

              <div className="checkout-overview__items">
                {items.map(item => (
                  <div key={item.id} className="checkout-overview__item">
                    <div className="checkout-overview__item-thumb">
                      <ProductImage id={item.id} />
                      <span className="checkout-overview__item-thumb-qty">{item.quantity}</span>
                    </div>
                    <span className="checkout-overview__item-name">{item.name}</span>
                    <span className="checkout-overview__item-price">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-overview__totals">
                <div className="checkout-overview__row">
                  <span>Zwischensumme</span>
                  <span>{cartTotal} €</span>
                </div>
                <div className="checkout-overview__row">
                  <span>Versand</span>
                  <span className={shipping === 0 ? 'checkout-overview__shipping--free' : ''}>
                    {shipping === 0 ? 'Kostenlos' : `${shipping.toFixed(2)} €`}
                  </span>
                </div>
                <div className="checkout-overview__row checkout-overview__row--total">
                  <span>Gesamt</span>
                  <span>{grandTotal} €</span>
                </div>
              </div>

              <div className="checkout-overview__cta">
                <button
                  className="btn btn--primary btn--full"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Bestellung wird verarbeitet …' : `Jetzt kaufen — ${grandTotal} €`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
    </>
  );
}
