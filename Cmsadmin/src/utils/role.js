import { getSession } from "./auth";

/**
 * Role constants
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
};

/**
 * Centrally defined list of all CMS views with unique slugs.
 */
export const ALL_CMS_VIEWS = [
  {
    slug: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    category: "Umum",
  },
  {
    slug: "kelola-konten",
    label: "Kelola Konten Web",
    path: "/kelola-konten",
    category: "Konten",
  },
  {
    slug: "kelola-konten-home",
    label: "Konten Home & Hero",
    path: "/kelola-konten/home",
    category: "Konten",
  },
  {
    slug: "kelola-konten-about",
    label: "Konten Tentang Kami",
    path: "/kelola-konten/about",
    category: "Konten",
  },
  { slug: "layanan", label: "Layanan", path: "/layanan", category: "Konten" },
  { slug: "promo", label: "Promo", path: "/promo", category: "Konten" },
  { slug: "artikel", label: "Artikel", path: "/artikel", category: "Konten" },
  { slug: "ulasan", label: "Ulasan Pasien", path: "/ulasan", category: "Konten" },
  { slug: "hubungi-kami", label: "Hubungi Kami (Pesan Masuk)", path: "/hubungi-kami", category: "Konten" },
  {
    slug: "master-pasien",
    label: "Data Pasien",
    path: "/users",
    category: "Master Data",
  },
  {
    slug: "master-provinsi",
    label: "Wilayah - Provinsi",
    path: "/master-provinsi",
    category: "Master Data",
  },
  {
    slug: "master-kabupaten",
    label: "Wilayah - Kota / Kabupaten",
    path: "/master-kabupaten",
    category: "Master Data",
  },
  {
    slug: "master-kecamatan",
    label: "Wilayah - Kecamatan",
    path: "/master-kecamatan",
    category: "Master Data",
  },
  {
    slug: "master-kelurahan",
    label: "Wilayah - Kelurahan",
    path: "/master-kelurahan",
    category: "Master Data",
  },
  {
    slug: "master-barang",
    label: "Stock Barang (BHP)",
    path: "/master-barang",
    category: "Master Data",
  },
  {
    slug: "master-tarif",
    label: "Tarif Layanan",
    path: "/master-tarif",
    category: "Master Data",
  },
  {
    slug: "master-kategori-tarif",
    label: "Kategori Master Tarif",
    path: "/master-kategori-tarif",
    category: "Master Data",
  },
  {
    slug: "master-tarif-layanan",
    label: "Tarif & BHP per Layanan",
    path: "/master-tarif-layanan",
    category: "Master Data",
  },
  {
    slug: "master-komponen-tarif",
    label: "Komponen Tarif",
    path: "/master-komponen-tarif",
    category: "Master Data",
  },
  {
    slug: "master-tarif-transport",
    label: "Tarif Transport",
    path: "/master-tarif-transport",
    category: "Master Data",
  },
  {
    slug: "master-kategori",
    label: "Kategori Artikel/Layanan",
    path: "/master-kategori",
    category: "Master Data",
  },
  {
    slug: "master-kategori-pembayaran",
    label: "Kategori Pembayaran",
    path: "/master-kategori-pembayaran",
    category: "Master Data",
  },
  {
    slug: "master-metode-pembayaran",
    label: "Metode Pembayaran",
    path: "/master-metode-pembayaran",
    category: "Master Data",
  },
  {
    slug: "nakes",
    label: "Data Nakes",
    path: "/nakes",
    category: "Tenaga Medis",
  },
  {
    slug: "nakes-requests",
    label: "Registrasi Nakes",
    path: "/nakes/requests",
    category: "Tenaga Medis",
  },
  {
    slug: "booking",
    label: "Data Booking",
    path: "/booking",
    category: "Transaksi",
  },
  {
    slug: "kelola-admin",
    label: "Kelola Admin",
    path: "/kelola-admin",
    category: "Config",
  },
  {
    slug: "tier-admin",
    label: "Tier Admin",
    path: "/tier-admin",
    category: "Config",
  },
  {
    slug: "seeders",
    label: "Seeder Database",
    path: "/seeders",
    category: "Config",
  },
];

// Alias for backwards compatibility if needed
export const ALL_CMS_PAGES = ALL_CMS_VIEWS.map((v) => ({
  id: v.slug,
  slug: v.slug,
  label: v.label,
  category: v.category,
  path: v.path,
}));

/**
 * Default permissions map (using view slugs) for default tiers
 */
export const DEFAULT_TIER_PERMISSIONS = {
  "Super Admin": ["*"],
  "super-admin": ["*"],
  Admin: [
    "dashboard",
    "kelola-konten",
    "kelola-konten-home",
    "kelola-konten-about",
    "layanan",
    "promo",
    "artikel",
    "ulasan",
    "hubungi-kami",
  ],
  admin: [
    "dashboard",
    "kelola-konten",
    "kelola-konten-home",
    "kelola-konten-about",
    "layanan",
    "promo",
    "artikel",
    "ulasan",
    "hubungi-kami",
  ],
  Editor: ["dashboard", "layanan", "promo", "artikel", "ulasan", "hubungi-kami", "master-kategori"],
  editor: ["dashboard", "layanan", "promo", "artikel", "ulasan", "hubungi-kami", "master-kategori"],
};

/**
 * Get user roles list from session
 */
export function getUserRoles() {
  const session = getSession();
  if (!session) return [];
  const roles = session.roles;
  if (Array.isArray(roles)) return roles;
  if (typeof roles === "string") return [roles];
  return [];
}

/**
 * Get active user's tier name or slug
 */
export function getUserTier() {
  const session = getSession();
  if (!session) return "Admin";
  if (session.tier_slug) return session.tier_slug;
  if (session.tier_admin) return session.tier_admin;
  if (session.tier) return session.tier;
  if (hasRole(ROLES.SUPER_ADMIN)) return "Super Admin";
  return "Admin";
}

export function hasRole(role) {
  return getUserRoles().includes(role);
}

export function isSuperAdmin() {
  const tier = getUserTier().toLowerCase();
  return (
    hasRole(ROLES.SUPER_ADMIN) ||
    tier === "super admin" ||
    tier === "super-admin"
  );
}

export function isAdmin() {
  return hasRole(ROLES.ADMIN);
}

/**
 * Get user tier view permission slugs array
 */
export function getUserTierPermissions() {
  const session = getSession();
  if (!session) return [];
  if (
    session.permissions &&
    Array.isArray(session.permissions) &&
    session.permissions.length > 0
  ) {
    return session.permissions;
  }

  // Try fetching custom tiers saved in localStorage
  try {
    const raw = localStorage.getItem("cms_custom_tiers");
    if (raw) {
      const tiersObj = JSON.parse(raw);
      const userTier = getUserTier();
      if (tiersObj[userTier]) return tiersObj[userTier];
    }
  } catch {}

  const userTier = getUserTier();
  return (
    DEFAULT_TIER_PERMISSIONS[userTier] || DEFAULT_TIER_PERMISSIONS["Admin"]
  );
}

/**
 * Maps a URL path to its view slug
 */
export function getSlugByPath(path) {
  if (!path) return null;
  const cleanPath = "/" + path.replace(/^\//, "").trim();

  // Direct match
  const exact = ALL_CMS_VIEWS.find((v) => v.path === cleanPath);
  if (exact) return exact.slug;

  // Subpath prefix match (e.g. /layanan/tambah -> layanan)
  const sorted = [...ALL_CMS_VIEWS].sort(
    (a, b) => b.path.length - a.path.length,
  );
  const match = sorted.find((v) => cleanPath.startsWith(v.path));
  return match ? match.slug : null;
}

/**
 * Check if active user has permission for a specific view slug
 */
export function canAccessSlug(slug, customPermissions = null) {
  const session = getSession();
  if (!session) return false;
  if (isSuperAdmin()) return true;

  const userPermissions = customPermissions || getUserTierPermissions();
  if (userPermissions.includes("*")) return true;

  return userPermissions.includes(slug);
}

/**
 * Check if active user can access a specific route path
 */
export function canAccessPath(path, customPermissions = null) {
  if (path === "/dashboard" || path === "/") return true;
  if (isSuperAdmin()) return true;

  const slug = getSlugByPath(path);
  if (!slug) return false;

  return canAccessSlug(slug, customPermissions);
}
