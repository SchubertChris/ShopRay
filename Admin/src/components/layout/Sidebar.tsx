import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  MessageSquare, Settings, LogOut, ChevronRight, Mail,
  Star, Tag, RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { useBadgeStore } from '@stores/badgeStore';
import { ROUTES } from '@config/routes';
import { getAdminStats } from '../../api/adminApi';

interface SidebarProps {
  isOpen:   boolean;
  onClose:  () => void;
}

interface NavItem {
  to:      string;
  icon:    React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label:   string;
  badgeKey?: keyof ReturnType<typeof useBadgeStore.getState>;
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
      { to: ROUTES.PRODUCTS.LIST,    icon: Package,         label: 'Produkte'                                       },
      { to: ROUTES.ORDERS.LIST,      icon: ShoppingCart,    label: 'Bestellungen', badgeKey: 'pendingOrders' },
      { to: ROUTES.CUSTOMERS.LIST,   icon: Users,           label: 'Kunden'                                         },
      { to: ROUTES.RETURNS,          icon: RotateCcw,       label: 'Rücksendungen'                                  },
      { to: ROUTES.CATEGORIES,       icon: Tag,             label: 'Kategorien'                                     },
      { to: ROUTES.REVIEWS,          icon: Star,            label: 'Bewertungen'                                    },
    ],
  },
  {
    section: 'Support',
    items: [
      { to: ROUTES.SUPPORT.TICKETS,  icon: MessageSquare,   label: 'Tickets',   badgeKey: 'openTickets'  },
      { to: ROUTES.INQUIRIES,        icon: Mail,            label: 'Anfragen',  badgeKey: 'newInquiries' },
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
  const { logout }  = useAuthStore();
  const role        = useAuthStore(s => s.role);
  const navigate    = useNavigate();
  const badges      = useBadgeStore();
  const { setAll }  = useBadgeStore();

  useEffect(() => {
    getAdminStats()
      .then(s => setAll({ pendingOrders: s.pendingOrders, openTickets: s.openTickets, newInquiries: s.newInquiries }))
      .catch(() => null);
  }, [setAll]);

  const visibleNav = NAV.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (role !== 'mod') return true;
      const modHidden = [ROUTES.CATEGORIES, ROUTES.SETTINGS];
      return !modHidden.includes(item.to as typeof modHidden[number]);
    }),
  })).filter(group => group.items.length > 0);

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
          {visibleNav.map(group => (
            <div key={group.section} className="admin-sidebar__section">
              <p className="admin-sidebar__section-label">{group.section}</p>
              {group.items.map(item => {
                const count = item.badgeKey ? (badges[item.badgeKey] as number) : 0;
                return (
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
                    {count > 0 && (
                      <span className="admin-sidebar__badge">{count}</span>
                    )}
                    <ChevronRight size={12} />
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__avatar">AD</div>
          <div className="admin-sidebar__user-info">
            <p className="admin-sidebar__user-name">Admin</p>
            <p className="admin-sidebar__user-role">
              {role === 'mod' ? 'Mitarbeiter' : 'Inhaber'}
            </p>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout} title="Abmelden">
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        </div>
      </aside>
    </>
  );
}
