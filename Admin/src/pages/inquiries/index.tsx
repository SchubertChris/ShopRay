import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Inbox, Eye, CheckCheck,
  AlertCircle, User, AtSign, X,
  RefreshCw, Loader2, Search, Archive,
} from 'lucide-react';
import { getInquiries, updateInquiryStatus, type ContactInquiry } from '../../api/adminApi';
import { useBadgeStore } from '@stores/badgeStore';

type InquiryStatus = ContactInquiry['status'];
type StatusFilter  = InquiryStatus | 'all';
type ViewMode      = 'active' | 'archive';

const ACTIVE_TABS: Array<{
  key:   StatusFilter;
  label: string;
  icon:  React.ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { key: 'all',  label: 'Alle',    icon: Inbox },
  { key: 'new',  label: 'Neu',     icon: Mail  },
  { key: 'read', label: 'Gelesen', icon: Eye   },
];

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new:     'Neu',
  read:    'Gelesen',
  replied: 'Beantwortet',
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch { return iso; }
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  return <span className={`inq-badge inq-badge--${status}`}>{STATUS_LABELS[status]}</span>;
}

export default function InquiriesPage() {
  const [inquiries,    setInquiries]    = useState<ContactInquiry[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [viewMode,     setViewMode]     = useState<ViewMode>('active');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search,       setSearch]       = useState('');
  const [saving,       setSaving]       = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInquiries();
      setInquiries(data.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    useBadgeStore.getState().clear('newInquiries');
    fetchInquiries();
  }, [fetchInquiries]);

  async function handleStatusChange(id: string, newStatus: InquiryStatus) {
    setSaving(true);
    try {
      await updateInquiryStatus(id, newStatus);
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  // Aktive = new + read, Archiv = replied
  const byMode = viewMode === 'active'
    ? inquiries.filter(i => i.status !== 'replied')
    : inquiries.filter(i => i.status === 'replied');

  const byStatus = statusFilter === 'all' ? byMode : byMode.filter(i => i.status === statusFilter);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? byStatus.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q),
      )
    : byStatus;

  const counts = ACTIVE_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? byMode.length : byMode.filter(i => i.status === tab.key).length;
    return acc;
  }, {});

  const archiveCount = inquiries.filter(i => i.status === 'replied').length;
  const activeCount  = inquiries.filter(i => i.status !== 'replied').length;

  const activeInquiry = activeId ? inquiries.find(i => i.id === activeId) ?? null : null;

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    setStatusFilter('all');
    setSearch('');
    setActiveId(null);
  };

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
            className={`filter-bar__tab${viewMode === 'active' ? ' is-active' : ''}`}
            onClick={() => switchView('active')}
          >
            Aktiv
            {activeCount > 0 && <span className="tab-nav__count">{activeCount}</span>}
          </button>
          <button
            className={`filter-bar__tab${viewMode === 'archive' ? ' is-active' : ''}`}
            onClick={() => switchView('archive')}
          >
            <Archive size={13} strokeWidth={2} />
            Archiv
            {archiveCount > 0 && <span className="tab-nav__count">{archiveCount}</span>}
          </button>
          <button className="btn-secondary" onClick={fetchInquiries} disabled={loading} title="Aktualisieren">
            <RefreshCw size={15} strokeWidth={2} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Suche */}
      <div className="filter-bar">
        <div className="filter-bar__search">
          <Search size={14} strokeWidth={2} className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Name, E-Mail oder Betreff suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-bar__input"
          />
        </div>
      </div>

      {/* Status-Tabs */}
      <div className="tab-nav">
        {viewMode === 'active' && ACTIVE_TABS.map(tab => (
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
        {viewMode === 'archive' && (
          <button className="tab-nav__item is-active">
            <CheckCheck size={14} strokeWidth={1.75} />
            Beantwortet
            <span className="tab-nav__count is-active">{archiveCount}</span>
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="inq-state">
          <div className="inq-state__icon"><Loader2 size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Anfragen werden geladen…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="inq-state">
          <div className="inq-state__icon"><AlertCircle size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">{error}</p>
          <button className="inq-state__retry" onClick={fetchInquiries}>Erneut versuchen</button>
        </div>
      )}

      {/* Split View */}
      {!loading && !error && (
        <div className={`inq-split${activeInquiry ? ' has-detail' : ''}`}>
          {/* Liste */}
          <div className="inq-list">
            {filtered.length === 0 ? (
              <div className="inq-empty">
                {search ? 'Keine Treffer für diese Suche.' : 'Keine Anfragen in dieser Kategorie.'}
              </div>
            ) : (
              filtered.map(inq => (
                <button
                  key={inq.id}
                  className={['inq-card', `inq-card--${inq.status}`, activeId === inq.id ? 'is-active' : ''].filter(Boolean).join(' ')}
                  onClick={() => setActiveId(activeId === inq.id ? null : inq.id)}
                >
                  <div className="inq-card__top">
                    {inq.status === 'new' && <span className="unread-dot" />}
                    <StatusBadge status={inq.status} />
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
              <div className="inq-detail__header">
                <div className="inq-detail__meta-row">
                  <p className="inq-detail__id">Anfrage #{activeInquiry.id.slice(0, 8)}</p>
                  <StatusBadge status={activeInquiry.status} />
                </div>
                <p className="inq-detail__subject">{activeInquiry.subject}</p>
                <p className="inq-detail__meta">{formatDateTime(activeInquiry.created_at)}</p>
              </div>

              <div className="inq-detail__contact">
                <p className="inq-detail__section-label">Absender</p>
                <div className="inq-detail__contact-row">
                  <User size={14} strokeWidth={2} className="inq-detail__contact-icon" />
                  <span>{activeInquiry.name}</span>
                </div>
                <div className="inq-detail__contact-row">
                  <AtSign size={14} strokeWidth={2} className="inq-detail__contact-icon" />
                  <a className="inq-detail__email-link" href={`mailto:${activeInquiry.email}`}>
                    {activeInquiry.email}
                  </a>
                </div>
              </div>

              <div className="inq-detail__message">
                <p className="inq-detail__section-label">Nachricht</p>
                <p className="inq-detail__message-text">{activeInquiry.message}</p>
              </div>

              <div className="inq-detail__consent">
                <span className="inq-detail__consent-dot" />
                Datenschutz-Einwilligung: {activeInquiry.consent ? 'erteilt' : 'nicht erteilt'}
              </div>

              <div className="inq-detail__actions">
                <p className="inq-detail__section-label">Status ändern</p>
                <div className="inq-detail__status-row">
                  <select
                    className="form-select"
                    value={activeInquiry.status}
                    disabled={saving}
                    onChange={e => handleStatusChange(activeInquiry.id, e.target.value as InquiryStatus)}
                  >
                    <option value="new">Neu</option>
                    <option value="read">Gelesen</option>
                    <option value="replied">Beantwortet</option>
                  </select>
                  {saving && <span className="inq-detail__saving">Speichern…</span>}
                </div>
                <button className="inq-detail__close" onClick={() => setActiveId(null)}>
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
