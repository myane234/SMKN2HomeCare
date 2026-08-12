import { getSession } from './auth';

/**
 * Role constants
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
};

/**
 * Available pages/views configuration list for permission management
 */
export const ALL_CMS_PAGES = [
  { id: '/dashboard', label: 'Dashboard', category: 'Umum' },
  { id: '/layanan', label: 'Layanan', category: 'Konten' },
  { id: '/promo', label: 'Promo', category: 'Konten' },
  { id: '/artikel', label: 'Artikel', category: 'Konten' },
  { id: '/master-kategori', label: 'Kategori Artikel/Layanan', category: 'Konten' },
  { id: '/users', label: 'Data Pasien', category: 'Master Data' },
  { id: '/master-provinsi', label: 'Wilayah - Provinsi', category: 'Master Data' },
  { id: '/master-kabupaten', label: 'Wilayah - Kota / Kabupaten', category: 'Master Data' },
  { id: '/master-barang', label: 'Stock Barang (BHP)', category: 'Master Data' },
  { id: '/master-tarif', label: 'Tarif Layanan', category: 'Master Data' },
  { id: '/master-kategori-pembayaran', label: 'Kategori Pembayaran', category: 'Master Data' },
  { id: '/master-metode-pembayaran', label: 'Metode Pembayaran', category: 'Master Data' },
  { id: '/nakes', label: 'Data Nakes', category: 'Tenaga Medis' },
  { id: '/nakes/requests', label: 'Registrasi Nakes', category: 'Tenaga Medis' },
  { id: '/booking', label: 'Data Booking', category: 'Transaksi' },
  { id: '/kelola-admin', label: 'Kelola Admin', category: 'Config' },
  { id: '/tier-admin', label: 'Tier Admin', category: 'Config' },
];

/**
 * Default permissions map for preset roles/tiers
 */
export const DEFAULT_TIER_PERMISSIONS = {
  'Super Admin': ['*'],
  'Admin': [
    '/dashboard', '/layanan', '/promo', '/artikel', '/users',
    '/master-provinsi', '/master-kabupaten', '/master-barang',
    '/master-tarif', '/master-kategori', '/master-kategori-pembayaran',
    '/master-metode-pembayaran', '/nakes', '/nakes/requests',
    '/booking', '/kelola-admin', '/tier-admin'
  ],
  'Editor': [
    '/dashboard', '/layanan', '/artikel', '/master-kategori'
  ]
};

/**
 * Mengambil daftar roles dari session.
 */
export function getUserRoles() {
  const session = getSession();
  if (!session) return [];
  const roles = session.roles;
  if (Array.isArray(roles)) return roles;
  if (typeof roles === 'string') return [roles];
  return [];
}

/**
 * Mengambil Tier Admin user saat ini.
 */
export function getUserTier() {
  const session = getSession();
  if (!session) return 'Admin';
  if (session.tier_admin) return session.tier_admin;
  if (isSuperAdmin()) return 'Super Admin';
  return session.tier || 'Admin';
}

export function hasRole(role) {
  return getUserRoles().includes(role);
}

export function isSuperAdmin() {
  return hasRole(ROLES.SUPER_ADMIN) || getUserTier() === 'Super Admin';
}

export function isAdmin() {
  return hasRole(ROLES.ADMIN);
}

/**
 * Dynamic check if the current logged in admin can access a path/view.
 */
export function canAccessPath(path, customPermissions = null) {
  const session = getSession();
  if (!session) return false;

  const tier = getUserTier();
  if (tier === 'Super Admin' || isSuperAdmin()) return true;

  // Get permissions list
  let permissions = customPermissions || session.permissions;
  
  if (!permissions) {
    // Check saved tiers in localStorage
    try {
      const savedTiers = localStorage.getItem('cms_custom_tiers');
      if (savedTiers) {
        const tiersObj = JSON.parse(savedTiers);
        if (tiersObj[tier]) {
          permissions = tiersObj[tier];
        }
      }
    } catch {}
  }

  if (!permissions) {
    permissions = DEFAULT_TIER_PERMISSIONS[tier] || DEFAULT_TIER_PERMISSIONS['Editor'];
  }

  if (permissions.includes('*')) return true;

  // Normalize path (remove sub-routes like /layanan/1/edit -> /layanan)
  const basePath = '/' + path.replace(/^\//, '').split('/')[0];
  
  return permissions.some((perm) => {
    if (perm === path) return true;
    if (perm === basePath) return true;
    if (path.startsWith(perm) && perm !== '/') return true;
    return false;
  });
}
