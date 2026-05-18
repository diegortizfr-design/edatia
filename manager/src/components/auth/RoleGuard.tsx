import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RoleGuardProps {
  roles?: string[];
  area?: string; // If specified, user must have this area OR be ADMIN
}

export function RoleGuard({ roles, area }: RoleGuardProps) {
  const { colaborador, isLoading } = useAuth();

  if (isLoading) {
    return null; // El AppLayout ya maneja el loading principal
  }

  if (!colaborador) {
    return <Navigate to="/login" replace />;
  }

  // Admin tiene acceso absoluto
  if (colaborador.rol === 'ADMIN') {
    return <Outlet />;
  }

  // Validar rol
  if (roles && !roles.includes(colaborador.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validar area si se especifica (sac o desarrollo)
  if (area && colaborador.area !== area) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
