import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '../hooks/useConsent';
import { ROUTES } from '@config/routes';

export function ConsentBanner() {
  const { decidedAt, isOpen, acceptAll, rejectAll, setAll, close } = useConsent();
  const [expanded, setExpanded]       = useState(false);
  const [analytics,   setAnalytics]   = useState(false);
  const [marketing,   setMarketing]   = useState(false);
  const [preferences, setPreferences] = useState(false);

  if (decidedAt && !isOpen) return null;

  function handleSaveCustom() {
    setAll({ analytics, marketing, preferences });
    close();
  }

  return (
    <div className="consent-banner" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
      <div className="consent-banner__inner">
        <div className="consent-banner__header">
          <span className="consent-banner__icon" aria-hidden="true">🍪</span>
          <h2 className="consent-banner__title">Wir respektieren deine Privatsphäre</h2>
        </div>

        <p className="consent-banner__text">
          Wir verwenden Cookies und ähnliche Technologien, um dir ein optimales
          Einkaufserlebnis zu bieten. Technisch notwendige Cookies sind immer aktiv.
          Weitere Details findest du in unserer{' '}
          <Link to={ROUTES.INFO.PRIVACY} className="consent-banner__link">
            Datenschutzerklärung
          </Link>.
        </p>

        {/* Detaillierte Einstellungen */}
        {expanded && (
          <div className="consent-banner__details">
            <ConsentToggle
              id="consent-necessary"
              label="Technisch notwendig"
              description="Session-Cookies, Warenkorb, Login. Nicht abschaltbar."
              checked={true}
              disabled
              onChange={() => {}}
            />
            <ConsentToggle
              id="consent-analytics"
              label="Analyse"
              description="Helfen uns zu verstehen, wie Besucher die Seite nutzen (anonymisiert)."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ConsentToggle
              id="consent-marketing"
              label="Marketing"
              description="Ermöglichen personalisierte Werbung auf externen Plattformen."
              checked={marketing}
              onChange={setMarketing}
            />
            <ConsentToggle
              id="consent-preferences"
              label="Präferenzen"
              description="Speichern deine persönlichen Einstellungen wie Theme und Sprache."
              checked={preferences}
              onChange={setPreferences}
            />
          </div>
        )}

        <div className="consent-banner__actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Weniger Optionen' : 'Einstellungen anpassen'}
          </button>

          <div className="consent-banner__main-actions">
            <button className="btn btn--secondary btn--sm" onClick={rejectAll}>
              Nur notwendige
            </button>

            {expanded ? (
              <button className="btn btn--primary btn--sm" onClick={handleSaveCustom}>
                Auswahl speichern
              </button>
            ) : (
              <button className="btn btn--primary btn--sm" onClick={acceptAll}>
                Alle akzeptieren
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-Komponente: Ein Toggle-Element ────────────────────────────────────────

interface ConsentToggleProps {
  id:          string;
  label:       string;
  description: string;
  checked:     boolean;
  disabled?:   boolean;
  onChange:    (v: boolean) => void;
}

function ConsentToggle({ id, label, description, checked, disabled, onChange }: ConsentToggleProps) {
  return (
    <div className="consent-toggle">
      <div className="consent-toggle__text">
        <label htmlFor={id} className="consent-toggle__label">
          {label}
          {disabled && <span className="consent-toggle__required"> (Pflicht)</span>}
        </label>
        <p className="consent-toggle__desc">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`consent-toggle__switch${checked ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        aria-label={label}
      />
    </div>
  );
}
