import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout, AccountLayout, PrivateRoute } from '../components/layout';
import { ROUTES } from '../config/routes';
import { FEATURES } from '../config/features';

// ── Pages ──────────────────────────────────────────────────────────────────
import HomePage          from '../pages/home/home';
import LoginPage         from '../pages/auth/login';
import RegisterPage      from '../pages/auth/register';
import CartPage          from '../pages/shop/cart';
import CheckoutPage      from '../pages/shop/checkout';
import ProductDetailPage from '../pages/shop/product-detail';
import SearchPage        from '../pages/shop/search-results';
import CategoriesPage   from '../pages/shop/categories';
import OrderSuccessPage  from '../pages/shop/order-success';
import DashboardPage     from '../pages/user/dashboard';
import OrdersPage        from '../pages/user/orders-history';
import WishlistPage      from '../pages/user/wishlist';
import AboutPage         from '../pages/common/about';
import ContactPage       from '../pages/common/contact';
import FaqPage           from '../pages/info/faq';
import ShippingPage      from '../pages/info/shipping';
import ImpressumPage     from '../pages/info/impressum';
import PrivacyPage       from '../pages/info/privacy';
import TermsPage         from '../pages/info/terms';
import NotFoundPage      from '../pages/system/not-found';
import ChatPage          from '../pages/support/chat';
import SupportPortalPage from '../pages/support/portal';
import TicketsPage       from '../pages/user/tickets';
import TicketNewPage         from '../pages/user/ticket-new';
import ForgotPasswordPage   from '../pages/auth/forgot-password';
import SettingsPage         from '../pages/user/settings';
import AddressesPage        from '../pages/user/addresses';
import OrderDetailPage      from '../pages/user/order-detail';
import MyDataPage           from '../pages/user/my-data';

// ── Router-Konfiguration ───────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ── Haupt-Layout (Header + Footer) ──────────────────────────────────────
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME,               element: <HomePage /> },
      { path: ROUTES.SHOP.PRODUCT,       element: <ProductDetailPage /> },
      { path: ROUTES.SHOP.CART,          element: <CartPage /> },

      // ── Checkout & Order-Success: Login erforderlich ───────────────────
      {
        element: <PrivateRoute />,
        children: [
          { path: ROUTES.SHOP.CHECKOUT,      element: <CheckoutPage /> },
          { path: ROUTES.SHOP.ORDER_SUCCESS, element: <OrderSuccessPage /> },
        ],
      },
      { path: ROUTES.SHOP.SEARCH,        element: <SearchPage /> },
      { path: ROUTES.SHOP.CATEGORIES,   element: <CategoriesPage /> },
      { path: ROUTES.INFO.ABOUT,         element: <AboutPage /> },
      { path: ROUTES.INFO.CONTACT,       element: <ContactPage /> },
      { path: ROUTES.INFO.FAQ,           element: <FaqPage /> },
      { path: ROUTES.INFO.SHIPPING,     element: <ShippingPage /> },
      { path: ROUTES.INFO.IMPRESSUM,     element: <ImpressumPage /> },
      { path: ROUTES.INFO.PRIVACY,       element: <PrivacyPage /> },
      { path: ROUTES.INFO.TERMS,         element: <TermsPage /> },
      { path: ROUTES.SUPPORT.CHAT,       element: <ChatPage /> },
      { path: ROUTES.SUPPORT.PORTAL,     element: <SupportPortalPage /> },

      // ── Account (Auth-geschützt + Sidebar-Layout) ─────────────────────
      {
        element: <PrivateRoute />,
        children: [
          {
            path: ROUTES.ACCOUNT.ROOT,
            element: <AccountLayout />,
            children: [
              { index: true,           element: <Navigate to={ROUTES.ACCOUNT.DASHBOARD} replace /> },
              { path: 'dashboard',     element: <DashboardPage /> },
              { path: 'orders',        element: <OrdersPage /> },
              { path: 'orders/:id',    element: <OrderDetailPage /> },
              // OPTIONAL — Schalter: src/config/features.ts → wishlist
              ...(FEATURES.wishlist ? [{ path: 'wishlist', element: <WishlistPage /> }] : []),
              // OPTIONAL — Schalter: src/config/features.ts → tickets
              ...(FEATURES.tickets ? [
                { path: 'tickets',     element: <TicketsPage /> },
                { path: 'tickets/new', element: <TicketNewPage /> },
              ] : []),
              { path: 'settings',      element: <SettingsPage /> },
              { path: 'addresses',     element: <AddressesPage /> },
              { path: 'my-data',       element: <MyDataPage /> },
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
      { path: ROUTES.AUTH.LOGIN,           element: <LoginPage /> },
      { path: ROUTES.AUTH.REGISTER,        element: <RegisterPage /> },
      { path: ROUTES.AUTH.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
]);
