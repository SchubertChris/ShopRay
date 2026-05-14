import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Inbox,
  Eye,
  CheckCheck,
  AlertCircle,
  Key,
  User,
  AtSign,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type InquiryStatus = 'new' | 'read' | 'replied';

interface Inquiry {
  id:         string;
  name:       string;
  email:      string;
  subject:    string;
  message:    string;
  consent:    boolean;
  status:     InquiryStatus;
  created_at: string;
}

type StatusFilter = InquiryStatus | 'all';

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_KEY = 'sr-admin-key';
const API_BASE = import.meta.env.VITE_API_URL ?? '';

const STATUS_TABS: Array<{
  key:   StatusFilter;
  label: string;
  icon:  React.ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { key: 'all',     label: 'Alle',        icon: Inbox      },
  { key: 'new',     label: 'Neu',         icon: Mail       },
  { key: 'read',    label: 'Gelesen',     icon: Eye        },
  { key: 'replied', label: 'Beantwortet', icon: CheckCheck },
];

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new:     'Neu',
  read:    'Gelesen',
  replied: 'Beantwortet',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── Admin-Key Setup ──────────────────────────────────────────────────────────

interface AdminKeySetupProps {
  onSave: (key: string) => void;
}

function AdminKeySetup({ onSave }: AdminKeySetupProps) {
  const [draft, setDraft] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    localStorage.setItem(LS_KEY, trimmed);
    onSave(trimmed);
  }

  return (
    <div className="inq-key-overlay">
      <div className="inq-key-overlay__card">
        <div className="inq-key-overlay__icon">
          <Key size={20} strokeWidth={2} />
        </div>
        <p className="inq-key-overlay__title">Admin-Key einrichten</p>
        <p className="inq-key-overlay__desc">
          Damit Kontaktanfragen geladen werden können, wird der{' '}
          <code>ADMIN_API_KEY</code> benötigt. Er wird nur in deinem Browser
          gespeichert und niemals übertragen.
        </p>
        <form onSubmit={handleSubmit} className="inq-key-overlay__row">
          <input
            className="inq-key-overlay__input"
            type="password"
            autoComplete="off"
            placeholder="sk-admin-…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={!draft.trim()}>
            Speichern
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`inq-badge inq-badge--${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function InquiriesPage() {
  const [adminKey, setAdminKey]       = useState<string>(() => localStorage.getItem(LS_KEY) ?? '');
  const [inquiries, setInquiries]     = useState<Inquiry[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [saving, setSaving]           = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchInquiries = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        headers: { 'x-admin-key': key },
      });
      if (res.status === 401 || res.status === 403) {
        setError('Ungültiger Admin-Key. Bitte überprüfe deinen Schlüssel.');
        return;
      }
      if (!res.ok) {
        setError(`Fehler beim Laden (${res.status}).`);
        return;
      }
      const data: Inquiry[] = await res.json();
      // Neueste zuerst
      setInquiries(data.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch {
      setError('Verbindung fehlgeschlagen. Ist das Backend erreichbar?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) fetchInquiries(adminKey);
  }, [adminKey, fetchInquiries]);

  // ── Status-Update ──────────────────────────────────────────────────────────
  async function updateStatus(id: string, newStatus: InquiryStatus) {
    if (!adminKey) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact/${id}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key':  adminKey,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      setInquiries(prev =>
        prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq)
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Key Reset ──────────────────────────────────────────────────────────────
  function resetKey() {
    localStorage.removeItem(LS_KEY);
    setAdminKey('');
    setInquiries([]);
    setError(null);
    setActiveId(null);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = inquiries.filter(inq =>
    statusFilter === 'all' || inq.status === statusFilter
  );

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? inquiries.length
      : inquiries.filter(i => i.status === tab.key).length;
    return acc;
  }, {});

  const activeInquiry = activeId
    ? inquiries.find(i => i.id === activeId) ?? null
    : null;

  // ── Admin-Key noch nicht gesetzt ───────────────────────────────────────────
  if (!adminKey) {
    return <AdminKeySetup onSave={key => setAdminKey(key)} />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Kontakt</span>
          <h1 className="page-header__title">Anfragen</h1>
          <p className="page-header__sub">
            {counts['new'] > 0
              ? `${counts['new']} neue ${counts['new'] === 1 ? 'Anfrage' : 'Anfragen'}`
              : `${inquiries.length} ${inquiries.length === 1 ? 'Anfrage' : 'Anfragen'} insgesamt`}
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn-secondary"
            onClick={() => fetchInquiries(adminKey)}
            disabled={loading}
            title="Aktualisieren"
          >
            <RefreshCw size={15} strokeWidth={2} />
            Aktualisieren
          </button>
          <button
            className="btn-secondary"
            onClick={resetKey}
            title="Admin-Key zurücksetzen"
          >
            <Key size={15} strokeWidth={2} />
            Key ändern
          </button>
        </div>
      </div>

      {/* Status-Tabs */}
      <div className="tab-nav">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-nav__item${statusFilter === tab.key ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter(tab.key); setActiveId(null); }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`tab-nav__count${statusFilter === tab.key ? ' is-active' : ''}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="inq-state">
          <div className="inq-state__icon">
            <Loader2 size={32} strokeWidth={1.5} />
          </div>
          <p className="inq-state__text">Anfragen werden geladen…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="inq-state">
          <div className="inq-state__icon">
            <AlertCircle size={32} strokeWidth={1.5} />
          </div>
          <p className="inq-state__text">{error}</p>
          <button
            className="inq-state__retry"
            onClick={() => fetchInquiries(adminKey)}
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Split View */}
      {!loading && !error && (
        <div className={`inq-split${activeInquiry ? ' has-detail' : ''}`}>

          {/* Liste */}
          <div className="inq-list">
            {filtered.length === 0 ? (
              <div className="inq-empty">
                Keine Anfragen in dieser Kategorie.
              </div>
            ) : (
              filtered.map(inq => (
                <button
                  key={inq.id}
                  className={[
                    'inq-card',
                    `inq-card--${inq.status}`,
                    activeId === inq.id ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setActiveId(activeId === inq.id ? null : inq.id)}
                >
                  <div className="inq-card__top">
                    <div className="inq-card__left">
                      <StatusBadge status={inq.status} />
                    </div>
                    <span className="inq-card__date">{formatDate(inq.created_at)}</span>
                  </div>
                  <p className="inq-card__subject">{inq.subject}</p>
                  <p className="inq-card__sender">{inq.name} · {inq.email}</p>
                </button>
              ))
            )}
          </div>

          {/* Detail-Panel */}
          {activeInquiry && (
            <div className="inq-detail">
              {/* Header */}
              <div className="inq-detail__header">
                <div className="inq-detail__meta-row">
                  <p className="inq-detail__id">Anfrage #{activeInquiry.id}</p>
                  <StatusBadge status={activeInquiry.status} />
                </div>
                <p className="inq-detail__subject">{activeInquiry.subject}</p>
                <p className="inq-detail__meta">
                  {formatDateTime(activeInquiry.created_at)}
                </p>
              </div>

              {/* Kontakt-Infos */}
              <div className="inq-detail__contact">
                <p className="inq-detail__section-label">Absender</p>
                <div className="inq-detail__contact-row">
                  <User size={14} strokeWidth={2} className="inq-detail__contact-icon" />
                  <span>{activeInquiry.name}</span>
                </div>
                <div className="inq-detail__contact-row">
                  <AtSign size={14} strokeWidth={2} className="inq-detail__contact-icon" />
                  <a
                    className="inq-detail__email-link"
                    href={`mailto:${activeInquiry.email}`}
                  >
                    {activeInquiry.email}
                  </a>
                </div>
              </div>

              {/* Nachricht */}
              <div className="inq-detail__message">
                <p className="inq-detail__section-label">Nachricht</p>
                <p className="inq-detail__message-text">{activeInquiry.message}</p>
              </div>

              {/* Einwilligung */}
              <div className="inq-detail__consent">
                <span className="inq-detail__consent-dot" />
                Datenschutz-Einwilligung:{' '}
                {activeInquiry.consent ? 'erteilt' : 'nicht erteilt'}
              </div>

              {/* Status-Aktion */}
              <div className="inq-detail__actions">
                <p className="inq-detail__section-label">Status ändern</p>
                <div className="inq-detail__status-row">
                  <select
                    className="form-select"
                    value={activeInquiry.status}
                    disabled={saving}
                    onChange={e =>
                      updateStatus(activeInquiry.id, e.target.value as InquiryStatus)
                    }
                  >
                    <option value="new">Neu</option>
                    <option value="read">Gelesen</option>
                    <option value="replied">Beantwortet</option>
                  </select>
                  {saving && (
                    <span className="inq-detail__saving">Speichern…</span>
                  )}
                </div>
                <button
                  className="inq-detail__close"
                  onClick={() => setActiveId(null)}
                >
                  <X size={14} strokeWidth={2} />
                  Panel schließen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
