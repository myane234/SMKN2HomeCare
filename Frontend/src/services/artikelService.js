import api from './api';

export const DEFAULT_ARTIKEL = [];

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export const getArtikel = async (params = {}) => {
  try {
    const res = await api.get('/api/artikel', { params });
    return extractArray(res.data);
  } catch (error) {
    console.warn('Gagal memuat API artikel:', error);
    return [];
  }
};

export const getArtikelBySlug = async (slug) => {
  try {
    const res = await api.get(`/api/artikel/${slug}`);
    const data = res.data?.data || res.data;
    if (data && (data.judul_artikel || data.title || data.judul)) return data;
    return null;
  } catch (error) {
    console.warn(`Gagal memuat API artikel ${slug}:`, error);
    return null;
  }
};

// ── SSR-compatible fetch (untuk Server Components) ───────────────────────────
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function getArtikelSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/artikel`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return extractArray(json);
  } catch (error) {
    console.warn('Gagal memuat API artikel (SSR):', error);
    return [];
  }
}

export async function getArtikelBySlugSSR(slug) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/artikel/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data ?? json;
    return data && (data.judul_artikel || data.title || data.judul) ? data : null;
  } catch (error) {
    console.warn(`Gagal memuat API artikel ${slug} (SSR):`, error);
    return null;
  }
}
