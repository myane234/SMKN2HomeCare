import api from './api';

export const DEFAULT_LAYANAN = [];
export const DEFAULT_KATEGORI_LAYANAN = [];

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export const getLayanan = async (params = {}) => {
  try {
    const res = await api.get('/api/layanan', { params });
    return extractArray(res.data);
  } catch (error) {
    console.warn('Gagal memuat API layanan:', error);
    return [];
  }
};

export const getKategoriLayanan = async () => {
  try {
    const res = await api.get('/api/layanan/kategori');
    return extractArray(res.data);
  } catch (error) {
    console.warn('Gagal memuat API kategori layanan:', error);
    return [];
  }
};

// ── SSR-compatible fetch (untuk Server Components / Server Actions) ──────────
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function getLayananSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/layanan`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return extractArray(json);
  } catch (error) {
    console.warn('Gagal memuat API layanan (SSR):', error);
    return [];
  }
}

export async function getKategoriLayananSSR() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/layanan/kategori`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return extractArray(json);
  } catch (error) {
    console.warn('Gagal memuat API kategori layanan (SSR):', error);
    return [];
  }
}
