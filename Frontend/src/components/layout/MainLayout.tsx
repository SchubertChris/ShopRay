import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { ConsentBanner } from '@features/consent';
import { Toast, ChatWidget } from '@components/ui';

function useRevealObserver() {
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

export function MainLayout() {
  useRevealObserver();

  return (
    <>
      <ScrollToTop />
      <Header />
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
