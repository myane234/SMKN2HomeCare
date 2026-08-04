import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { getUserRoles } from '../utils/role';

/**
 * ProtectedRoute — melindungi route dari user yang belum login.
 *
 * Props:
 * - children: Komponen yang akan dirender jika lolos proteksi.
 * - requiredRole (optional): Role yang dibutuhkan (misal 'super_admin').
 *   Jika diberikan, user harus memiliki role tersebut untuk mengakses.
 */
export default function ProtectedRoute({ children, requiredRole, excludeSuperAdmin }) {
  // Cek login dulu
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada requiredRole, cek apakah user punya role tersebut
  if (requiredRole) {
    const userRoles = getUserRoles();
    if (!userRoles.includes(requiredRole)) {
      // Redirect ke dashboard biasa jika user tidak punya akses
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Jika ini khusus admin biasa (excludeSuperAdmin = true), tolak super_admin
  if (excludeSuperAdmin) {
    const userRoles = getUserRoles();
    if (userRoles.includes('super_admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}
