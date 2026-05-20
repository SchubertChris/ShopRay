import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@features/cart';
import { createOrder, validateDiscountCode } from '@features/checkout';
import { useAuth } from '@features/auth';
import { ProductImage, SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { getErrorMessage } from '@/utils/errorMessage';
import type { PaymentMethod, DiscountValidation } from '@/types/checkout';
import { API_BASE } from '@config/api';

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface ShippingForm {
  firstName:     string;
  lastName:      string;
  street:        string;
  zip:           string;
  city:          string;
  country:       string;
  paymentMethod: PaymentMethod;
  guestEmail:    string;
}

type FormErrors = Partial<Record<keyof ShippingForm, string>>;

// ── SHIPPING SETTINGS ─────────────────────────────────────────────────────────

interface ShippingConfig { standard: number; free_above: number; }

// ── DATA ──────────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; sub: string; logo: React.ReactNode }> = [
  {
    value: 'card',
    label: 'Kreditkarte',
    sub: 'Visa · Mastercard · Amex',
    logo: (
      <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="30" rx="4" fill="#1A1F71" />
        <text x="7" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.5">VISA</text>
        <circle cx="32" cy="15" r="7" fill="#EB001B" />
        <circle cx="39" cy="15" r="7" fill="#F79E1B" />
        <path d="M35.5 9.68A7 7 0 0 1 35.5 20.32A7 7 0 0 1 35.5 9.68Z" fill="#FF5F00" />
      </svg>
    ),
  },
  {
    value: 'paypal',
    label: 'PayPal',
    sub: 'Schnell & sicher',
    logo: (
      <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="30" rx="4" fill="#003087" />
        <text x="7" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="#009CDE" letterSpacing="-0.3">Pay</text>
        <text x="25" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.3">Pal</text>
      </svg>
    ),
  },
  {
    value: 'klarna',
    label: 'Klarna',
    sub: 'Kauf auf Rechnung',
    logo: (
      <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="30" rx="4" fill="#FFB3C7" />
        <text x="24" y="21" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="12" fontWeight="900" fill="#17120E" letterSpacing="-0.3">klarna</text>
      </svg>
    ),
  },
  {
    value: 'bank-transfer',
    label: 'SEPA-Lastschrift',
    sub: 'Direkt vom Bankkonto',
    logo: (
      <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="48" height="30" rx="4" fill="#003399" />
        <text x="7" y="21" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.3">SEPA</text>
      </svg>
    ),
  },
];

const INITIAL_FORM: ShippingForm = {
  firstName: '', lastName: '', street: '', zip: '', city: '', country: 'DE',
  paymentMethod: 'card',
  guestEmail: '',
};

// ── VALIDATION ────────────────────────────────────────────────────────────────

function validate(form: ShippingForm, isGuest: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim())       errors.firstName = 'Vorname erforderlich';
  if (!form.lastName.trim())        errors.lastName  = 'Nachname erforderlich';
  if (!form.street.trim())          errors.street    = 'Straße & Hausnummer erforderlich';
  if (!/^\d{4,10}$/.test(form.zip)) errors.zip      = 'Gültige Postleitzahl eingeben';
  if (!form.city.trim())            errors.city      = 'Stadt erforderlich';
  if (isGuest) {
    if (!form.guestEmail.trim())                         errors.guestEmail = 'E-Mail-Adresse erforderlich';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail.trim())) errors.guestEmail = 'Ungültige E-Mail-Adresse';
  }
  return errors;
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, total }   = useCart();
  const { isAuthenticated } = useAuth();
  const isGuest             = !isAuthenticated;

  const [form,           setForm]           = useState<ShippingForm>(INITIAL_FORM);
  const [errors,         setErrors]         = useState<FormErrors>({});
  const [loading,        setLoading]        = useState(false);
  const [apiError,       setApiError]       = useState<string | null>(null);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({ standard: 4.90, free_above: 50 });

  // Gutscheincode
  const [discountInput,      setDiscountInput]      = useState('');
  const [discountValidating, setDiscountValidating] = useState(false);
  const [discountError,      setDiscountError]      = useState<string | null>(null);
  const [discount,           setDiscount]           = useState<DiscountValidation | null>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/settings/shipping`)
      .then(r => r.ok ? r.json() : null)
      .then((data: ShippingConfig | null) => {
        if (data) setShippingConfig({ standard: data.standard, free_above: data.free_above });
      })
      .catch(() => { /* Fallback-Werte bleiben */ });
  }, []);

  const cartTotal      = total().toFixed(2);
  const shipping       = shippingConfig.free_above > 0 && parseFloat(cartTotal) >= shippingConfig.free_above ? 0 : shippingConfig.standard;
  const discountAmount = discount?.discountAmount ?? 0;
  const grandTotal     = Math.max(0, parseFloat(cartTotal) + shipping - discountAmount).toFixed(2);

  async function handleApplyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setDiscountValidating(true);
    setDiscountError(null);
    setDiscount(null);
    try {
      const result = await validateDiscountCode(code, parseFloat(cartTotal) + shipping);
      setDiscount(result);
    } catch (err) {
      setDiscountError(getErrorMessage(err));
    } finally {
      setDiscountValidating(false);
    }
  }

  function handleRemoveDiscount() {
    setDiscount(null);
    setDiscountInput('');
    setDiscountError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name as keyof ShippingForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate(form, isGuest);
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
        cartItems:     items.map(i => ({ productId: i.id, quantity: i.quantity, ...(i.sku ? { skuId: i.sku.id } : {}) })),
        ...(isGuest && form.guestEmail ? { guestEmail:   form.guestEmail  } : {}),
        ...(discount                   ? { discountCode: discount.code     } : {}),
      });
      // Weiterleitung zur Stripe-Hosted-Checkout-Seite
      // clearCart() wird erst auf der order-success Seite aufgerufen (nach abgeschlossener Zahlung)
      window.location.href = result.checkoutUrl;
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

          {/* ── Schritte-Anzeige ────────────────────────────────────────── */}
          <div className="checkout-steps">
            <div className="checkout-step checkout-step--done">
              <span className="checkout-step__num">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Warenkorb
            </div>
            <div className="checkout-step checkout-step--active">
              <span className="checkout-step__num">2</span>
              Kasse
            </div>
            <div className="checkout-step">
              <span className="checkout-step__num">3</span>
              Bestätigung
            </div>
          </div>

          <div className="checkout-page__layout">
            {/* ── Formulare (links) ─────────────────────────────────────── */}
            <div className="checkout-form">

              {apiError && (
                <p className="checkout-form__api-error">{apiError}</p>
              )}

              {/* Gast-E-Mail */}
              {isGuest && (
                <div className="checkout-form__section">
                  <h3 className="checkout-form__section-title">1. Deine E-Mail-Adresse</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="co-guestemail">E-Mail für Bestellbestätigung</label>
                    <input
                      id="co-guestemail"
                      className={`form-input${errors.guestEmail ? ' form-input--error' : ''}`}
                      type="email"
                      name="guestEmail"
                      placeholder="deine@email.de"
                      autoComplete="email"
                      value={form.guestEmail}
                      onChange={handleChange}
                    />
                    {errors.guestEmail && <span className="form-error">{errors.guestEmail}</span>}
                  </div>
                  <p className="checkout-form__guest-hint">
                    Kein Konto? Kein Problem — du erhältst deine Bestellbestätigung per E-Mail.{' '}
                    <Link to={ROUTES.AUTH.LOGIN} className="checkout-form__guest-link">Anmelden</Link>
                  </p>
                </div>
              )}

              {/* Lieferadresse */}
              <div className="checkout-form__section">
                <h3 className="checkout-form__section-title">{isGuest ? '2.' : '1.'} Lieferadresse</h3>

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
                <h3 className="checkout-form__section-title">{isGuest ? '3.' : '2.'} Zahlungsmethode</h3>
                <div className="payment-methods">
                  {PAYMENT_METHODS.map(m => (
                    <label
                      key={m.value}
                      className={`payment-option${form.paymentMethod === m.value ? ' payment-option--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.value}
                        checked={form.paymentMethod === m.value}
                        onChange={handleChange}
                        className="payment-option__radio"
                      />
                      <div className="payment-option__logo">{m.logo}</div>
                      <div className="payment-option__text">
                        <span className="payment-option__label">{m.label}</span>
                        <span className="payment-option__sub">{m.sub}</span>
                      </div>
                      {form.paymentMethod === m.value && (
                        <div className="payment-option__check" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="7" fill="currentColor" />
                            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
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
                      <ProductImage product={item} />
                      <span className="checkout-overview__item-thumb-qty">{item.quantity}</span>
                    </div>
                    <span className="checkout-overview__item-name">{item.name}</span>
                    <span className="checkout-overview__item-price">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>

              {/* Gutscheincode */}
              <div className="checkout-discount">
                {!discount ? (
                  <>
                    <div className="checkout-discount__row">
                      <input
                        ref={discountInputRef}
                        className="checkout-discount__input"
                        type="text"
                        placeholder="Gutscheincode"
                        value={discountInput}
                        onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(null); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyDiscount())}
                        maxLength={50}
                        disabled={discountValidating}
                      />
                      <button
                        type="button"
                        className="checkout-discount__apply"
                        onClick={handleApplyDiscount}
                        disabled={discountValidating || !discountInput.trim()}
                      >
                        {discountValidating ? '…' : 'Einlösen'}
                      </button>
                    </div>
                    {discountError && (
                      <p className="checkout-discount__error">{discountError}</p>
                    )}
                  </>
                ) : (
                  <div className="checkout-discount__applied">
                    <span className="checkout-discount__applied-code">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {discount.code}
                    </span>
                    <span className="checkout-discount__applied-amount">
                      − {discountAmount.toFixed(2)} €
                    </span>
                    <button
                      type="button"
                      className="checkout-discount__remove"
                      onClick={handleRemoveDiscount}
                      aria-label="Gutschein entfernen"
                    >
                      ×
                    </button>
                  </div>
                )}
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
                {discount && (
                  <div className="checkout-overview__row checkout-overview__row--discount">
                    <span>Rabatt ({discount.code})</span>
                    <span>− {discountAmount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="checkout-overview__row checkout-overview__row--total">
                  <span>Gesamt</span>
                  <span>{grandTotal} €</span>
                </div>
                <p className="checkout-overview__tax-hint">
                  inkl. MwSt. · <Link to={ROUTES.INFO.SHIPPING} className="checkout-overview__tax-link">zzgl. Versandkosten</Link>
                </p>
              </div>

              <div className="checkout-overview__cta">
                <button
                  className="btn btn--primary btn--full"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Bestellung wird verarbeitet …'
                    : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Jetzt kaufen — {grandTotal} €
                      </>
                    )
                  }
                </button>
                <div className="checkout-trust">
                  <span className="checkout-trust__item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                    SSL-verschlüsselt
                  </span>
                  <span className="checkout-trust__item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Käuferschutz
                  </span>
                  <span className="checkout-trust__item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12h18M3 12l4-4M3 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    30 Tage Rückgabe
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
    </>
  );
}
