import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider }  from './providers/ThemeProvider';
import { router }         from './router/index';
import { useAuthStore }   from './stores/authStore';

export default function App() {
  const { checkAuth, checking } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" aria-label="Prüfe Sitzung…" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
