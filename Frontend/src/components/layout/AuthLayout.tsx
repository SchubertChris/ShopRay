import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '@config/routes';
import { APP_NAME } from '@config/app';

export function AuthLayout() {
  return (
    <div className="auth-page">
      {/* Bild-Panel — nur ab lg sichtbar */}
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual__overlay" />
        <div className="auth-visual__brand">
          <span className="auth-visual__logo">{APP_NAME}<span>.</span></span>
          <p className="auth-visual__tagline">
            Kuratierter Lebensstil.<br />Bewusst gewählt.
          </p>
        </div>
      </div>

      {/* Formular-Spalte */}
      <div className="auth-form-col">
        <Link to={ROUTES.HOME} className="auth-page__back-logo">
          {APP_NAME}<span>.</span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
