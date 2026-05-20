import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout }        from '@components/layout/AdminLayout';
import { useAuthStore }       from '@stores/authStore';
import { ROUTES }             from '@config/routes';
import LoginPage              from '@pages/auth/login';
import DashboardPage          from '@pages/dashboard/index';
import ProductsPage           from '@pages/products/index';
import ProductFormPage        from '@pages/products/product-form';
import OrdersPage             from '@pages/orders/index';
import OrderDetailPage        from '@pages/orders/order-detail';
import CustomersPage          from '@pages/customers/index';
import CustomerDetailPage     from '@pages/customers/customer-detail';
import SupportPage            from '@pages/support/index';
import InquiriesPage          from '@pages/inquiries/index';
import ReviewsPage            from '@pages/reviews/index';
import CategoriesPage         from '@pages/categories/index';
import SettingsPage           from '@pages/settings/index';
import ReturnsPage            from '@pages/returns/index';
import DiscountsPage          from '@pages/discounts/index';
import AnalyticsPage          from '@pages/analytics/index';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthed = useAuthStore(s => s.isAuthed);
  return isAuthed ? <>{children}</> : <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}

function RequireOwner({ children }: { children: React.ReactNode }) {
  const role = useAuthStore(s => s.role);
  if (role === null) return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  if (role !== 'owner') return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
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
      { index: true,               element: <DashboardPage />      },
      { path: 'products',          element: <ProductsPage />       },
      { path: 'products/new',      element: <RequireOwner><ProductFormPage /></RequireOwner>    },
      { path: 'products/:id/edit', element: <RequireOwner><ProductFormPage /></RequireOwner>    },
      { path: 'orders',            element: <OrdersPage />         },
      { path: 'orders/:id',        element: <OrderDetailPage />    },
      { path: 'customers',         element: <CustomersPage />      },
      { path: 'customers/:id',     element: <CustomerDetailPage /> },
      { path: 'support',            element: <SupportPage />        },
      { path: 'returns',           element: <ReturnsPage />        },
      { path: 'inquiries',         element: <InquiriesPage />      },
      { path: 'reviews',           element: <ReviewsPage />        },
      { path: 'categories',        element: <RequireOwner><CategoriesPage /></RequireOwner>     },
      { path: 'discounts',         element: <DiscountsPage />        },
      { path: 'analytics',         element: <AnalyticsPage />        },
      { path: 'settings',          element: <RequireOwner><SettingsPage /></RequireOwner>       },
    ],
  },
  {
    path:    '*',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
]);
