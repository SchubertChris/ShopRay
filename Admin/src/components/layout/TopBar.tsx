import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

interface TopBarProps {
  onMenuClick: () => void;
  title:       string;
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const { mode, toggleMode } = useTheme();

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
        <button className="admin-topbar__btn" onClick={toggleMode} title="Theme wechseln">
          {mode === 'light'
            ? <Moon size={18} strokeWidth={1.75} />
            : <Sun  size={18} strokeWidth={1.75} />
          }
        </button>

        <div className="admin-topbar__divider" />

        <button className="admin-topbar__btn" title="Benachrichtigungen">
          <Bell size={18} strokeWidth={1.75} />
          <span className="admin-topbar__notif-dot" />
        </button>
      </div>
    </header>
  );
}
