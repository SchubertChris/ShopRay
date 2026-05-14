import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  MessageSquare, Settings, LogOut, ChevronRight, Mail,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { ROUTES } from '@config/routes';

interface SidebarProps {
  isOpen:   boolean;
  onClose:  () => void;
}

interface NavItem {
  to:     string;
  icon:   React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label:  string;
  badge?: number;
}

interface NavGroup {
  section: string;
  items:   NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: 'Übersicht',
    items: [
      { to: ROUTES.DASHBOARD,        icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    section: 'Shop',
    items: [
      { to: ROUTES.PRODUCTS.LIST,    icon: Package,         label: 'Produkte'      },
      { to: ROUTES.ORDERS.LIST,      icon: ShoppingCart,    label: 'Bestellungen', badge: 3 },
      { to: ROUTES.CUSTOMERS.LIST,   icon: Users,           label: 'Kunden'        },
    ],
  },
  {
    section: 'Support',
    items: [
      { to: ROUTES.SUPPORT.TICKETS,  icon: MessageSquare,   label: 'Tickets',      badge: 5 },
      { to: ROUTES.INQUIRIES,        icon: Mail,            label: 'Anfragen'                },
    ],
  },
  {
    section: 'System',
    items: [
      { to: ROUTES.SETTINGS,         icon: Settings,        label: 'Einstellungen' },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'A';

  const handleLogout = () => {
    logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <>
      <div
        className={`admin-sidebar-overlay${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
      />
      <aside className={`admin-sidebar${isOpen ? ' is-open' : ''}`}>
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <div className="admin-sidebar__logo-mark">S</div>
          <span className="admin-sidebar__logo-name">ShopRay</span>
          <span className="admin-sidebar__logo-badge">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar__nav">
          {NAV.map(group => (
            <div key={group.section} className="admin-sidebar__section">
              <p className="admin-sidebar__section-label">{group.section}</p>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === ROUTES.DASHBOARD}
                  className={({ isActive }) =>
                    `admin-sidebar__link${isActive ? ' is-active' : ''}`
                  }
                  onClick={onClose}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="admin-sidebar__badge">{item.badge}</span>
                  )}
                  <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__avatar">{initials}</div>
          <div className="admin-sidebar__user-info">
            <p className="admin-sidebar__user-name">{user?.name ?? 'Admin'}</p>
            <p className="admin-sidebar__user-role">{user?.role === 'admin' ? 'Administrator' : 'Editor'}</p>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout} title="Abmelden">
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        </div>
      </aside>
    </>
  );
}
