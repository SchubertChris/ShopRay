import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingCart, Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { FEATURES } from '@config/features';
import { APP_NAME } from '@config/app';
import { useCart } from '@features/cart';
import { useAuth, logout } from '@features/auth';
import { useTheme } from '@/providers/ThemeProvider';

const NAV_LINKS: { label: string; to: string }[] = [
  { label: 'Shop',         to: ROUTES.SHOP.SEARCH },
  { label: 'Kollektionen', to: ROUTES.SHOP.CATEGORIES },
  { label: 'Über uns',     to: ROUTES.INFO.ABOUT },
  { label: 'FAQ',          to: ROUTES.INFO.FAQ },
  { label: 'Kontakt',      to: ROUTES.INFO.CONTACT },
];

export function Header() {
  const cartCount = useCart(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { isAuthenticated, clearAuth } = useAuth();
  const { mode, toggleMode } = useTheme();
  const navigate                   = useNavigate();
  const [scrolled, setScrolled]    = useState(false);
  const [hidden,   setHidden]      = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const lastScrollY               = useRef(0);
  const location                  = useLocation();

  // Nav bleibt auf /shop immer sichtbar (Filterleiste würde sonst verdeckt)
  const ALWAYS_VISIBLE_PATHS = [ROUTES.SHOP.SEARCH];
  const isHome = !ALWAYS_VISIBLE_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      if (isHome && y > lastScrollY.current && y > 120) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  // Mobile Nav bei Route-Wechsel schließen; hidden zurücksetzen wenn nicht Home
  useEffect(() => {
    setMobileNav(false);
    if (!isHome) setHidden(false);
  }, [location.pathname, isHome]);

  // Hintergrund-Scroll sperren wenn Nav offen
  useEffect(() => {
    document.body.style.overflow = mobileNav ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNav]);

  const close = () => setMobileNav(false);

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    navigate(ROUTES.HOME);
  };

  return (
    <>
      <header className={`header${scrolled ? ' header--scrolled' : ''}${hidden ? ' header--hidden' : ''}`}>
        <nav className="nav">
          <Link className="nav__logo" to={ROUTES.HOME}>{APP_NAME}<span>.</span></Link>

          <ul className="nav__links">
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <Link
                  className={`nav__link${location.pathname === l.to ? ' nav__link--active' : ''}`}
                  to={l.to}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav__actions">
            {isAuthenticated ? (
              <>
                <Link className="nav__account" to={ROUTES.ACCOUNT.DASHBOARD} aria-label="Mein Konto">
                  <User size={20} strokeWidth={1.75} />
                </Link>
              </>
            ) : (
              <Link className="nav__login-btn" to={ROUTES.AUTH.LOGIN}>
                Anmelden
              </Link>
            )}

            {/* OPTIONAL — Schalter: src/config/features.ts → wishlist */}
            {FEATURES.wishlist && (
              <Link className="nav__cart" to={ROUTES.ACCOUNT.WISHLIST} aria-label="Wunschliste">
                <Heart size={20} strokeWidth={1.75} />
              </Link>
            )}

            <button
              className="nav__theme-btn"
              onClick={toggleMode}
              aria-label={mode === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            >
              {mode === 'dark'
                ? <Sun  size={18} strokeWidth={1.75} />
                : <Moon size={18} strokeWidth={1.75} />
              }
            </button>

            <Link className="nav__cart nav__cart--badge" to={ROUTES.SHOP.CART} aria-label="Warenkorb">
              <ShoppingCart size={20} strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="nav__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>

            <button className="nav__burger" onClick={() => setMobileNav(true)} aria-label="Menü öffnen">
              <Menu size={22} strokeWidth={1.75} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Nav — always mounted, open/close via CSS transitions */}
      <div
        className={`mobile-nav${mobileNav ? ' is-open' : ''}`}
        aria-hidden={!mobileNav}
        role="dialog"
        aria-label="Navigation"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div className="mobile-nav__backdrop" onClick={close} />

        {/* Panel */}
        <div className="mobile-nav__panel">
          {/* Header */}
          <div className="mobile-nav__header">
            <Link className="mobile-nav__logo" to={ROUTES.HOME} onClick={close}>
              {APP_NAME}<span>.</span>
            </Link>
            <button className="mobile-nav__close" onClick={close} aria-label="Menü schließen">
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          {/* Nummerierte Links */}
          <ul className="mobile-nav__links">
            {NAV_LINKS.map((l, idx) => (
              <li key={l.to}>
                <Link
                  className={`mobile-nav__link${location.pathname === l.to ? ' mobile-nav__link--active' : ''}`}
                  to={l.to}
                  style={{ '--i': idx } as React.CSSProperties}
                  onClick={close}
                >
                  <span className="mobile-nav__link-num">0{idx + 1}</span>
                  <span className="mobile-nav__link-label">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Quick Actions Footer */}
          <div className="mobile-nav__footer">
            <button
              className="mobile-nav__action"
              onClick={toggleMode}
              aria-label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {mode === 'dark'
                ? <Sun  size={22} strokeWidth={1.75} />
                : <Moon size={22} strokeWidth={1.75} />
              }
              <span className="mobile-nav__action-label">
                {mode === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            <Link
              to={ROUTES.SHOP.CART}
              className="mobile-nav__action"
              onClick={close}
              aria-label="Warenkorb"
            >
              <ShoppingCart size={22} strokeWidth={1.75} />
              <span className="mobile-nav__action-label">Warenkorb</span>
              {cartCount > 0 && (
                <span className="mobile-nav__action-badge">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* OPTIONAL — Schalter: src/config/features.ts → wishlist */}
            {FEATURES.wishlist && (
              <Link
                to={ROUTES.ACCOUNT.WISHLIST}
                className="mobile-nav__action"
                onClick={close}
                aria-label="Wunschliste"
              >
                <Heart size={22} strokeWidth={1.75} />
                <span className="mobile-nav__action-label">Wunschliste</span>
              </Link>
            )}

            <Link
              to={isAuthenticated ? ROUTES.ACCOUNT.DASHBOARD : ROUTES.AUTH.LOGIN}
              className="mobile-nav__action"
              onClick={close}
              aria-label={isAuthenticated ? 'Mein Konto' : 'Anmelden'}
            >
              <User size={22} strokeWidth={1.75} />
              <span className="mobile-nav__action-label">
                {isAuthenticated ? 'Konto' : 'Anmelden'}
              </span>
            </Link>

            {isAuthenticated && (
              <button
                className="mobile-nav__action mobile-nav__action--logout"
                onClick={() => { close(); handleLogout(); }}
                aria-label="Abmelden"
              >
                <LogOut size={22} strokeWidth={1.75} />
                <span className="mobile-nav__action-label">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
