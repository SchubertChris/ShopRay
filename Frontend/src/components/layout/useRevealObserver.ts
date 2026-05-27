import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useRevealObserver() {
  const { pathname } = useLocation();

  useEffect(() => {
    // ── IntersectionObserver ──────────────────────────────────────────────
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (!e.isIntersecting) return;

        const el = e.target as HTMLElement;

        // data-reveal-stagger: Container → Kinder einzeln mit Versatz einblenden
        if (el.hasAttribute('data-reveal-stagger')) {
          Array.from(el.children).forEach((child, i) => {
            const c = child as HTMLElement;
            c.style.transitionDelay = `${i * 90}ms`;
            c.classList.add('is-visible');
          });
          el.classList.add('is-visible');
        } else {
          el.classList.add('is-visible');
        }

        io.unobserve(el);
      }),
      { threshold: 0.08 },
    );

    const register = () => {
      // Einzelne [data-reveal]-Elemente
      document.querySelectorAll<Element>('[data-reveal]:not(.is-visible)').forEach(el => io.observe(el));
      // Container mit gestaffelten Kindern
      document.querySelectorAll<Element>('[data-reveal-stagger]:not(.is-visible)').forEach(el => io.observe(el));
    };

    register();

    // MutationObserver: neu gerenderte Elemente (async API-Daten) nachregistrieren
    const mo = new MutationObserver(register);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
}
