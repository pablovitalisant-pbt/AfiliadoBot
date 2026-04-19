import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  const { token, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  return token ? <Outlet /> : <Navigate to="/login" />;
}
