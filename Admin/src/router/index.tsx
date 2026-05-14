import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout }  from '@components/layout/AdminLayout';
import { useAuthStore } from '@stores/authStore';
import { ROUTES }       from '@config/routes';
import LoginPage        from '@pages/auth/login';
import DashboardPage    from '@pages/dashboard/index';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthed = useAuthStore(s => s.isAuthed);
  return isAuthed ? <>{children}</> : <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}

export const router = createBrowserRouter([
  {
    path:    ROUTES.AUTH.LOGIN,
    element: <LoginPage />,
  },
  {
    path:    '/',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true,                   element: <DashboardPage /> },
      { path: 'products',              element: <div className="page-header"><div className="page-header__left"><h1 className="page-header__title">Produkte</h1></div></div> },
      { path: 'orders',                element: <div className="page-header"><div className="page-header__left"><h1 className="page-header__title">Bestellungen</h1></div></div> },
      { path: 'customers',             element: <div className="page-header"><div className="page-header__left"><h1 className="page-header__title">Kunden</h1></div></div> },
      { path: 'support',               element: <div className="page-header"><div className="page-header__left"><h1 className="page-header__title">Support</h1></div></div> },
      { path: 'settings',              element: <div className="page-header"><div className="page-header__left"><h1 className="page-header__title">Einstellungen</h1></div></div> },
    ],
  },
  {
    path:    '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
