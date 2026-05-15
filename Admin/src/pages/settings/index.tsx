import { useState, useEffect } from 'react';
import { Save, Store, Mail, Truck, Lock, ShieldCheck, Monitor, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { getLoginLog, getShippingSettings, updateShippingSettings, type LoginLogEntry, type ShippingSettings } from '../../api/adminApi';

type SettingsTab = 'shop' | 'smtp' | 'shipping' | 'security';

const TABS: Array<{ key: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { key: 'shop',     label: 'Shop-Infos',    icon: Store  },
  { key: 'smtp',     label: 'E-Mail (SMTP)', icon: Mail   },
  { key: 'shipping', label: 'Versand',       icon: Truck  },
  { key: 'security', label: 'Sicherheit',    icon: Lock   },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('shop');

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">System</span>
          <h1 className="page-header__title">Einstellungen</h1>
          <p className="page-header__sub">Shop-Konfiguration und Systeminformationen</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar-Tabs */}
        <aside className="settings-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`settings-nav__item${tab === t.key ? ' is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <t.icon size={15} strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="settings-content">
          {tab === 'shop' && <ShopSettings />}
          {tab === 'smtp' && <SmtpSettings />}
          {tab === 'shipping' && <ShippingSettings />}
          {tab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </>
  );
}

// ── Shop-Informationen ────────────────────────────────────────────────────────
function ShopSettings() {
  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">Shop-Informationen</h2>
        <p className="form-section__desc">Wird im Footer, in E-Mails und im Impressum angezeigt.</p>
      </div>
      <div className="form-field">
        <label className="form-label">Shop-Name</label>
        <input type="text" className="form-input" defaultValue="ShopRay" />
      </div>
      <div className="form-field">
        <label className="form-label">Beschreibung</label>
        <input type="text" className="form-input" defaultValue="Dein nachhaltiger Online-Shop." />
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Shop-URL</label>
          <input type="url" className="form-input" defaultValue="https://deinshop.de" />
        </div>
        <div className="form-field">
          <label className="form-label">Support-E-Mail</label>
          <input type="email" className="form-input" defaultValue="hello@deinshop.de" />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">Telefon (Impressum)</label>
        <input type="tel" className="form-input" placeholder="+49 30 1234567" />
      </div>
      <div className="form-actions">
        <button className="btn-primary">
          <Save size={14} strokeWidth={2} />
          Speichern
        </button>
      </div>
    </div>
  );
}

// ── SMTP ─────────────────────────────────────────────────────────────────────
function SmtpSettings() {
  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">E-Mail-Einstellungen (SMTP)</h2>
        <p className="form-section__desc">
          Für transaktionale E-Mails (Bestellbestätigungen, Passwort-Reset).
          Empfohlen: Resend, Postmark oder AWS SES.
        </p>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">SMTP-Host</label>
          <input type="text" className="form-input form-input--mono" placeholder="smtp.resend.com" />
        </div>
        <div className="form-field form-field--narrow">
          <label className="form-label">Port</label>
          <input type="number" className="form-input" placeholder="587" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Benutzername</label>
          <input type="text" className="form-input form-input--mono" placeholder="resend" />
        </div>
        <div className="form-field">
          <label className="form-label">Passwort / API-Key</label>
          <input type="password" className="form-input" placeholder="••••••••" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Absender-Name</label>
          <input type="text" className="form-input" defaultValue="ShopRay" />
        </div>
        <div className="form-field">
          <label className="form-label">Absender-E-Mail</label>
          <input type="email" className="form-input" placeholder="noreply@deinshop.de" />
        </div>
      </div>
      <div className="form-section__info">
        Diese Einstellungen entsprechen den Supabase SMTP-Settings (Authentication → SMTP).
        Siehe SETUP.md Schritt 7 für Details.
      </div>
      <div className="form-actions">
        <button className="btn-secondary">Test-Mail senden</button>
        <button className="btn-primary">
          <Save size={14} strokeWidth={2} />
          Speichern
        </button>
      </div>
    </div>
  );
}

// ── Versandkosten ─────────────────────────────────────────────────────────────
function ShippingSettings() {
  const [form, setForm]       = useState<Omit<ShippingSettings, 'updated_at'>>({
    standard: 4.90, express: 9.90, free_above: 50.00, delivery: '2–4 Werktage',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getShippingSettings()
      .then(data => setForm({ standard: data.standard, express: data.express, free_above: data.free_above, delivery: data.delivery }))
      .catch(() => { /* Fallback-Werte bleiben */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateShippingSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const setNum = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value.replace(',', '.'));
    setForm(prev => ({ ...prev, [field]: isNaN(val) ? 0 : val }));
  };

  if (loading) {
    return (
      <div className="form-section">
        <div className="page-loading">
          <Loader2 size={18} strokeWidth={1.5} className="spin" />
          <span>Lade Versandeinstellungen…</span>
        </div>
      </div>
    );
  }

  return (
    <form className="form-section" onSubmit={handleSubmit} noValidate>
      <div className="form-section__head">
        <h2 className="form-section__title">Versandeinstellungen</h2>
        <p className="form-section__desc">
          Änderungen werden sofort im Checkout und auf der Versand-Infoseite übernommen.
        </p>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Standardversand (€)</label>
          <input
            type="number" step="0.01" min="0" className="form-input"
            value={form.standard}
            onChange={setNum('standard')}
            required
          />
          <p className="form-hint">Wird berechnet, wenn kein Gratisversand greift.</p>
        </div>
        <div className="form-field">
          <label className="form-label">Expressversand (€)</label>
          <input
            type="number" step="0.01" min="0" className="form-input"
            value={form.express}
            onChange={setNum('express')}
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Gratisversand ab (€)</label>
        <input
          type="number" step="0.01" min="0" className="form-input"
          value={form.free_above}
          onChange={setNum('free_above')}
          required
        />
        <p className="form-hint">Bei Bestellungen ab diesem Betrag entfallen Versandkosten. 0 = immer kostenlos.</p>
      </div>

      <div className="form-field">
        <label className="form-label">Lieferzeit (Anzeige-Text)</label>
        <input
          type="text" className="form-input"
          value={form.delivery}
          onChange={e => setForm(prev => ({ ...prev, delivery: e.target.value }))}
          placeholder="z. B. 2–4 Werktage"
          required
        />
        <p className="form-hint">Wird auf der Versandseite und im Checkout angezeigt.</p>
      </div>

      {error && <p className="form-error-inline">{error}</p>}

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving
            ? <Loader2 size={14} strokeWidth={2} className="spin" />
            : saved
              ? <CheckCircle2 size={14} strokeWidth={2} />
              : <Save size={14} strokeWidth={2} />
          }
          {saving ? 'Speichert…' : saved ? 'Gespeichert' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}

// ── Sicherheit ────────────────────────────────────────────────────────────────
function SecuritySettings() {
  const [log,     setLog]     = useState<LoginLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getLoginLog()
      .then(setLog)
      .catch(() => setError('Protokoll konnte nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day:    '2-digit', month: '2-digit', year: 'numeric',
      hour:   '2-digit', minute: '2-digit',
    });
  }

  function parseUserAgent(ua: string | null): string {
    if (!ua) return 'Unbekannt';
    if (ua.includes('Chrome') && !ua.includes('Edg'))  return 'Chrome';
    if (ua.includes('Firefox'))  return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg'))      return 'Edge';
    return ua.slice(0, 40);
  }

  return (
    <div className="security-panel">

      {/* Passwort-Info */}
      <div className="form-section">
        <div className="form-section__head">
          <h2 className="form-section__title">Admin-Passwort</h2>
          <p className="form-section__desc">Vor dem Go-Live unbedingt auf ein eigenes Passwort ändern.</p>
        </div>
        <div className="form-section__info">
          Das Admin-Passwort wird als bcrypt-Hash in <code>Backend/.env</code> gespeichert.
          Zum Ändern: <code>ADMIN_PASSWORD=neuesPasswort</code> temporär setzen, Hash generieren,
          <code>ADMIN_PASSWORD_HASH</code> in Vercel aktualisieren und <code>ADMIN_PASSWORD</code> wieder entfernen.
          Siehe SETUP.md für Details.
        </div>
        <div className="form-field">
          <label className="form-label">Aktueller Passwort-Hash (nur lesbar)</label>
          <input type="text" className="form-input form-input--mono" readOnly placeholder="$2b$12$…" />
          <p className="form-hint">Wert aus Backend/.env — ADMIN_PASSWORD_HASH</p>
        </div>
        <div className="form-actions">
          <a
            href="https://github.com/SchubertChris/ShopRay"
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            SETUP.md öffnen
          </a>
        </div>
      </div>

      {/* Login-Protokoll */}
      <div className="form-section">
        <div className="form-section__head">
          <h2 className="form-section__title">
            <ShieldCheck size={15} strokeWidth={2} />
            Login-Protokoll
          </h2>
          <p className="form-section__desc">
            Jeder erfolgreiche Admin-Login wird hier gespeichert und per E-Mail gemeldet.
            Die letzten 50 Einträge werden angezeigt.
          </p>
        </div>

        {loading && (
          <div className="security-log-empty">
            <Monitor size={20} strokeWidth={1.5} />
            <span>Lade Protokoll…</span>
          </div>
        )}

        {error && (
          <div className="security-log-error">
            <AlertTriangle size={16} strokeWidth={2} />
            {error}
          </div>
        )}

        {!loading && !error && log.length === 0 && (
          <div className="security-log-empty">
            <ShieldCheck size={20} strokeWidth={1.5} />
            <span>Noch kein Login protokolliert.</span>
          </div>
        )}

        {!loading && !error && log.length > 0 && (
          <div className="security-log">
            <div className="security-log__head">
              <span>Zeitpunkt</span>
              <span>IP-Adresse</span>
              <span>Browser</span>
              <span>Status</span>
            </div>
            {log.map(entry => (
              <div key={entry.id} className="security-log__row">
                <span className="security-log__date">{formatDate(entry.created_at)}</span>
                <span className="security-log__ip">{entry.ip_address}</span>
                <span className="security-log__ua">{parseUserAgent(entry.user_agent)}</span>
                <span className={`security-log__status security-log__status--${entry.success ? 'ok' : 'fail'}`}>
                  {entry.success ? 'Erfolgreich' : 'Fehlgeschlagen'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
