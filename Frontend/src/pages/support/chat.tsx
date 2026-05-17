import { Navigate } from 'react-router-dom';
import { ROUTES }   from '@config/routes';

export default function ChatPage() {
  return <Navigate to={ROUTES.ACCOUNT.TICKET_NEW} replace />;
}
