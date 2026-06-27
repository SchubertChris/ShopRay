import { useState } from 'react';
import { subscribeNewsletter } from '@features/newsletter';

export function NewsletterSection() {
  const [email,    setEmail]    = useState('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubState('loading');
    try {
      await subscribeNewsletter({ email: trimmed });
      setSubState('done');
      setEmail('');
    } catch {
      setSubState('error');
    }
  }

  return (
    <section className="cs-newsletter" aria-labelledby="newsletter-heading">
      <div className="cs-newsletter__inner">
        <span className="cs-eyebrow" data-reveal>Exklusiv für Mitglieder</span>
        <h2 id="newsletter-heading" className="cs-newsletter__title" data-reveal>
          Immer als Erster.
        </h2>
        <p className="cs-newsletter__sub" data-reveal>
          Neue Produkte, exklusive Angebote und 10 % Rabatt auf deine erste Bestellung —
          direkt in deinen Posteingang.
        </p>

        <form className="cs-newsletter__form" onSubmit={handleSubscribe} data-reveal>
          <input
            type="email"
            className="cs-newsletter__input"
            placeholder="deine@email.de"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={subState === 'loading' || subState === 'done'}
            required
            aria-label="E-Mail-Adresse"
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={subState === 'loading' || subState === 'done'}
          >
            {subState === 'loading' ? 'Wird eingetragen…'
             : subState === 'done'  ? '✓ Eingetragen!'
             : 'Anmelden'}
          </button>
        </form>

        {subState === 'error' && (
          <p className="cs-newsletter__error" role="alert">
            Ein Fehler ist aufgetreten — bitte erneut versuchen.
          </p>
        )}

        <p className="cs-newsletter__disclaimer">
          Kein Spam · Jederzeit abmeldbar · DSGVO-konform
        </p>
      </div>
    </section>
  );
}
