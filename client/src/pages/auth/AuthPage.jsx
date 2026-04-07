import { useLocation } from 'react-router-dom';
import Login from '../../components/landingPage/landingPage/Login';

export default function AuthPage() {
  const location = useLocation();
  const initialMode = location.pathname === '/signup' ? 'signup' : 'login';

  return <Login initialMode={initialMode} />;
}
