import { useState, useCallback } from 'react';
import { Outlet, useLocation }   from 'react-router-dom';
import { Sidebar }               from './Sidebar';
import { TopBar }                from './TopBar';
import { useAuthStore }          from '@stores/authStore';
import { useInactivityTimeout }  from '@hooks/useInactivityTimeout';

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/products':   'Produkte',
  '/orders':     'Bestellungen',
  '/customers':  'Kunden',
  '/support':    'Support',
  '/inquiries':  'Anfragen',
  '/settings':   'Einstellungen',
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const logout   = useAuthStore(s => s.logout);
  const handleInactive = useCallback(() => { void logout(); }, [logout]);
  useInactivityTimeout(handleInactive);

  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'Admin';

  return (
    <div className="admin-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="admin-main">
        <TopBar onMenuClick={() => setSidebarOpen(o => !o)} title={title} />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
