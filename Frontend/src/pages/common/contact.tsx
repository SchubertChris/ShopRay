import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitContact } from '@features/contact';
import { getErrorMessage } from '@/utils/errorMessage';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { IMAGES } from '@config/images';

// ── DATA ──────────────────────────────────────────────────────────────────────

const CHANNELS = [
  { tag: 'E-Mail',   value: 'hallo@Concepts.de', sub: 'Antwort in unter 2 h' },
  { tag: 'Telefon',  value: '+49 30 000 000 00',      sub: 'Mo–Fr · 09–17 Uhr' },
  { tag: 'Chat',     value: 'Live im Shop',            sub: 'Mo–Fr · 09–18 Uhr' },
];

const SUBJECTS = [
  'Allgemeine Anfrage',
  'Bestellung & Lieferung',
  'Rückgabe & Reklamation',
  'Zusammenarbeit',
  'Presse & Medien',
  'Sonstiges',
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
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
      await submitContact(form);
      setSent(true);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <SeoMeta
        title="Kontakt"
        description="Hast du Fragen? Schreib uns — wir antworten in der Regel innerhalb von 2 Stunden."
      />
    <div className="contact-page">
      <div className="contact-split">

        {/* ── LINKE SEITE — Brand-Panel mit Werbebild ─────────────────────── */}
        <aside className="contact-brand">

          {/* Werbebild */}
          <div className="contact-ad">
            {IMAGES.contact ? (
              <>
                <img src={IMAGES.contact} alt="" loading="lazy" className="contact-ad__img" />
                <div className="contact-ad__overlay" aria-hidden="true" />
              </>
            ) : (
              <>
                <div className="contact-ad__dots" aria-hidden="true" />
                <div className="contact-ad__inner">
                  <span className="contact-ad__tag">Werbebild</span>
                  <p className="contact-ad__hint">Produkt-Foto · Markenbild · Kampagnen-Visual</p>
                  <span className="contact-ad__size">Empfohlen: 800 × 900 px</span>
                </div>
              </>
            )}
            <div className="contact-ad__corner contact-ad__corner--tl" aria-hidden="true" />
            <div className="contact-ad__corner contact-ad__corner--tr" aria-hidden="true" />
            <div className="contact-ad__corner contact-ad__corner--bl" aria-hidden="true" />
            <div className="contact-ad__corner contact-ad__corner--br" aria-hidden="true" />
          </div>

          {/* Brand-Statement + Kanäle */}
          <div className="contact-brand__content">
            <h1 className="contact-brand__title">
              Wir sind<br />
              <em>für dich da.</em>
            </h1>
            <p className="contact-brand__sub">
              Persönlicher Kontakt statt Ticket-System.
              Echte Antworten von echten Menschen.
            </p>

            <div className="contact-channels">
              {CHANNELS.map(ch => (
                <div key={ch.tag} className="contact-channel">
                  <span className="contact-channel__tag">{ch.tag}</span>
                  <div className="contact-channel__info">
                    <span className="contact-channel__value">{ch.value}</span>
                    <span className="contact-channel__sub">{ch.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* ── RECHTE SEITE — Formular ──────────────────────────────────────── */}
        <main className="contact-main">
          <div className="contact-form-wrap">
            <div className="contact-form-head">
              <span className="label">Direkte Nachricht</span>
              <h2 className="contact-form-head__title">Schreib uns.</h2>
              <p className="contact-form-head__sub">
                Durchschnittliche Antwortzeit: unter 2 Stunden.
              </p>
            </div>

            {sent ? (
              <div className="contact-sent">
                <div className="contact-sent__icon" aria-hidden="true" />
                <h3 className="contact-sent__title">Nachricht gesendet.</h3>
                <p className="contact-sent__text">
                  Wir melden uns in der Regel innerhalb von 2 Stunden bei dir.
                </p>
                <button
                  className="btn btn--ghost"
                  onClick={() => { setSent(false); setApiError(null); setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' }); }}
                >
                  Weitere Nachricht senden
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                {apiError && <p className="contact-form__error">{apiError}</p>}
                <div className="contact-form__row">
                  <div className="contact-form__field">
                    <label className="contact-form__label" htmlFor="cf-name">Name</label>
                    <input
                      id="cf-name"
                      className="contact-form__input"
                      type="text"
                      name="name"
                      placeholder="Dein Name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="contact-form__field">
                    <label className="contact-form__label" htmlFor="cf-email">E-Mail</label>
                    <input
                      id="cf-email"
                      className="contact-form__input"
                      type="email"
                      name="email"
                      placeholder="deine@email.de"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="contact-form__field">
                  <label className="contact-form__label" htmlFor="cf-subject">Betreff</label>
                  <div className="contact-form__select-wrap">
                    <select
                      id="cf-subject"
                      className="contact-form__select"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                    >
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className="contact-form__select-arrow" aria-hidden="true" />
                  </div>
                </div>

                <div className="contact-form__field">
                  <label className="contact-form__label" htmlFor="cf-message">Nachricht</label>
                  <textarea
                    id="cf-message"
                    className="contact-form__textarea"
                    name="message"
                    placeholder="Wie können wir dir helfen?"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="contact-form__footer">
                  <button
                    className={`btn btn--primary btn--lg contact-form__submit${sending ? ' is-sending' : ''}`}
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? 'Wird gesendet …' : 'Nachricht senden'}
                  </button>
                  <p className="contact-form__privacy">
                    Deine Daten werden ausschließlich zur Bearbeitung deiner Anfrage genutzt.
                    Mehr in unserer{' '}
                    <Link to={ROUTES.INFO.PRIVACY}>Datenschutzerklärung</Link>.
                  </p>
                </div>
              </form>
            )}
          </div>
        </main>

      </div>
    </div>
    </>
  );
}
