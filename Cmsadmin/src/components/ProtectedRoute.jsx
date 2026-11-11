import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { getUserRoles, canAccessPath } from '../utils/role';

/**
 * ProtectedRoute — melindungi route dari user yang belum login atau tidak punya akses permission.
 */
export default function ProtectedRoute({ children, requiredRole, requiredPath }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRoles = getUserRoles();
    if (!userRoles.includes(requiredRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const currentPath = requiredPath || location.pathname;
  if (currentPath && currentPath !== '/dashboard' && !canAccessPath(currentPath)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
