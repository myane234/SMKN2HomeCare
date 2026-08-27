import api from './api';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

/**
 * Fetch daftar seluruh dokumen legalitas aktif (GET /api/legalitas/list).
 */
export async function getLegalitasList() {
  try {
    const res = await api.get('/api/legalitas/list', { validateStatus: s => s < 500 });
    if (res.status === 200 && res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.warn('Gagal memuat legalitas list:', error);
    return [];
  }
}

export async function getLegalitasListSSR() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/legalitas/list`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    if (json?.success && Array.isArray(json?.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.warn('Gagal memuat legalitas list (SSR):', error);
    return [];
  }
}

/**
 * Fetch detail dokumen legalitas secara publik berdasarkan key.
 * Parameter key contoh: 'kebijakan-privasi', 'syarat-ketentuan-pasien', atau 'syarat-ketentuan-nakes'
 */
export async function getLegalitasDetail(key) {
  try {
    const res = await api.get(`/api/legalitas/detail/${key}`, { validateStatus: s => s < 500 });
    if (res.status === 200 && res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.warn(`Gagal memuat legalitas detail key ${key}:`, error);
    return null;
  }
}

export async function getLegalitasDetailSSR(key) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/legalitas/detail/${key}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.warn(`Gagal memuat legalitas detail key ${key} (SSR):`, error);
    return null;
  }
}
