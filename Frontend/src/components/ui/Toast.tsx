import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertCircle, AlertTriangle, Info, Heart, X, ArrowRight } from 'lucide-react';
import { useNotifications } from '@features/notifications';
import type { NotificationItem } from '@features/notifications';

// ─── Icon map by type ────────────────────────────────────────────────────────

const ICONS = {
  success: Check,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
  wishlist: Heart,
} as const;

// ─── Single toast item ───────────────────────────────────────────────────────

interface ToastItemProps {
  item:      NotificationItem;
  onDismiss: (id: string) => void;
}

function ToastItem({ item, onDismiss }: ToastItemProps) {
  const [leaving, setLeaving]         = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(item.id), 320);
  }, [item.id, onDismiss]);

  useEffect(() => {
    setLeaving(false);
    setProgressKey(k => k + 1);
    const t = setTimeout(dismiss, item.duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.duration]);

  const Icon          = ICONS[item.type];
  const isWishlist    = item.type === 'wishlist';
  const durationStyle = { '--toast-duration': `${item.duration}ms` } as React.CSSProperties;

  if (isWishlist) {
    return (
      <div
        className={`toast toast--wishlist${leaving ? ' is-leaving' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="toast__pill-icon" aria-hidden="true">
          <Heart size={14} strokeWidth={2} fill="currentColor" />
        </span>
        <span className="toast__pill-msg">{item.title}</span>
        <button className="toast__close toast__close--pill" onClick={dismiss} aria-label="Schließen">
          <X size={12} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`toast toast--${item.type}${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast__body">
        <span className="toast__icon" aria-hidden="true">
          <Icon
            size={15}
            strokeWidth={2.5}
            fill={item.type === 'wishlist' ? 'currentColor' : 'none'}
          />
        </span>
        <div className="toast__content">
          <p className="toast__title">{item.title}</p>
          {item.message && <p className="toast__message">{item.message}</p>}
          {item.action && (
            <Link to={item.action.href} className="toast__action" onClick={dismiss}>
              {item.action.label} <ArrowRight size={11} strokeWidth={2} />
            </Link>
          )}
        </div>
        <button className="toast__close" onClick={dismiss} aria-label="Schließen">
          <X size={14} strokeWidth={2} />
        </button>
      </div>
      <div className="toast__progress" aria-hidden="true" style={durationStyle}>
        <div key={progressKey} className="toast__progress-bar" />
      </div>
    </div>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────

export function Toast() {
  const items   = useNotifications(s => s.items);
  const dismiss = useNotifications(s => s.dismiss);

  if (items.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Benachrichtigungen">
      {items.map(item => (
        <ToastItem key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
