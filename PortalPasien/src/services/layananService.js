import api from './api';

export const getLayanan = async (params = {}) => {
  try {
    const res = await api.get('/api/layanan', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching layanan:', error);
    throw error;
  }
};

export const getKategoriLayanan = async () => {
  try {
    const res = await api.get('/api/layanan/kategori');
    return res.data;
  } catch (error) {
    console.error('Error fetching kategori layanan:', error);
    throw error;
  }
};

// ── SSR-compatible fetch (untuk Server Components / Server Actions) ──────────
// Menggunakan absolute URL karena di server tidak ada window.location.
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function getLayananSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/layanan`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  } catch (error) {
    console.error('Error fetching layanan (SSR):', error);
    return [];
  }
}

export async function getKategoriLayananSSR() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/layanan/kategori`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  } catch (error) {
    console.error('Error fetching kategori layanan (SSR):', error);
    return [];
  }
}
