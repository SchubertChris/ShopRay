import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useRevealObserver() {
  const { pathname } = useLocation();

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.08 },
    );

    // Alle bereits vorhandenen [data-reveal]-Elemente sofort registrieren
    const register = () => {
      document.querySelectorAll<Element>('[data-reveal]:not(.is-visible)').forEach(el => io.observe(el));
    };

    register();

    // MutationObserver: neu gerenderte Elemente (z.B. async API-Daten) nachmelden
    const mo = new MutationObserver(register);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
}
