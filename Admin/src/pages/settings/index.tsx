import { useState, useEffect } from 'react';
import { Save, Store, Mail, Truck, Lock, Tag, Trash2, Plus, ShieldCheck, Monitor, AlertTriangle, Loader2, CheckCircle2, Smartphone, QrCode, X } from 'lucide-react';
import {
  getLoginLog, getShippingSettings, updateShippingSettings,
  getCategories, createCategory, deleteCategory,
  get2faStatus, get2faSetup, confirm2fa, disable2fa, verify2fa,
  type LoginLogEntry, type ShippingSettings, type Category,
} from '../../api/adminApi';

type SettingsTab = 'shop' | 'smtp' | 'shipping' | 'categories' | 'security';

const TABS: Array<{ key: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { key: 'shop',       label: 'Shop-Infos',    icon: Store  },
  { key: 'smtp',       label: 'E-Mail (SMTP)', icon: Mail   },
  { key: 'shipping',   label: 'Versand',       icon: Truck  },
  { key: 'categories', label: 'Kategorien',    icon: Tag    },
  { key: 'security',   label: 'Sicherheit',    icon: Lock   },
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
          {tab === 'shop'       && <ShopSettings />}
          {tab === 'smtp'       && <SmtpSettings />}
          {tab === 'shipping'   && <ShippingSettings />}
          {tab === 'categories' && <CategoriesSettings />}
          {tab === 'security'   && <SecuritySettings />}
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

// ── 2FA-Verwaltung ────────────────────────────────────────────────────────────
function TwoFactorSettings() {
  type Step = 'idle' | 'setup' | 'disable-confirm';

  const [enabled,    setEnabled]    = useState<boolean | null>(null);
  const [step,       setStep]       = useState<Step>('idle');
  const [qrCode,     setQrCode]     = useState('');
  const [secret,     setSecret]     = useState('');
  const [token,      setToken]      = useState('');
  const [tokenErr,   setTokenErr]   = useState('');
  const [working,    setWorking]    = useState(false);

  useEffect(() => {
    get2faStatus()
      .then(d => setEnabled(d.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const startSetup = async () => {
    setWorking(true);
    try {
      const data = await get2faSetup();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
      setToken('');
      setTokenErr('');
    } finally {
      setWorking(false);
    }
  };

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) { setTokenErr('6-stelligen Code eingeben.'); return; }
    setWorking(true);
    setTokenErr('');
    try {
      await confirm2fa(secret, token);
      setEnabled(true);
      setStep('idle');
      setToken('');
    } catch (err) {
      setTokenErr(err instanceof Error ? err.message : 'Ungültiger Code.');
    } finally {
      setWorking(false);
    }
  };

  const confirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) { setTokenErr('6-stelligen Code eingeben.'); return; }
    setWorking(true);
    setTokenErr('');
    try {
      await verify2fa(token);
      await disable2fa();
      setEnabled(false);
      setStep('idle');
      setToken('');
    } catch (err) {
      setTokenErr(err instanceof Error ? err.message : 'Ungültiger Code.');
    } finally {
      setWorking(false);
    }
  };

  if (enabled === null) {
    return (
      <div className="form-section">
        <div className="page-loading">
          <Loader2 size={18} strokeWidth={1.5} className="spin" />
          <span>Lade 2FA-Status…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">
          <Smartphone size={15} strokeWidth={2} />
          Zwei-Faktor-Authentifizierung (2FA)
        </h2>
        <p className="form-section__desc">
          Mit 2FA wird beim Login zusätzlich ein Einmal-Code aus deiner Authenticator-App verlangt
          (z. B. Google Authenticator, Aegis, Authy).
        </p>
      </div>

      {/* Status-Badge */}
      <div className="two-fa-status">
        <span className={`two-fa-status__badge two-fa-status__badge--${enabled ? 'on' : 'off'}`}>
          {enabled ? 'Aktiviert' : 'Deaktiviert'}
        </span>
        {enabled && step === 'idle' && (
          <button className="btn-danger" onClick={() => { setStep('disable-confirm'); setToken(''); setTokenErr(''); }}>
            <X size={13} strokeWidth={2} />
            2FA deaktivieren
          </button>
        )}
        {!enabled && step === 'idle' && (
          <button className="btn-primary" onClick={startSetup} disabled={working}>
            {working
              ? <Loader2 size={13} strokeWidth={2} className="spin" />
              : <QrCode  size={13} strokeWidth={2} />
            }
            2FA einrichten
          </button>
        )}
      </div>

      {/* Setup-Flow */}
      {step === 'setup' && (
        <div className="two-fa-setup">
          <p className="two-fa-setup__hint">
            <strong>1.</strong> Scanne diesen QR-Code mit deiner Authenticator-App.
          </p>
          {qrCode && <img src={qrCode} alt="2FA QR-Code" className="two-fa-setup__qr" />}
          <p className="two-fa-setup__hint">
            <strong>2.</strong> Gib anschließend den 6-stelligen Code ein, um die Einrichtung abzuschließen.
          </p>
          <form className="two-fa-setup__form" onSubmit={confirmSetup} noValidate>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={e => { setToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setTokenErr(''); }}
              className="form-input two-fa-setup__code-input"
              autoFocus
            />
            {tokenErr && <p className="form-error-inline">{tokenErr}</p>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep('idle')}>Abbrechen</button>
              <button type="submit" className="btn-primary" disabled={working || token.length !== 6}>
                {working ? <Loader2 size={13} strokeWidth={2} className="spin" /> : <CheckCircle2 size={13} strokeWidth={2} />}
                {working ? 'Wird gespeichert…' : 'Bestätigen & aktivieren'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deaktivierungs-Flow */}
      {step === 'disable-confirm' && (
        <div className="two-fa-setup">
          <p className="two-fa-setup__hint">
            Gib deinen aktuellen Authenticator-Code ein, um 2FA zu deaktivieren.
          </p>
          <form className="two-fa-setup__form" onSubmit={confirmDisable} noValidate>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={e => { setToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setTokenErr(''); }}
              className="form-input two-fa-setup__code-input"
              autoFocus
            />
            {tokenErr && <p className="form-error-inline">{tokenErr}</p>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep('idle')}>Abbrechen</button>
              <button type="submit" className="btn-danger" disabled={working || token.length !== 6}>
                {working ? <Loader2 size={13} strokeWidth={2} className="spin" /> : <X size={13} strokeWidth={2} />}
                {working ? 'Wird deaktiviert…' : '2FA deaktivieren'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
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

      {/* 2FA */}
      <TwoFactorSettings />

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

// ── Kategorien ────────────────────────────────────────────────────────────────
function CategoriesSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [newName,    setNewName]    = useState('');
  const [adding,     setAdding]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setError('Kategorien konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const cat = await createCategory(newName.trim());
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name, 'de')));
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hinzufügen fehlgeschlagen.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">Kategorien</h2>
        <p className="form-section__desc">
          Hier verwaltete Kategorien erscheinen im Produkt-Formular und im Shop-Filter.
          Hinweis: Vor der ersten Nutzung <code>migration_004_categories.sql</code> in Supabase ausführen.
        </p>
      </div>

      {error && <p className="form-error-inline">{error}</p>}

      <form className="category-add-form" onSubmit={handleAdd} noValidate>
        <input
          type="text"
          className="form-input"
          placeholder="Neue Kategorie…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={100}
        />
        <button className="btn-primary" type="submit" disabled={adding || !newName.trim()}>
          {adding
            ? <Loader2 size={14} strokeWidth={2} className="spin" />
            : <Plus    size={14} strokeWidth={2} />
          }
          Hinzufügen
        </button>
      </form>

      {loading && (
        <div className="page-loading">
          <Loader2 size={18} strokeWidth={1.5} className="spin" />
          <span>Lade Kategorien…</span>
        </div>
      )}

      {!loading && categories.length === 0 && !error && (
        <p className="form-hint" style={{ marginTop: '1rem' }}>
          Noch keine Kategorien angelegt.
        </p>
      )}

      {!loading && categories.length > 0 && (
        <ul className="category-list">
          {categories.map(cat => (
            <li key={cat.id} className="category-list__item">
              <Tag size={13} strokeWidth={2} className="category-list__icon" />
              <span className="category-list__name">{cat.name}</span>
              <button
                className="category-list__delete"
                onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
                title={`"${cat.name}" löschen`}
              >
                {deletingId === cat.id
                  ? <Loader2 size={13} strokeWidth={2} className="spin" />
                  : <Trash2  size={13} strokeWidth={2} />
                }
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
