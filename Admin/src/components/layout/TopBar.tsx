import { useState }            from 'react';
import { Menu, Bell, Sun, Moon, RefreshCw } from 'lucide-react';
import { useTheme }             from '../../providers/ThemeProvider';
import { useNotifications }     from '../../hooks/useNotifications';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface TopBarProps {
  onMenuClick: () => void;
  title:       string;
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const { mode, toggleMode }                     = useTheme();
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button className="admin-topbar__menu-btn" onClick={onMenuClick} aria-label="Menü öffnen">
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <p className="admin-topbar__breadcrumb">
          ShopRay &nbsp;/&nbsp; <strong>{title}</strong>
        </p>
      </div>

      <div className="admin-topbar__right">
        <button className="admin-topbar__btn" onClick={() => window.location.reload()} title="Seite neu laden">
          <RefreshCw size={18} strokeWidth={1.75} />
        </button>

        <button className="admin-topbar__btn" onClick={toggleMode} title="Theme wechseln">
          {mode === 'light'
            ? <Moon size={18} strokeWidth={1.75} />
            : <Sun  size={18} strokeWidth={1.75} />
          }
        </button>

        <div className="admin-topbar__divider" />

        <div className="admin-topbar__notif-wrap">
          <button
            className={`admin-topbar__btn${open ? ' is-active' : ''}`}
            title="Benachrichtigungen"
            onClick={() => setOpen(v => !v)}
          >
            <Bell size={18} strokeWidth={1.75} />
            {unread > 0 && (
              <span className="admin-topbar__notif-badge">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {open && (
            <NotificationDropdown
              items={items}
              unread={unread}
              onMarkRead={markRead}
              onMarkAll={markAllRead}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
