import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout, AccountLayout, PrivateRoute } from '../components/layout';
import { ROUTES } from '../config/routes';
import { FEATURES } from '../config/features';

// ── Lazy Pages ─────────────────────────────────────────────────────────────
const HomePage          = lazy(() => import('../pages/home/home'));
const LoginPage         = lazy(() => import('../pages/auth/login'));
const RegisterPage      = lazy(() => import('../pages/auth/register'));
const CartPage          = lazy(() => import('../pages/shop/cart'));
const CheckoutPage      = lazy(() => import('../pages/shop/checkout'));
const ProductDetailPage = lazy(() => import('../pages/shop/product-detail'));
const SearchPage        = lazy(() => import('../pages/shop/search-results'));
const CategoriesPage    = lazy(() => import('../pages/shop/categories'));
const OrderSuccessPage  = lazy(() => import('../pages/shop/order-success'));
const DashboardPage     = lazy(() => import('../pages/user/dashboard'));
const OrdersPage        = lazy(() => import('../pages/user/orders-history'));
const WishlistPage      = lazy(() => import('../pages/user/wishlist'));
const AboutPage         = lazy(() => import('../pages/common/about'));
const ContactPage       = lazy(() => import('../pages/common/contact'));
const FaqPage           = lazy(() => import('../pages/info/faq'));
const ShippingPage      = lazy(() => import('../pages/info/shipping'));
const ImpressumPage     = lazy(() => import('../pages/info/impressum'));
const PrivacyPage       = lazy(() => import('../pages/info/privacy'));
const TermsPage         = lazy(() => import('../pages/info/terms'));
const WiderrufPage      = lazy(() => import('../pages/info/widerruf'));
const NotFoundPage      = lazy(() => import('../pages/system/not-found'));
const ChatPage          = lazy(() => import('../pages/support/chat'));
const SupportPortalPage = lazy(() => import('../pages/support/portal'));
const TicketsPage       = lazy(() => import('../pages/user/tickets'));
const TicketNewPage     = lazy(() => import('../pages/user/ticket-new'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/forgot-password'));
const ResetPasswordPage  = lazy(() => import('../pages/auth/reset-password'));
const AuthCallbackPage   = lazy(() => import('../pages/auth/auth-callback'));
const SettingsPage       = lazy(() => import('../pages/user/settings'));
const AddressesPage      = lazy(() => import('../pages/user/addresses'));
const OrderDetailPage    = lazy(() => import('../pages/user/order-detail'));
const MyDataPage         = lazy(() => import('../pages/user/my-data'));

// ── Skeleton-Fallback ──────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
    </div>
  );
}

function lazy$(el: React.ReactElement) {
  return <Suspense fallback={<PageLoader />}>{el}</Suspense>;
}

// ── Router-Konfiguration ───────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ── Haupt-Layout (Header + Footer) ──────────────────────────────────────
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME,               element: lazy$(<HomePage />) },
      { path: ROUTES.SHOP.PRODUCT,       element: lazy$(<ProductDetailPage />) },
      { path: ROUTES.SHOP.CART,          element: lazy$(<CartPage />) },

      // ── Checkout & Order-Success: Login erforderlich ───────────────────
      {
        element: <PrivateRoute />,
        children: [
          { path: ROUTES.SHOP.CHECKOUT,      element: lazy$(<CheckoutPage />) },
          { path: ROUTES.SHOP.ORDER_SUCCESS, element: lazy$(<OrderSuccessPage />) },
        ],
      },
      { path: ROUTES.SHOP.SEARCH,        element: lazy$(<SearchPage />) },
      { path: ROUTES.SHOP.CATEGORIES,    element: lazy$(<CategoriesPage />) },
      { path: ROUTES.INFO.ABOUT,         element: lazy$(<AboutPage />) },
      { path: ROUTES.INFO.CONTACT,       element: lazy$(<ContactPage />) },
      { path: ROUTES.INFO.FAQ,           element: lazy$(<FaqPage />) },
      { path: ROUTES.INFO.SHIPPING,      element: lazy$(<ShippingPage />) },
      { path: ROUTES.INFO.IMPRESSUM,     element: lazy$(<ImpressumPage />) },
      { path: ROUTES.INFO.PRIVACY,       element: lazy$(<PrivacyPage />) },
      { path: ROUTES.INFO.TERMS,         element: lazy$(<TermsPage />) },
      { path: ROUTES.INFO.WIDERRUF,      element: lazy$(<WiderrufPage />) },
      { path: ROUTES.SUPPORT.CHAT,       element: lazy$(<ChatPage />) },
      { path: ROUTES.SUPPORT.PORTAL,     element: lazy$(<SupportPortalPage />) },

      // ── Account (Auth-geschützt + Sidebar-Layout) ─────────────────────
      {
        element: <PrivateRoute />,
        children: [
          {
            path: ROUTES.ACCOUNT.ROOT,
            element: <AccountLayout />,
            children: [
              { index: true,           element: <Navigate to={ROUTES.ACCOUNT.DASHBOARD} replace /> },
              { path: 'dashboard',     element: lazy$(<DashboardPage />) },
              { path: 'orders',        element: lazy$(<OrdersPage />) },
              { path: 'orders/:id',    element: lazy$(<OrderDetailPage />) },
              ...(FEATURES.wishlist ? [{ path: 'wishlist', element: lazy$(<WishlistPage />) }] : []),
              ...(FEATURES.tickets ? [
                { path: 'tickets',     element: lazy$(<TicketsPage />) },
                { path: 'tickets/new', element: lazy$(<TicketNewPage />) },
              ] : []),
              { path: 'settings',      element: lazy$(<SettingsPage />) },
              { path: 'addresses',     element: lazy$(<AddressesPage />) },
              { path: 'my-data',       element: lazy$(<MyDataPage />) },
            ],
          },
        ],
      },
    ],
  },

  // ── Auth-Layout (zentriert, kein Header/Footer) ──────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.AUTH.LOGIN,           element: lazy$(<LoginPage />) },
      { path: ROUTES.AUTH.REGISTER,        element: lazy$(<RegisterPage />) },
      { path: ROUTES.AUTH.FORGOT_PASSWORD, element: lazy$(<ForgotPasswordPage />) },
      { path: ROUTES.AUTH.RESET_PASSWORD,  element: lazy$(<ResetPasswordPage />) },
      { path: ROUTES.AUTH.CALLBACK,        element: lazy$(<AuthCallbackPage />) },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: lazy$(<NotFoundPage />) },
]);
