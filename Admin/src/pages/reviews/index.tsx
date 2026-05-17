import { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle, XCircle, Trash2,
  RefreshCw, Loader2, AlertCircle, MessageSquare,
} from 'lucide-react';
import {
  getAdminReviews, verifyReview, rejectReview, deleteAdminReview,
  type AdminReview,
} from '../../api/adminApi';
import ViewToggle from '../../components/ui/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

type VerifiedFilter = 'all' | 'pending' | 'verified';

const TABS: Array<{ key: VerifiedFilter; label: string }> = [
  { key: 'all',      label: 'Alle'         },
  { key: 'pending',  label: 'Ausstehend'   },
  { key: 'verified', label: 'Freigegeben'  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="rev-stars" aria-label={`${rating} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.5}
          className={n <= rating ? 'rev-stars__filled' : 'rev-stars__empty'}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch { return iso; }
}

export default function ReviewsPage() {
  const [reviews,  setReviews]  = useState<AdminReview[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<VerifiedFilter>('all');
  const [busy,     setBusy]     = useState<string | null>(null);
  const [viewMode, toggleViewMode] = useViewMode('admin-reviews-view');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const verifiedParam = filter === 'verified' ? true : filter === 'pending' ? false : undefined;
      const res = await getAdminReviews(1, 100, verifiedParam);
      setReviews(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleVerify(id: string) {
    setBusy(id);
    try {
      await verifyReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r));
    } finally { setBusy(null); }
  }

  async function handleReject(id: string) {
    setBusy(id);
    try {
      await rejectReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, verified: false } : r));
    } finally { setBusy(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bewertung wirklich löschen?')) return;
    setBusy(id);
    try {
      await deleteAdminReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } finally { setBusy(null); }
  }

  const counts = {
    all:      reviews.length,
    pending:  reviews.filter(r => !r.verified).length,
    verified: reviews.filter(r =>  r.verified).length,
  };

  const filtered = filter === 'verified'
    ? reviews.filter(r =>  r.verified)
    : filter === 'pending'
    ? reviews.filter(r => !r.verified)
    : reviews;

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Bewertungen</h1>
          <p className="page-header__sub">
            {counts.pending > 0
              ? `${counts.pending} ausstehend · ${counts.verified} freigegeben`
              : `${counts.all} Bewertungen insgesamt`}
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn-secondary" onClick={fetchReviews} disabled={loading} title="Aktualisieren">
            <RefreshCw size={15} strokeWidth={2} />
            Aktualisieren
          </button>
          <ViewToggle mode={viewMode} onToggle={toggleViewMode} />
        </div>
      </div>

      <div className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-nav__item${filter === tab.key ? ' is-active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`tab-nav__count${filter === tab.key ? ' is-active' : ''}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="inq-state">
          <div className="inq-state__icon"><Loader2 size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Bewertungen werden geladen…</p>
        </div>
      )}

      {!loading && error && (
        <div className="inq-state">
          <div className="inq-state__icon"><AlertCircle size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">{error}</p>
          <button className="inq-state__retry" onClick={fetchReviews}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="inq-state">
          <div className="inq-state__icon"><MessageSquare size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Keine Bewertungen in dieser Kategorie.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && viewMode === 'grid' && (
        <div className="admin-grid admin-grid--wide">
          {filtered.map(review => (
            <div key={review.id} className={`admin-card${review.verified ? '' : ''}`}>
              <div className="admin-card__body">
                <p className="admin-card__name">{review.title ?? '(Kein Titel)'}</p>
                <p className="admin-card__meta">{review.products?.name ?? review.product_id.slice(0, 8)}</p>
                <div className="admin-card__status-row">
                  <StarRow rating={review.rating} />
                  <span className={`rev-badge${review.verified ? ' rev-badge--verified' : ' rev-badge--pending'}`}>
                    {review.verified ? 'Freigegeben' : 'Ausstehend'}
                  </span>
                </div>
                {review.body && (
                  <p className="admin-card__meta admin-card__preview">
                    {review.body}
                  </p>
                )}
              </div>
              <div className="admin-card__footer">
                <span className="admin-card__meta">{formatDate(review.created_at)}</span>
                <div className="admin-card__actions">
                  {!review.verified && (
                    <button
                      className="table-action"
                      title="Freischalten"
                      onClick={() => handleVerify(review.id)}
                      disabled={busy === review.id}
                    >
                      <CheckCircle size={13} strokeWidth={2} />
                    </button>
                  )}
                  {review.verified && (
                    <button
                      className="table-action table-action--warning"
                      title="Ablehnen"
                      onClick={() => handleReject(review.id)}
                      disabled={busy === review.id}
                    >
                      <XCircle size={13} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    className="table-action table-action--danger"
                    title="Löschen"
                    onClick={() => handleDelete(review.id)}
                    disabled={busy === review.id}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && viewMode === 'table' && (
        <div className="rev-list">
          {filtered.map(review => (
            <div key={review.id} className={`rev-card${review.verified ? ' rev-card--verified' : ' rev-card--pending'}`}>
              <div className="rev-card__header">
                <div className="rev-card__meta">
                  <StarRow rating={review.rating} />
                  <span className="rev-card__product">{review.products?.name ?? '—'}</span>
                  <span className="rev-card__date">{formatDate(review.created_at)}</span>
                </div>
                <span className={`rev-badge${review.verified ? ' rev-badge--verified' : ' rev-badge--pending'}`}>
                  {review.verified ? 'Freigegeben' : 'Ausstehend'}
                </span>
              </div>

              <div className="rev-card__author">
                {review.profiles?.name ?? 'Anonym'} · {review.profiles?.email ?? '—'}
              </div>

              {review.title && <p className="rev-card__title">{review.title}</p>}
              {review.body  && <p className="rev-card__body">{review.body}</p>}

              <div className="rev-card__actions">
                {!review.verified && (
                  <button
                    className="btn-icon btn-icon--success"
                    onClick={() => handleVerify(review.id)}
                    disabled={busy === review.id}
                    title="Freischalten"
                  >
                    <CheckCircle size={15} strokeWidth={2} />
                    Freischalten
                  </button>
                )}
                {review.verified && (
                  <button
                    className="btn-icon btn-icon--warning"
                    onClick={() => handleReject(review.id)}
                    disabled={busy === review.id}
                    title="Ablehnen"
                  >
                    <XCircle size={15} strokeWidth={2} />
                    Ablehnen
                  </button>
                )}
                <button
                  className="btn-icon btn-icon--danger"
                  onClick={() => handleDelete(review.id)}
                  disabled={busy === review.id}
                  title="Löschen"
                >
                  <Trash2 size={15} strokeWidth={2} />
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
