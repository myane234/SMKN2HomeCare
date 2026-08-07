import api from './api';

export const getArtikel = async (params = {}) => {
  try {
    const res = await api.get('/api/artikel', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching artikel:', error);
    throw error;
  }
};

export const getArtikelBySlug = async (slug) => {
  try {
    const res = await api.get(`/api/artikel/${slug}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching artikel ${slug}:`, error);
    throw error;
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
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.data?.data)) return json.data.data;
    return [];
  } catch (error) {
    console.error('Error fetching artikel (SSR):', error);
    return [];
  }
}

export async function getArtikelBySlugSSR(slug) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/artikel/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json ?? null;
  } catch (error) {
    console.error(`Error fetching artikel ${slug} (SSR):`, error);
    return null;
  }
}
