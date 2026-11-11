import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

async function parseJsonResponse(response) {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `Error ${response.status}: Terjadi kesalahan pada server`);
  }
  return body;
}

/**
 * Mengambil seluruh daftar dokumen legalitas
 */
export async function getLegalitasList() {
  const res = await fetch(`${URL}/legalitas/list`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await parseJsonResponse(res);
  return body?.data || [];
}

/**
 * Mengambil detail dokumen legalitas berdasarkan key
 * key: 'syarat-ketentuan-pasien' | 'syarat-ketentuan-nakes' | 'kebijakan-privasi'
 */
export async function getLegalitasDetail(key) {
  const res = await fetch(`${URL}/legalitas/detail/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const body = await parseJsonResponse(res);
  return body?.data || null;
}

/**
 * Memperbarui dokumen legalitas berdasarkan ID (memerlukan token Admin)
 * @param {number|string} id 
 * @param {object} payload { key, title, content, is_active }
 */
export async function updateLegalitas(id, payload) {
  const res = await fetch(`${URL}/legalitas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  return await parseJsonResponse(res);
}
