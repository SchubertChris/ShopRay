import { useEffect }       from 'react';
import { RouterProvider }  from 'react-router-dom';
import { ThemeProvider }   from './providers/ThemeProvider';
import { AuthProvider }    from './providers/AuthProvider';
import { ErrorBoundary }   from './components/ErrorBoundary';
import { GtmScript }       from './components/ui';
import { router }          from './router';
import Lenis               from 'lenis';
import { gsap }            from 'gsap';
import { ScrollTrigger }   from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <ErrorBoundary>
      <GtmScript />
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
