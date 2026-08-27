import api from './api';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

// Helper untuk membaca property dengan safe fallbacks
export function getTextValue(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

export function generatePromoSlug(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

// ── SSR Fetch untuk Server Components ──────────────────────────────────────────
export async function getActivePromosSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/promo/active`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return extractArray(json);
  } catch (error) {
    console.warn('Gagal memuat API promo (SSR):', error);
    return [];
  }
}

export async function getPromoBySlugSSR(slug) {
  try {
    const promos = await getActivePromosSSR();
    const promo = promos.find((item) => {
      const name = getTextValue(item, ["nama_paket", "nama", "title", "judul"]);
      const id = getTextValue(item, ["id_promo", "id"]);
      return generatePromoSlug(name) === slug || id === String(slug);
    });
    return promo || null;
  } catch (error) {
    console.warn(`Gagal memuat API promo ${slug} (SSR):`, error);
    return null;
  }
}

// ── Client Side Fetch (Axios) ──────────────────────────────────────────────────
export const getActivePromos = async (params = {}) => {
  try {
    const response = await api.get('/api/promo/active', { params });
    return extractArray(response.data);
  } catch (error) {
    console.warn('Gagal memuat API promo:', error);
    return [];
  }
};

export const getPromoBySlug = async (slug) => {
  try {
    const promos = await getActivePromos();
    return promos.find((item) => {
      const name = getTextValue(item, ["nama_paket", "nama", "title", "judul"]);
      const id = getTextValue(item, ["id_promo", "id"]);
      return generatePromoSlug(name) === slug || id === String(slug);
    }) || null;
  } catch (error) {
    console.warn('Gagal memuat API promo by slug:', error);
    return null;
  }
};