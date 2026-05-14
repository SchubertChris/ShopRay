import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

export default function NotFoundPage() {
  return (
    <>
      <SeoMeta title="Seite nicht gefunden" noIndex />
    <div className="error-page">
      <span className="label">Fehler 404</span>
      <h1 className="error-page__code">404</h1>
      <p className="error-page__subtitle">
        Diese Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="error-page__actions">
        <Link to={ROUTES.HOME} className="btn btn--primary">
          Zur Startseite
        </Link>
        <Link to={ROUTES.SHOP.SEARCH} className="btn btn--secondary">
          Shop durchsuchen
        </Link>
      </div>
    </div>
    </>
  );
}
