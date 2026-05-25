import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { useRevealObserver } from './useRevealObserver';
import { ConsentBanner } from '@features/consent';
import { Toast, ChatWidget } from '@components/ui';

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
