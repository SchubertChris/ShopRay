import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth';
import { ROUTES } from '@config/routes';
import type { UserRole } from '@/types/user';

export default function AuthCallbackPage() {
  const navigate     = useNavigate();
  const { setAuth }  = useAuth();

  useEffect(() => {
    async function handleCallback() {
      // Supabase tauscht den Code automatisch gegen eine Session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate(ROUTES.AUTH.LOGIN, { replace: true });
        return;
      }

      const user = session.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      const parts = (profile?.name ?? '').trim().split(/\s+/);
      setAuth(
        {
          id:        user.id,
          email:     user.email!,
          firstName: parts[0] ?? '',
          lastName:  parts.slice(1).join(' '),
          role:      (profile?.role as UserRole) ?? 'customer',
          createdAt: user.created_at,
        },
        session.access_token,
      );

      navigate(ROUTES.ACCOUNT.DASHBOARD, { replace: true });
    }

    void handleCallback();
  }, [navigate, setAuth]);

  return (
    <div className="auth-callback">
      <div className="auth-callback__spinner" aria-hidden="true" />
      <p className="auth-callback__text">Anmeldung wird abgeschlossen…</p>
    </div>
  );
}
