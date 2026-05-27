import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Sun, Moon } from 'lucide-react';
import { Footer }        from './Footer';
import { ScrollToTop }   from './ScrollToTop';
import { useRevealObserver } from './useRevealObserver';
import { ConsentBanner } from '@features/consent';
import { Toast, ChatWidget } from '@components/ui';
import { ROUTES }        from '@config/routes';
import { APP_NAME }      from '@config/app';
import { useCart }       from '@features/cart';
import { useAuth }       from '@features/auth';
import { useTheme }      from '@providers/ThemeProvider';

const NAV_LINKS = [
  { label: 'Shop',   to: ROUTES.SHOP.SEARCH },
  { label: 'Kurse',  to: `${ROUTES.SHOP.SEARCH}?category=Kurse` },
  { label: 'Merch',  to: `${ROUTES.SHOP.SEARCH}?category=Merch` },
  { label: 'Über',   to: ROUTES.INFO.ABOUT },
] as const;

// ── HomeNav ────────────────────────────────────────────────────────────────
function HomeNav() {
  const [hasBg,      setHasBg]      = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount       = useCart(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { isAuthenticated } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { pathname }    = useLocation();

  // Close mobile panel on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => { setHasBg(window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cls = [
    'home-nav',
    hasBg      ? 'home-nav--bg'   : '',
    mobileOpen ? 'home-nav--open' : '',
  ].filter(Boolean).join(' ');

  return (
    <nav className={cls} aria-label="Hauptnavigation">
      <div className="home-nav__bar">
        <Link to={ROUTES.HOME} className="home-nav__logo" aria-label={`${APP_NAME} Startseite`}>
          {APP_NAME}
        </Link>

        <ul className="home-nav__links" role="list">
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <Link to={l.to} className="home-nav__link">{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="home-nav__actions">
          <button className="home-nav__icon-btn" onClick={toggleMode} aria-label="Farbschema wechseln">
            {mode === 'light' ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
          </button>

          <Link to={ROUTES.SHOP.CART} className="home-nav__icon-btn home-nav__cart-btn" aria-label={`Warenkorb${cartCount > 0 ? `, ${cartCount} Artikel` : ''}`}>
            <ShoppingCart size={18} strokeWidth={1.75} />
            {cartCount > 0 && <span className="home-nav__badge" aria-hidden="true">{cartCount}</span>}
          </Link>

          {isAuthenticated
            ? <Link to={ROUTES.ACCOUNT.DASHBOARD} className="home-nav__link home-nav__account-link">Account</Link>
            : <Link to={ROUTES.AUTH.LOGIN} className="btn btn--primary btn--sm home-nav__cta">Einloggen</Link>
          }

          <button
            className="home-nav__burger"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={mobileOpen}
            aria-controls="home-mobile-nav"
          >
            {mobileOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Panel ──────────────────────────────────────────────────── */}
      <div
        id="home-mobile-nav"
        className={`home-nav__mobile${mobileOpen ? ' is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <ul className="home-nav__mobile-links" role="list">
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="home-nav__mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="home-nav__mobile-footer">
          {isAuthenticated
            ? <Link to={ROUTES.ACCOUNT.DASHBOARD} className="btn btn--ghost btn--full" onClick={() => setMobileOpen(false)}>Account</Link>
            : <Link to={ROUTES.AUTH.LOGIN}         className="btn btn--primary btn--full" onClick={() => setMobileOpen(false)}>Einloggen</Link>
          }
        </div>
      </div>
    </nav>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
export function HomeLayout() {
  useRevealObserver();

  return (
    <>
      <ScrollToTop />
      <HomeNav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner />
      <Toast />
      <ChatWidget />
    </>
  );
}
