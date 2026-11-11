import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

// Helper untuk membuat FormData dari payload
function objectToFormData(obj) {
  const formData = new FormData();
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  return formData;
}

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

// PERUBAHAN UTAMA: Menyesuaikan mapping response dengan API contract baru
function normalizePromo(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  return {
    ...raw,
    id: raw.id ?? raw.id_promo,
    // Field diskon baru
    tipe_diskon: raw.tipe_diskon ?? 'persen',
    nilai_diskon: raw.nilai_diskon ?? 0,
    // Field layanan tunggal
    id_layanan: raw.id_layanan ?? (raw.layanan ? raw.layanan.id_layanan : null),
    layanan: raw.layanan ?? null,
    deskripsi: raw.deskripsi ?? '',
    status_promo: raw.status_promo ?? 'Tidak Aktif',
    gambar_promo: raw.gambar_promo_url ?? raw.gambar_promo ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export async function getAllPromo() {
  const res = await fetch(`${URL}/promo`, { method: 'GET', headers: buildHeaders() });
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
  // Payload sekarang mengirim: id_layanan, tipe_diskon, nilai_diskon, dll.
  const formData = objectToFormData(payload);
  
  const res = await fetch(`${URL}/promo`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
    body: formData,
  });

  const json = await parseJsonResponse(res);
  return normalizePromo(extractData(json));
}

export async function updatePromo(id_promo, payload) {
  const formData = objectToFormData(payload);
  formData.append('_method', 'PUT');

  const res = await fetch(`${URL}/promo/${encodeURIComponent(id_promo)}`, {
    method: 'POST',
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