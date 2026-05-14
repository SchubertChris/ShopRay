import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, MapPin, Shield, Settings,
  Heart, LifeBuoy, LogOut, type LucideIcon,
} from 'lucide-react';
import { useAuth, logout } from '@features/auth';
import { ROUTES } from '@config/routes';
import { FEATURES } from '@config/features';

interface NavItem { label: string; shortLabel: string; to: string; Icon: LucideIcon; }

// ── KERN-Navigation — immer vorhanden, nicht entfernen ───────────────────────
const CORE_NAV: NavItem[] = [
  { label: 'Dashboard',     shortLabel: 'Home',       to: ROUTES.ACCOUNT.DASHBOARD, Icon: LayoutDashboard },
  { label: 'Bestellungen',  shortLabel: 'Bestellg.',  to: ROUTES.ACCOUNT.ORDERS,    Icon: Package          },
  { label: 'Adressen',      shortLabel: 'Adressen',   to: ROUTES.ACCOUNT.ADDRESSES, Icon: MapPin           },
  { label: 'Meine Daten',   shortLabel: 'Profil',     to: ROUTES.ACCOUNT.MY_DATA,   Icon: Shield           },
  { label: 'Einstellungen', shortLabel: 'Einstell.',  to: ROUTES.ACCOUNT.SETTINGS,  Icon: Settings         },
];

// ── OPTIONAL — gesteuert über src/config/features.ts ────────────────────────
const OPTIONAL_NAV: NavItem[] = [
  ...(FEATURES.wishlist ? [{ label: 'Wunschliste',   shortLabel: 'Wünsche', to: ROUTES.ACCOUNT.WISHLIST, Icon: Heart     }] : []),
  ...(FEATURES.tickets  ? [{ label: 'Meine Tickets', shortLabel: 'Tickets', to: ROUTES.ACCOUNT.TICKETS,  Icon: LifeBuoy  }] : []),
];

const ACCOUNT_NAV: NavItem[] = [
  CORE_NAV[0],
  CORE_NAV[1],
  ...OPTIONAL_NAV,
  CORE_NAV[2],
  CORE_NAV[3],
  CORE_NAV[4],
];

export function AccountLayout() {
  const { clearAuth } = useAuth();
  const navigate      = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } catch { /* Server-Error ignorieren */ }
    clearAuth();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="container account-layout">
      <div className="account-grid">
        {/* Desktop-Sidebar */}
        <aside>
          <Link to={ROUTES.HOME} className="account-nav__back">← Zurück zum Shop</Link>
          <p className="label account-nav__label">Mein Konto</p>
          <nav className="account-nav__list">
            {ACCOUNT_NAV.map(({ label, to, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `account-nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
            <div className="account-nav__divider" />
            <button className="account-nav__logout" onClick={handleLogout}>
              <LogOut size={16} strokeWidth={1.75} />
              Abmelden
            </button>
          </nav>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>

      {/* Mobile: fixe Bottom-Tab-Leiste — auf Desktop ausgeblendet */}
      <nav className="account-tab-bar" aria-label="Konto-Navigation">
        {ACCOUNT_NAV.map(({ label, shortLabel, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `account-tab-bar__item${isActive ? ' is-active' : ''}`}
            aria-label={label}
          >
            <Icon size={24} strokeWidth={1.5} />
            <span>{shortLabel}</span>
          </NavLink>
        ))}
        <button
          className="account-tab-bar__item account-tab-bar__item--logout"
          onClick={handleLogout}
          aria-label="Abmelden"
        >
          <LogOut size={22} strokeWidth={1.75} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
