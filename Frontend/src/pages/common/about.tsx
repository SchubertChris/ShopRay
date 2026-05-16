import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { IMAGES, getChapterImage, getValueImage, getTeamImage } from '@config/images';

// ── DATA ──────────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    year: '2018',
    tag: 'Gründung',
    title: 'Eine Idee. Eine Skizze. Eine Überzeugung.',
    body: 'In einem Berliner Atelier entstand die erste Kollektion — handgefertigt, materialehrlich, ohne Kompromiss. Wir kannten den Namen jedes Handwerkers. Das wollten wir nie verlieren.',
  },
  {
    year: '2020',
    tag: 'Nachhaltigkeit',
    title: 'Plastikfrei. Kein "fast" davor.',
    body: 'Wir haben die gesamte Logistik auf kompostierbare Materialien umgestellt — als eines der ersten E-Commerce-Unternehmen Deutschlands. Kein Übergangszeitraum. Overnight-Switch.',
  },
  {
    year: '2022',
    tag: 'Netzwerk',
    title: '24 Manufakturen. Alle persönlich besucht.',
    body: 'Heute arbeiten wir mit Partnern in Deutschland, Portugal, Dänemark und der Schweiz zusammen. Jede Werkstatt haben wir selbst besucht. Zertifikate sind wichtig — Menschen wichtiger.',
  },
  {
    year: '2024',
    tag: 'Meilenstein',
    title: 'B Corp. Zwei Jahre Prüfung. Ein Leben Haltung.',
    body: 'Die B Corp Zertifizierung ist das anspruchsvollste Nachhaltigkeitszertifikat für Unternehmen. Nach 24 Monaten Audit haben wir sie erhalten. Wir sind stolz — und fangen trotzdem neu an.',
  },
  {
    year: '2026',
    tag: 'Zukunft',
    title: 'Kreislauf statt Linie.',
    body: 'Die nächste Kollektion wird vollständig kreislauffähig sein. Kein Abfall, der nicht wieder zum Anfang wird. Wir arbeiten gerade daran. Komm mit.',
  },
];

const VALUES = [
  {
    num: '01',
    title: 'Materialwahl',
    sub: 'Rückwärts gedacht — vom Ende her.',
    body: 'Bevor wir ein Produkt entwerfen, stellen wir die Frage: Wo endet es? Erde, Kompost, Wiederverwertung. Kein Material ohne Exit-Plan.',
    metric: '100 %',
    unit: 'bio-zertifiziert',
  },
  {
    num: '02',
    title: 'Handwerk',
    sub: 'Maschinen können warten.',
    body: 'Meisterbetriebe mit maximal 20 Beschäftigten. Die Werkzeuge haben Geschichte. Die Hände auch. Kein Stück verlässt die Manufaktur ohne Sichtkontrolle.',
    metric: '24',
    unit: 'Manufakturen',
  },
  {
    num: '03',
    title: 'Transparenz',
    sub: 'Jede Adresse. Jeder Name.',
    body: 'Auf jedem Produkt steht die Adresse der Manufaktur. Kein PR-Text — echte Koordinaten. Du kannst hinfahren und fragen.',
    metric: '0 g',
    unit: 'Plastik',
  },
];

const METRICS = [
  { value: '2.400+', label: 'zufriedene Kunden' },
  { value: '4.9',    label: 'Sterne Bewertung' },
  { value: '0 %',    label: 'Plastikanteil' },
  { value: '2018',   label: 'gegründet' },
];

const PROCESS = [
  { num: '01', title: 'Idee & Skizze',   text: 'Papier und Stift — keine Software. Die erste Skizze entscheidet ob das Produkt weiterlebt.' },
  { num: '02', title: 'Materialwahl',    text: 'Persönlicher Besuch beim Lieferanten. Zertifikate allein reichen uns nicht.' },
  { num: '03', title: 'Prototyping',     text: 'Zwischen erster Skizze und Serienprodukt liegen durchschnittlich 7 Prototypen.' },
  { num: '04', title: 'Produktion',      text: 'Kleine Manufakturen, faire Löhne, kurze Wege. Handgemacht bedeutet hier wörtlich.' },
];

const TEAM = [
  { initial: 'S', name: 'Sarah K.',   role: 'Gründerin & CEO' },
  { initial: 'M', name: 'Marcus T.',  role: 'Head of Design' },
  { initial: 'L', name: 'Lena B.',   role: 'Sustainability Lead' },
  { initial: 'J', name: 'Jonas P.',  role: 'Manufaktur-Partner' },
];

// ── 3D TILT ───────────────────────────────────────────────────────────────

function useTilt() {
  function onMove(e: React.MouseEvent<HTMLElement>) {
    const el  = e.currentTarget;
    const r   = el.getBoundingClientRect();
    const x   = ((e.clientX - r.left) / r.width  - 0.5) * 16;
    const y   = ((e.clientY - r.top)  / r.height - 0.5) * -16;
    el.style.setProperty('--tx', `${y}deg`);
    el.style.setProperty('--ty', `${x}deg`);
  }
  function onLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.setProperty('--tx', '0deg');
    e.currentTarget.style.setProperty('--ty', '0deg');
  }
  return { onMouseMove: onMove, onMouseLeave: onLeave };
}

// ── PAGE ──────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const metricsRef  = useRef<HTMLDivElement>(null);
  const [metricsSeen, setMetricsSeen] = useState(false);
  const tilt = useTilt();

  // Parallax via CSS custom property auf :root
  useEffect(() => {
    const onScroll = () =>
      document.documentElement.style.setProperty('--about-sy', `${window.scrollY}px`);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Metrics: Blur-to-sharp Reveal
  useEffect(() => {
    const el = metricsRef.current;
    if (!el || metricsSeen) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setMetricsSeen(true); },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [metricsSeen]);

  // Scroll-Reveal für data-reveal Elemente (allgemein)
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.07 }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Timeline chapters: granulare Zoom + Transform Animationen
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-revealed'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.about-chapter').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <SeoMeta
        title="Über uns"
        description="Erfahre unsere Geschichte — wer wir sind, was wir glauben und warum wir jeden Tag für bessere Produkte arbeiten."
      />
    <div className="about-page">

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero__bg" aria-hidden="true" />

        <div className="about-hero__inner">
          <div className="about-hero__content" data-reveal>
            <span className="about-hero__eyebrow">Seit 2018</span>
            <h1 className="about-hero__title">
              Wir bauen<br />
              <em>Dinge die</em><br />
              bleiben.
            </h1>
            <p className="about-hero__sub">
              Nachhaltig aus Überzeugung, nicht aus Trend.
              Jedes Produkt ist eine Entscheidung gegen das Wegwerfen.
            </p>
            <div className="about-hero__ctas">
              <Link className="btn btn--primary btn--lg" to={ROUTES.SHOP.SEARCH}>
                Zur Kollektion
              </Link>
              <a
                className="about-hero__scroll-cta"
                href="#story"
                onClick={e => { e.preventDefault(); document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Unsere Geschichte ↓
              </a>
            </div>
          </div>

          <div className="about-hero__graphic" aria-hidden="true">
            {IMAGES.about.feature ? (
              <div className="about-photo about-photo--hero">
                <img src={IMAGES.about.feature} alt="" loading="lazy" />
                <div className="about-photo__overlay" />
              </div>
            ) : (
              <div className="ag ag--hero">
                <div className="ag__ring ag__ring--1" />
                <div className="ag__ring ag__ring--2" />
                <div className="ag__blob" />
                <div className="ag__dot ag__dot--1" />
                <div className="ag__dot ag__dot--2" />
                <div className="ag__dot ag__dot--3" />
              </div>
            )}
          </div>
        </div>

        <div className="about-hero__indicator" aria-hidden="true">
          <div className="about-hero__indicator-line" />
          <span className="about-hero__indicator-text">Scroll</span>
        </div>
      </section>

      {/* ── 2. MANIFESTO ─────────────────────────────────────────────────── */}
      <section className="about-manifesto">
        <div className="about-manifesto__track" data-reveal>
          <span className="about-manifesto__mark" aria-hidden="true">"</span>
          <blockquote className="about-manifesto__quote">
            Schönheit auf Kosten der Erde — das kommt für uns nicht in Frage.
          </blockquote>
          <cite className="about-manifesto__cite">Sarah K., Gründerin</cite>
        </div>
      </section>

      {/* ── 3. STORY TIMELINE ────────────────────────────────────────────── */}
      <section className="about-timeline" id="story">
        <div className="about-timeline__spine" aria-hidden="true" />
        {CHAPTERS.map((ch, i) => (
          <article
            key={ch.year}
            className={`about-chapter about-chapter--${i % 2 === 0 ? 'a' : 'b'}`}
          >
            <div className="about-chapter__year-bg" aria-hidden="true">{ch.year}</div>

            <div className="about-chapter__graphic">
              {getChapterImage(i) ? (
                <div className="about-photo about-photo--chapter">
                  <img src={getChapterImage(i)} alt="" loading="lazy" />
                  <div className="about-photo__overlay" />
                </div>
              ) : (
                <div className={`ag ag--chapter ag--c${(i % 4) + 1}`}>
                  <div className="ag__blob" />
                  <div className="ag__ring ag__ring--1" />
                  <div className="ag__dot ag__dot--1" />
                  <div className="ag__dot ag__dot--2" />
                </div>
              )}
            </div>

            <div className="about-chapter__body">
              <div className="about-chapter__meta">
                <span className="about-chapter__tag">{ch.tag}</span>
                <span className="about-chapter__year-num">{ch.year}</span>
              </div>
              <h2 className="about-chapter__title">{ch.title}</h2>
              <p className="about-chapter__text">{ch.body}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ── 4. VALUES 3D CARDS ───────────────────────────────────────────── */}
      <section className="about-values">
        <div className="container">
          <div className="about-values__head" data-reveal>
            <span className="label">Unsere Haltung</span>
            <h2 className="about-values__title">Drei Grundsätze.<br />Keine Ausnahmen.</h2>
          </div>
          <div className="about-values__grid">
            {VALUES.map((v, i) => (
              <div
                key={v.num}
                className={`value-card value-card--${i + 1}`}
                data-reveal
                {...tilt}
              >
                <div className="value-card__graphic">
                  {getValueImage(i) ? (
                    <div className="about-photo about-photo--value">
                      <img src={getValueImage(i)} alt="" loading="lazy" />
                      <div className="about-photo__overlay" />
                    </div>
                  ) : (
                    <div className={`ag ag--value ag--v${i + 1}`}>
                      <div className="ag__blob" />
                      <div className="ag__ring ag__ring--1" />
                      <div className="ag__dot ag__dot--1" />
                    </div>
                  )}
                </div>
                <span className="value-card__num">{v.num}</span>
                <h3 className="value-card__title">{v.title}</h3>
                <p className="value-card__sub">{v.sub}</p>
                <p className="value-card__body">{v.body}</p>
                <div className="value-card__metric">
                  <span className="value-card__metric-val">{v.metric}</span>
                  <span className="value-card__metric-unit">{v.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. METRICS ───────────────────────────────────────────────────── */}
      <section className="about-metrics-section" ref={metricsRef}>
        <div className="container">
          <div className={`about-metrics${metricsSeen ? ' is-counted' : ''}`}>
            {METRICS.map((m, i) => (
              <div key={i} className="about-metric">
                <span className="about-metric__val">{m.value}</span>
                <span className="about-metric__label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PROCESS ───────────────────────────────────────────────────── */}
      <section className="about-process">
        <div className="container">
          <div className="about-process__head" data-reveal>
            <span className="label">Wie ein Produkt entsteht</span>
            <h2 className="about-process__title">Vom Stift<br />zur Schublade.</h2>
          </div>
          <div className="about-process__grid">
            {PROCESS.map((step, i) => (
              <div key={step.num} className="process-step" data-reveal>
                <div className="process-step__graphic">
                  <div className={`ag ag--process ag--p${(i % 4) + 1}`}>
                    <div className="ag__blob" />
                    <div className="ag__ring ag__ring--1" />
                    <div className="ag__dot ag__dot--1" />
                  </div>
                </div>
                <span className="process-step__num">{step.num}</span>
                <h5 className="process-step__title">{step.title}</h5>
                <p className="process-step__text">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TEAM ──────────────────────────────────────────────────────── */}
      <section className="about-team-section">
        <div className="container">
          <div className="about-team__head" data-reveal>
            <span className="label">Die Menschen dahinter</span>
            <h2 className="about-team__title">Klein. Laut. Konsequent.</h2>
          </div>
          <div className="about-team__grid">
            {TEAM.map((m, i) => (
              <div
                key={m.name}
                className={`team-card team-card--${i + 1}`}
                data-reveal
                {...tilt}
              >
                <div className="team-card__photo">
                  {getTeamImage(i) ? (
                    <>
                      <img src={getTeamImage(i)} alt={m.name} loading="lazy" />
                      <div className="about-photo__overlay" />
                    </>
                  ) : (
                    <div className={`ag ag--team ag--t${i + 1}`}>
                      <div className="ag__blob" />
                      <div className="ag__ring ag__ring--1" />
                      <div className="ag__initial">{m.initial}</div>
                    </div>
                  )}
                </div>
                <p className="team-card__name">{m.name}</p>
                <p className="team-card__role">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA ───────────────────────────────────────────────────────── */}
      <section className="about-cta">
        <div className="about-cta__bg" aria-hidden="true" />
        <div className="container about-cta__inner" data-reveal>
          <span className="about-cta__eyebrow">Werde Teil der Geschichte.</span>
          <h2 className="about-cta__title">
            Jeder Kauf ist<br /><em>eine Entscheidung.</em>
          </h2>
          <p className="about-cta__text">
            Für Handwerk statt Masse. Für Transparenz statt Marketing.
            Für Produkte die man vererbt.
          </p>
          <div className="about-cta__actions">
            <Link className="btn btn--primary btn--lg" to={ROUTES.SHOP.SEARCH}>Zur Kollektion</Link>
            <Link className="btn btn--ghost btn--lg"  to={ROUTES.INFO.CONTACT}>Schreib uns</Link>
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
