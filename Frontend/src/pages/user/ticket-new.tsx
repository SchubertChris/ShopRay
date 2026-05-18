import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createTicket } from '@features/tickets';
import type { TicketCategory, TicketPriority } from '@features/tickets';
import { useAuth } from '@features/auth';
import { getErrorMessage } from '@/utils/errorMessage';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

// ── DATA ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Bestellung & Lieferung',
  'Rückgabe & Reklamation',
  'Zahlung & Rechnung',
  'Produkt & Qualität',
  'Konto & Datenschutz',
  'Sonstiges',
];

const PRIORITIES = [
  { value: 'normal',    label: 'Normal' },
  { value: 'high',      label: 'Hoch' },
  { value: 'urgent',    label: 'Dringend' },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function TicketNewPage() {
  const { isAuthenticated } = useAuth();
  const isGuest             = !isAuthenticated;

  const [form, setForm] = useState<{
    subject:     string;
    category:    TicketCategory;
    priority:    TicketPriority;
    description: string;
    guestEmail:  string;
  }>({
    subject:     '',
    category:    CATEGORIES[0] as TicketCategory,
    priority:    'normal',
    description: '',
    guestEmail:  '',
  });
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setApiError(null);
    try {
      await createTicket({
        ...form,
        ...(isGuest && form.guestEmail ? { guestEmail: form.guestEmail } : {}),
      });
      setSent(true);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <>
        <SeoMeta title="Ticket erstellt" noIndex />
      <div className="ticket-sent">
        <div className="ticket-sent__icon" aria-hidden="true" />
        <span className="ticket-sent__tag">Ticket erstellt</span>
        <h2 className="ticket-sent__title">Wir haben deine Anfrage erhalten.</h2>
        <p className="ticket-sent__body">
          Du erhältst in Kürze eine Bestätigung per E-Mail. Unser Team meldet sich
          so schnell wie möglich bei dir.
        </p>
        <div className="ticket-sent__actions">
          <Link to={ROUTES.ACCOUNT.TICKETS} className="btn btn--primary btn--sm">
            Meine Tickets
          </Link>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => { setSent(false); setApiError(null); setForm({ subject: '', category: CATEGORIES[0] as TicketCategory, priority: 'normal', description: '', guestEmail: '' }); }}
          >
            Weiteres Ticket erstellen
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <SeoMeta title="Neues Ticket" noIndex />
    <div className="ticket-new-page">
      <div className="ticket-new-head">
        <Link to={ROUTES.ACCOUNT.TICKETS} className="ticket-new-head__back">
          ← Meine Tickets
        </Link>
        <h1 className="ticket-new-head__title">Neues Ticket</h1>
        <p className="ticket-new-head__sub">
          Beschreibe dein Anliegen so genau wie möglich — das hilft uns, schneller zu antworten.
        </p>
      </div>

      <form className="ticket-form" onSubmit={handleSubmit} noValidate>
        {apiError && <p className="ticket-form__api-error">{apiError}</p>}

        {isGuest && (
          <div className="ticket-form__guest-banner">
            <div className="ticket-form__field">
              <label className="ticket-form__label" htmlFor="tf-guestemail">
                Deine E-Mail-Adresse <span className="ticket-form__required">*</span>
              </label>
              <input
                id="tf-guestemail"
                className="ticket-form__input"
                type="email"
                name="guestEmail"
                placeholder="deine@email.de"
                autoComplete="email"
                value={form.guestEmail}
                onChange={handleChange}
                required
              />
            </div>
            <p className="ticket-form__guest-hint">
              Kein Konto? Kein Problem.{' '}
              <Link to={ROUTES.AUTH.LOGIN} className="ticket-form__guest-link">Anmelden</Link>
              {' '}um deine Tickets jederzeit einzusehen.
            </p>
          </div>
        )}

        <div className="ticket-form__field">
          <label className="ticket-form__label" htmlFor="tf-subject">Betreff</label>
          <input
            id="tf-subject"
            className="ticket-form__input"
            type="text"
            name="subject"
            placeholder="Kurze Beschreibung deines Anliegens"
            value={form.subject}
            onChange={handleChange}
            required
            autoComplete="off"
          />
        </div>

        <div className="ticket-form__row">
          <div className="ticket-form__field">
            <label className="ticket-form__label" htmlFor="tf-category">Kategorie</label>
            <div className="ticket-form__select-wrap">
              <select
                id="tf-category"
                className="ticket-form__select"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className="ticket-form__select-arrow" aria-hidden="true" />
            </div>
          </div>

          <div className="ticket-form__field">
            <label className="ticket-form__label" htmlFor="tf-priority">Priorität</label>
            <div className="ticket-form__select-wrap">
              <select
                id="tf-priority"
                className="ticket-form__select"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <span className="ticket-form__select-arrow" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="ticket-form__field">
          <label className="ticket-form__label" htmlFor="tf-description">Beschreibung</label>
          <textarea
            id="tf-description"
            className="ticket-form__textarea"
            name="description"
            placeholder="Was ist passiert? Was hast du erwartet? Welche Schritte haben zum Problem geführt?"
            rows={6}
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="ticket-form__field">
          <span className="ticket-form__label">Anhang (optional)</span>
          <label className="ticket-form__file-drop" htmlFor="tf-file">
            <div className="ticket-form__file-inner">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="ticket-form__file-label">Datei auswählen oder hier ablegen</span>
              <span className="ticket-form__file-hint">PNG, JPG, PDF bis 10 MB</span>
            </div>
            <input id="tf-file" type="file" className="ticket-form__file-input" accept=".png,.jpg,.jpeg,.pdf" aria-label="Datei anhängen" />
          </label>
        </div>

        <div className="ticket-form__footer">
          <button
            className={`btn btn--primary${sending ? ' is-sending' : ''}`}
            type="submit"
            disabled={sending}
          >
            {sending ? 'Wird gesendet …' : 'Ticket absenden'}
          </button>
          <Link to={ROUTES.ACCOUNT.TICKETS} className="btn btn--ghost">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
    </>
  );
}
