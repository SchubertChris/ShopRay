import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { getRefundRequests, approveRefundRequest, rejectRefundRequest, type RefundRequest } from '../../api/adminApi';
import { useAuthStore } from '../../stores/authStore';
import ConfirmDialog   from '../../components/ui/ConfirmDialog';
import { ROUTES }      from '@config/routes';

const ROLE_LABEL: Record<string, string> = {
  owner:     'Inhaber',
  team_lead: 'Teamleiter',
  mod:       'Mitarbeiter',
};

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RefundRequestsPage() {
  const role = useAuthStore(s => s.role);

  const [requests, setRequests]     = useState<RefundRequest[]>([]);
  const [loading,  setLoading]      = useState(true);
  const [filter,   setFilter]       = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [error,    setError]        = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<RefundRequest | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<RefundRequest | null>(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [acting,        setActing]        = useState(false);
  const [actionError,   setActionError]   = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getRefundRequests(filter === 'all' ? undefined : filter)
      .then(r => setRequests(r.data))
      .catch(() => setError('Anträge konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const canApprove = (req: RefundRequest) => {
    if (role === 'owner') return true;
    if (role === 'team_lead' && req.amount < 2000) return true;
    return false;
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActing(true);
    setActionError(null);
    try {
      await approveRefundRequest(approveTarget.id);
      setApproveTarget(null);
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Fehler beim Genehmigen.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActing(true);
    setActionError(null);
    try {
      await rejectRefundRequest(rejectTarget.id, rejectReason || undefined);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Fehler beim Ablehnen.');
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Finanzen</span>
          <h1 className="page-header__title">Erstattungsanträge</h1>
          <p className="page-header__sub">Vier-Augen-Freigabe für Rückerstattungen</p>
        </div>
        <div className="page-header__actions">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              className={`btn-secondary${filter === f ? ' btn-secondary--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {{ pending: 'Offen', approved: 'Genehmigt', rejected: 'Abgelehnt', all: 'Alle' }[f]}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="page-loading">
          <Loader2 size={20} strokeWidth={1.5} className="spin" />
          <span>Lade Anträge…</span>
        </div>
      )}

      {error && (
        <div className="page-error">
          <AlertTriangle size={18} strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="empty-state">
          <RotateCcw size={32} strokeWidth={1} />
          <p>Keine {filter === 'all' ? '' : { pending: 'offenen', approved: 'genehmigten', rejected: 'abgelehnten' }[filter]} Anträge.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bestellung</th>
                <th>Betrag</th>
                <th>Beantragt von</th>
                <th>Eingereicht</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>
                    <Link to={ROUTES.ORDERS.detail(req.order_id)} className="admin-table__link">
                      {req.order_number}
                    </Link>
                  </td>
                  <td><strong>€ {fmt(req.amount)}</strong></td>
                  <td>
                    <span className="admin-table__muted">{ROLE_LABEL[req.requested_by_role] ?? req.requested_by_role}</span>
                  </td>
                  <td className="admin-table__muted">{fmtDate(req.created_at)}</td>
                  <td>
                    {req.status === 'pending'  && <span className="status-badge status-badge--pending"><Clock size={11} /> Offen</span>}
                    {req.status === 'approved' && <span className="status-badge status-badge--paid"><CheckCircle size={11} /> Genehmigt</span>}
                    {req.status === 'rejected' && <span className="status-badge status-badge--cancelled"><XCircle size={11} /> Abgelehnt</span>}
                  </td>
                  <td>
                    {req.status === 'pending' && (
                      <div className="table-actions">
                        {canApprove(req) && (
                          <button className="btn-primary btn--sm" onClick={() => { setApproveTarget(req); setActionError(null); }}>
                            <CheckCircle size={13} strokeWidth={2} /> Genehmigen
                          </button>
                        )}
                        <button className="btn-danger btn--sm" onClick={() => { setRejectTarget(req); setActionError(null); setRejectReason(''); }}>
                          <XCircle size={13} strokeWidth={2} /> Ablehnen
                        </button>
                      </div>
                    )}
                    {req.status === 'rejected' && req.rejected_reason && (
                      <span className="admin-table__muted" title={req.rejected_reason}>
                        {req.rejected_reason.slice(0, 40)}{req.rejected_reason.length > 40 ? '…' : ''}
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="admin-table__muted">
                        {ROLE_LABEL[req.approved_by_role ?? ''] ?? req.approved_by_role} · {req.approved_at ? fmtDate(req.approved_at) : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Genehmigen-Dialog */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Erstattung genehmigen?"
        description={approveTarget
          ? `Bestellung ${approveTarget.order_number} — € ${fmt(approveTarget.amount)} wird über Stripe erstattet. Der Betrag erscheint in 5–10 Werktagen beim Kunden.${actionError ? ` — Fehler: ${actionError}` : ''}`
          : ''}
        confirmLabel={acting ? 'Wird erstattet…' : 'Jetzt genehmigen'}
        cancelLabel="Abbrechen"
        variant="danger"
        loading={acting}
        onConfirm={handleApprove}
        onCancel={() => { setApproveTarget(null); setActionError(null); }}
      />

      {/* Ablehnen-Dialog */}
      <ConfirmDialog
        isOpen={!!rejectTarget}
        title="Antrag ablehnen?"
        description={rejectTarget
          ? `Erstattungsantrag für Bestellung ${rejectTarget.order_number} (€ ${fmt(rejectTarget.amount)}) wird abgelehnt.${actionError ? ` — Fehler: ${actionError}` : ''}`
          : ''}
        confirmLabel={acting ? 'Wird abgelehnt…' : 'Ablehnen'}
        cancelLabel="Abbrechen"
        variant="danger"
        loading={acting}
        onConfirm={handleReject}
        onCancel={() => { setRejectTarget(null); setRejectReason(''); setActionError(null); }}
      >
        <div className="confirm-dialog__extra">
          <label className="form-label">Grund (optional)</label>
          <input
            className="form-input"
            placeholder="z.B. Betrag nicht korrekt, bitte neu einreichen"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
