import { RouterProvider } from 'react-router-dom';
import { ThemeProvider }  from './providers/ThemeProvider';
import { AuthProvider }   from './providers/AuthProvider';
import { ErrorBoundary }  from './components/ErrorBoundary';
import { GtmScript }      from './components/ui';
import { router }         from './router';

export default function App() {
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
