import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';
import { BASE_URL } from '../utils/apiClient.js';

// Helper untuk membuat FormData dari payload
function objectToFormData(obj) {
  const formData = new FormData();
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    
    // Handle array (seperti layanan_ids)
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item);
      });
    } 
    // Handle null/undefined
    else if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  return formData;
}

// Header untuk JSON (GET/DELETE)
function buildHeaders() {
  return getAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
}

async function parseJsonResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message ?? `Error ${response.status}: Terjadi kesalahan`;
    throw new Error(message);
  }
  return await response.json().catch(() => null);
}

function extractData(body) {
  return (body && typeof body === 'object' && body.data !== undefined) ? body.data : body;
}

function normalizePromo(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const layanan = Array.isArray(raw.layanans) ? raw.layanans : [];
  const layananIds = Array.isArray(raw.layanan_ids)
    ? raw.layanan_ids
    : layanan.map((item) => item.id_layanan ?? item.id ?? item.value);

  return {
    ...raw,
    id: raw.id ?? raw.id_promo ?? raw.idPromo,
    nama_paket: raw.nama_paket ?? raw.nama ?? raw.kode_promo ?? '',
    deskripsi: raw.deskripsi ?? raw.deskripsi_layanan ?? raw.deskripsiLayanan ?? '',
    diskon_persen: raw.diskon_persen ?? raw.potongan_harga ?? raw.potonganHarga ?? 0,
    status_promo: raw.status_promo ?? raw.status ?? 'Tidak Aktif',
    gambar_promo: raw.gambar_promo ?? null, // Memastikan field gambar ada
    layanan_ids: layananIds.filter(Boolean),
    layanans: layanan,
    updated_at: raw.updated_at ?? null,
  };
}

// ini buat update terakhir
export async function getAllPromo() {
  const res = await fetch(`${URL}/promo/`, { method: 'GET', headers: buildHeaders() });
  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data.map(normalizePromo) : (data ? [normalizePromo(data)] : []);
}

export async function getPromoById(id_promo) {
  const res = await fetch(`${URL}/promo/${encodeURIComponent(id_promo)}`, { method: 'GET', headers: buildHeaders() });
  const json = await parseJsonResponse(res);
  return normalizePromo(extractData(json));
}

export async function createPromo(payload) {
  const formData = objectToFormData(payload);
  
  const res = await fetch(`${URL}/promo/`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Accept': 'application/json' }), // Tanpa Content-Type (auto-set oleh browser)
    body: formData,
  });

  const json = await parseJsonResponse(res);
  return normalizePromo(extractData(json));
}

export async function updatePromo(id_promo, payload) {
  const formData = objectToFormData(payload);
  // Tambahkan _method: PUT agar Laravel mengenali request sebagai PUT meski dikirim via POST
  formData.append('_method', 'PUT');

  const res = await fetch(`${URL}/promo/${encodeURIComponent(id_promo)}`, {
    method: 'POST', // Gunakan POST untuk FormData file
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
    body: formData,
  });

  const json = await parseJsonResponse(res);
  return normalizePromo(extractData(json));
}

export async function deletePromo(id_promo) {
  const res = await fetch(`${URL}/promo/${encodeURIComponent(id_promo)}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  await parseJsonResponse(res);
  return true;
}
export const getImageUrl = (path) => {
  if (!path) return null;
  // Jika path sudah mengandung http, biarkan (karena mungkin sudah full URL)
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};