import { Link } from 'react-router-dom';
import { Stars } from '@components/ui';
import { ROUTES } from '@config/routes';
import type { Product } from '@features/products';
import { HeadlineWords } from './HeadlineWords';
import { STAT_BADGES } from './home.data';

interface HeroSectionProps {
  bgUrl:     string | null;
  slots:     Product[];
  pulsing:   boolean;
  n:         number;
  cycleNext: () => void;
}

export function HeroSection({ bgUrl, slots, pulsing, n, cycleNext }: HeroSectionProps) {
  return (
    <section className="cs-hero">

      {/* Hero background: gradient renders immediately (no LCP impact); product image
          via CSS ::before — pseudo-elements are not counted as LCP candidates */}
      <div
        className="cs-hero__bg"
        style={bgUrl ? ({ '--cs-bg': `url(${bgUrl})` } as React.CSSProperties) : undefined}
        aria-hidden="true"
      />
      {/* Noise texture stays on top of bg */}
      <div className="cs-hero__noise" aria-hidden="true" />

      <div className="cs-hero__grid">

        {/* ── Left: Content ──────────────────────────────────────────── */}
        <div className="cs-hero__content">
          <span className="cs-hero__eyebrow">Einfach. Schön. Sicher.</span>

          <h1 className="cs-hero__title">
            <HeadlineWords text="Dein Produkt." />
            <br />
            <em><HeadlineWords text="Deine Marke." /></em>
          </h1>

          <p className="cs-hero__sub">
            Entdecke handverlesene Produkte, genieß schnellen Versand und verlass dich
            auf echten Support — Online-Shopping so wie es sein sollte.
          </p>

          <div className="cs-hero__ctas">
            <Link to={ROUTES.SHOP.SEARCH} className="btn btn--primary btn--lg">
              Produkte entdecken →
            </Link>
            <Link to={ROUTES.INFO.ABOUT} className="btn btn--ghost btn--lg">
              Über uns
            </Link>
          </div>

          <div className="cs-hero__social">
            <Stars rating={4.9} size={14} />
            <span>4.9 · über 1.000 Bewertungen</span>
          </div>
        </div>

        {/* ── Right: Clickable Card Stack ────────────────────────────── */}
        <div className="cs-hero__visual" aria-hidden="true">

          {/* Card deck */}
          <div
            className={`cs-hero__card-stack${pulsing ? ' is-pulsing' : ''}`}
            onClick={cycleNext}
            role={n > 1 ? 'button' : undefined}
            tabIndex={n > 1 ? 0 : undefined}
            onKeyDown={n > 1 ? e => (e.key === 'Enter' || e.key === ' ') && cycleNext() : undefined}
            aria-label={n > 1 ? 'Nächstes Produkt anzeigen' : undefined}
            title={n > 1 ? 'Klicken für nächstes Produkt' : undefined}
          >
            {/* Back card */}
            <div className="cs-hero__mock cs-hero__mock--back">
              <div className="cs-hero__mock-img cs-hero__mock-img--placeholder" />
            </div>

            {/* Mid card */}
            <div className="cs-hero__mock cs-hero__mock--mid">
              {slots[1]?.imageUrl && (
                <div className="cs-hero__mock-img">
                  <img
                    src={slots[1].imageUrl}
                    alt=""
                    className="cs-hero__mock-photo"
                    loading="lazy"
                  />
                </div>
              )}
              {!slots[1]?.imageUrl && <div className="cs-hero__mock-img cs-hero__mock-img--placeholder" />}
              <div className="cs-hero__mock-body">
                <div className="cs-hero__mock-line cs-hero__mock-line--title" />
                <div className="cs-hero__mock-footer">
                  <div className="cs-hero__mock-price" />
                  <div className="cs-hero__mock-btn" />
                </div>
              </div>
            </div>

            {/* Front card — active product */}
            <div className="cs-hero__mock cs-hero__mock--front">
              <div className="cs-hero__mock-img">
                {slots[0]?.imageUrl ? (
                  <img
                    key={slots[0].imageUrl}           // remount on change → fade animation
                    src={slots[0].imageUrl}
                    alt={slots[0].name}
                    className="cs-hero__mock-photo"
                    loading="eager"
                  />
                ) : (
                  <div className="cs-hero__mock-img--placeholder" style={{ width: '100%', height: '100%' }} />
                )}
              </div>
              <div className="cs-hero__mock-body">
                <p
                  key={slots[0]?.id}                  // remount on change → fade animation
                  className="cs-hero__mock-product-name"
                >
                  {slots[0]?.name ?? ''}
                </p>
                <div className="cs-hero__mock-footer">
                  <span className="cs-hero__mock-price-text">
                    {slots[0]?.price ? `€ ${slots[0].price}` : ''}
                  </span>
                  <div className="cs-hero__mock-btn-icon">→</div>
                </div>
              </div>
            </div>
          </div>

          {/* Click hint — only when products available */}
          {n > 1 && (
            <p className="cs-hero__click-hint">
              Klicken für nächstes Produkt
            </p>
          )}

          {/* Stat chips */}
          {STAT_BADGES.map((b, i) => (
            <div
              key={i}
              className={`cs-hero__chip ${b.cls}`}
              style={{ animationDelay: `${0.5 + i * 0.12}s` } as React.CSSProperties}
            >
              <span className="cs-hero__chip-val">{b.val}</span>
              <span className="cs-hero__chip-lbl">{b.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
