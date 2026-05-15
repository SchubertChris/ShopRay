import { useState } from 'react';
import { Save, Store, Mail, Truck, Lock } from 'lucide-react';

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
        <div className="form-field" style={{ maxWidth: 120 }}>
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
  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">Versandeinstellungen</h2>
        <p className="form-section__desc">Versandkosten werden im Checkout angezeigt.</p>
      </div>
      <div className="form-field">
        <label className="form-label">Standardversand (€)</label>
        <input type="text" className="form-input" defaultValue="4,90" />
        <p className="form-hint">Wird für alle Bestellungen berechnet, außer Express oder Gratisversand greift.</p>
      </div>
      <div className="form-field">
        <label className="form-label">Expressversand (€)</label>
        <input type="text" className="form-input" defaultValue="9,90" />
      </div>
      <div className="form-field">
        <label className="form-label">Gratisversand ab (€)</label>
        <input type="text" className="form-input" defaultValue="50,00" />
        <p className="form-hint">Bei Bestellungen ab diesem Betrag entfallen Versandkosten. 0 = deaktiviert.</p>
      </div>
      <div className="form-field">
        <label className="form-label">Lieferzeit (Anzeige-Text)</label>
        <input type="text" className="form-input" defaultValue="2–4 Werktage" />
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

// ── Sicherheit ────────────────────────────────────────────────────────────────
function SecuritySettings() {
  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">Sicherheit</h2>
        <p className="form-section__desc">Admin-Zugangsdaten ändern. Vor dem Go-Live unbedingt aktualisieren!</p>
      </div>
      <div className="form-section__info">
        Das Admin-Passwort wird als bcrypt-Hash in der <code>Backend/.env</code> gespeichert.
        Zum Ändern: <code>ADMIN_PASSWORD=neuesPasswort</code> temporär eintragen, Migrate-Script ausführen,
        den neuen <code>ADMIN_PASSWORD_HASH</code> übernehmen und <code>ADMIN_PASSWORD</code> wieder entfernen.
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
  );
}
