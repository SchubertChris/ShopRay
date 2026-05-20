import { useRef, useEffect } from 'react';
import { useNavigate }       from 'react-router-dom';
import {
  ShoppingCart, MessageSquare, Mail, AlertTriangle,
  CheckSquare, TrendingDown, BellOff, CheckCheck,
} from 'lucide-react';
import { type AdminNotification } from '../../api/adminApi';

interface Props {
  items:      AdminNotification[];
  unread:     number;
  onMarkRead: (id: string) => void;
  onMarkAll:  () => void;
  onClose:    () => void;
}

const TYPE_ICON: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  new_order:      ShoppingCart,
  new_ticket:     MessageSquare,
  new_inquiry:    Mail,
  payment_failed: AlertTriangle,
  task_assigned:  CheckSquare,
  low_stock:      TrendingDown,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} Tagen`;
}

export function NotificationDropdown({ items, unread, onMarkRead, onMarkAll, onClose }: Props) {
  const ref      = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function handleItemClick(n: AdminNotification) {
    if (!n.read) onMarkRead(n.id);
    if (n.link) { navigate(n.link); onClose(); }
  }

  function renderIcon(type: string) {
    const C = TYPE_ICON[type] ?? BellOff;
    return <C size={14} strokeWidth={1.75} />;
  }

  return (
    <div className="notif-dropdown" ref={ref}>
      <div className="notif-dropdown__head">
        <span className="notif-dropdown__title">
          Benachrichtigungen
          {unread > 0 && <span className="notif-dropdown__count">{unread}</span>}
        </span>
        {unread > 0 && (
          <button className="notif-dropdown__mark-all" onClick={onMarkAll}>
            <CheckCheck size={13} strokeWidth={2} />
            Alle gelesen
          </button>
        )}
      </div>

      <div className="notif-dropdown__list">
        {items.length === 0 ? (
          <div className="notif-dropdown__empty">
            <BellOff size={20} strokeWidth={1.5} />
            <span>Keine Benachrichtigungen</span>
          </div>
        ) : (
          items.map(n => (
            <button
              key={n.id}
              className={`notif-dropdown__item${n.read ? '' : ' notif-dropdown__item--unread'}`}
              onClick={() => handleItemClick(n)}
            >
              <span className={`notif-dropdown__icon notif-dropdown__icon--${n.type}`}>
                {renderIcon(n.type)}
              </span>
              <span className="notif-dropdown__content">
                <span className="notif-dropdown__item-title">{n.title}</span>
                {n.body && <span className="notif-dropdown__item-body">{n.body}</span>}
                <span className="notif-dropdown__item-time">{timeAgo(n.created_at)}</span>
              </span>
              {!n.read && <span className="notif-dropdown__dot" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
