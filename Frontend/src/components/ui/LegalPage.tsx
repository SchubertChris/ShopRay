import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@config/routes';

interface TocItem { id: string; label: string; }

interface LegalPageProps {
  title:       string;
  eyebrow?:    string;
  lastUpdated?: string;
  toc?:        TocItem[];
  children:    ReactNode;
}

export function LegalPage({ title, eyebrow = 'Rechtliches', lastUpdated, toc, children }: LegalPageProps) {
  return (
    <>
      {/* ── Dark Header ──────────────────────────────────────────────────── */}
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero__inner">
            <div>
              <span className="legal-hero__eyebrow">{eyebrow}</span>
              <h1 className="legal-hero__title">{title}</h1>
              {lastUpdated && (
                <p className="legal-hero__date">Zuletzt aktualisiert: {lastUpdated}</p>
              )}
            </div>
            <Link to={ROUTES.HOME} className="legal-hero__back">← Zurück zum Shop</Link>
          </div>
        </div>
      </div>

      {/* ── Two-col layout ───────────────────────────────────────────────── */}
      <div className="container">
        <div className={`legal-layout${toc ? ' legal-layout--with-toc' : ''}`}>

          {toc && toc.length > 0 && (
            <aside className="legal-toc">
              <p className="legal-toc__label">Inhalt</p>
              <nav>
                {toc.map((item, i) => (
                  <a key={item.id} href={`#${item.id}`} className="legal-toc__link">
                    <span className="legal-toc__num">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          <article className="legal-content">
            {children}
          </article>

        </div>
      </div>
    </>
  );
}
