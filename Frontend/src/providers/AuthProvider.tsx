import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth';

/**
 * Hört auf Supabase Auth-Events und hält den Zustand-Store synchron.
 * Abgedeckte Szenarien:
 *   - Logout in einem anderen Tab → alle Tabs loggen aus
 *   - Session serverseitig widerrufen (Admin, Passwort-Reset) → automatisch ausloggen
 *   - Abgelaufenes Refresh-Token beim App-Start → Zustand-Store leeren
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { clearAuth } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAuth();
      }
      // Beim App-Start: Session ungültig oder abgelaufen → Store leeren
      if (event === 'INITIAL_SESSION' && !session) {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [clearAuth]);

  return <>{children}</>;
}
