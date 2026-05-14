import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout }  from '@components/layout/AdminLayout';
import { useAuthStore } from '@stores/authStore';
import { ROUTES }       from '@config/routes';
import LoginPage        from '@pages/auth/login';
import DashboardPage    from '@pages/dashboard/index';
import ProductsPage     from '@pages/products/index';
import ProductFormPage  from '@pages/products/product-form';
import OrdersPage       from '@pages/orders/index';
import CustomersPage    from '@pages/customers/index';
import SupportPage      from '@pages/support/index';
import SettingsPage     from '@pages/settings/index';

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
      { index: true,                         element: <DashboardPage />   },
      { path: 'products',                    element: <ProductsPage />    },
      { path: 'products/new',                element: <ProductFormPage /> },
      { path: 'products/:id/edit',           element: <ProductFormPage /> },
      { path: 'orders',                      element: <OrdersPage />      },
      { path: 'customers',                   element: <CustomersPage />   },
      { path: 'support',                     element: <SupportPage />     },
      { path: 'settings',                    element: <SettingsPage />    },
    ],
  },
  {
    path:    '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
