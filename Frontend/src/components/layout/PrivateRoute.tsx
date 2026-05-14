import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { ROUTES } from '@config/routes';

export function PrivateRoute() {
  const isAuthenticated = useAuth(s => s.isAuthenticated);
  const location        = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
