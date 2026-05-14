import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrollt bei jedem Seitenwechsel automatisch nach oben.
// Eingebunden in App.tsx innerhalb des RouterProviders.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
