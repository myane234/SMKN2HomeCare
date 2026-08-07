import { getSession } from './auth';

/**
 * Role constants — sesuaikan dengan roles dari backend Laravel Anda.
 * Backend mengembalikan array roles, misal ['super_admin'] atau ['admin'].
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
};

/**
 * Mengambil daftar roles dari session yang tersimpan.
 * @returns {string[]} Array of role strings
 */
export function getUserRoles() {
  const session = getSession();
  if (!session) return [];

  const roles = session.roles;
  if (Array.isArray(roles)) return roles;

  // Jika roles berupa string, bungkus dalam array
  if (typeof roles === 'string') return [roles];

  return [];
}

/**
 * Cek apakah user memiliki role tertentu.
 * @param {string} role - Nama role yang dicek (misal 'super_admin')
 * @returns {boolean}
 */
export function hasRole(role) {
  return getUserRoles().includes(role);
}

/**
 * Cek apakah user adalah Super Admin.
 * @returns {boolean}
 */
export function isSuperAdmin() {
  return hasRole(ROLES.SUPER_ADMIN);
}

/**
 * Cek apakah user adalah Admin biasa.
 * @returns {boolean}
 */
export function isAdmin() {
  return hasRole(ROLES.ADMIN);
}

