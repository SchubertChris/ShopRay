import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useRevealObserver() {
  const { pathname } = useLocation();

  useEffect(() => {
    let observer: IntersectionObserver;

    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            observer.unobserve(e.target);
          }
        }),
        { threshold: 0.1 }
      );
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(el => observer.observe(el));
    }, 50);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);
}
